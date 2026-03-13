from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.database import SessionLocal
from core.dependencies import get_current_user_id
from models.pedidos import Pedido
from models.pedido_items import PedidoItem
from schemas.pedidos import PedidoIn, PedidoOut
import uuid

router = APIRouter(tags=["Pedidos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/pedidos", summary="Obtener historial de pedidos")
def get_pedidos(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    query = text("""
        SELECT 
            p.id,
            p.order_number          AS "orderNumber",
            p.user_id               AS "userId",
            p.negocio_id            AS "negocioId",
            p.sucursal_id           AS "sucursalId",
            p.repartidor_id         AS "repartidorId",
            p.domicilio_id          AS "domicilioId",
            p.estado                AS status,
            p.total,
            p.subtotal,
            p.descuento,
            p.costo_envio           AS "costoEnvio",
            p.propina,
            p.notas,
            p.tiempo_estimado_min   AS "tiempoEstimadoMin",
            p.direccion_entrega     AS "deliveryAddress",
            p.cancelado_en          AS "canceladoEn",
            p.motivo_cancelacion    AS "motivoCancelacion",
            p.creado_en             AS date,
            n.nombre                AS "restaurantName",
            COALESCE(n.logo_url, '') AS "restaurantImage"
        FROM pedidos p
        LEFT JOIN negocios n ON n.id = p.negocio_id
        WHERE p.user_id = :user_id
        ORDER BY p.creado_en DESC
    """)
    result = db.execute(query, {"user_id": user_id})
    rows = result.mappings().all()
    return [dict(row) for row in rows]


@router.get("/pedidos/{pedido_id}", summary="Obtener pedido por ID")
def get_pedido(
    pedido_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    query = text("""
        SELECT 
            p.*,
            n.nombre                AS "restaurantName",
            COALESCE(n.logo_url, '') AS "restaurantImage"
        FROM pedidos p
        LEFT JOIN negocios n ON n.id = p.negocio_id
        WHERE p.id = :pedido_id
        AND p.user_id = :user_id
    """)
    result = db.execute(query, {"pedido_id": pedido_id, "user_id": user_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return dict(row)


@router.post("/pedidos", response_model=PedidoOut, summary="Crear pedido")
def create_pedido(
    pedido_in: PedidoIn,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
   

    # 1. Obtener info de la sucursal
    sucursal = db.execute(
        text("SELECT * FROM sucursales WHERE id = :id"),
        {"id": str(pedido_in.sucursal_id)}
    ).mappings().first()

    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    # 2. Obtener dirección del domicilio
    domicilio = db.execute(
        text("SELECT * FROM domicilios WHERE id = :id"),
        {"id": str(pedido_in.domicilio_id)}
    ).mappings().first()

    if not domicilio:
        raise HTTPException(status_code=404, detail="Domicilio no encontrado")

    direccion_entrega = f"{domicilio['calle']} {domicilio['numero_ext']}, {domicilio['colonia']}, {domicilio['ciudad']}, {domicilio['estado']}"

    # 3. Calcular totales con snapshot de precios
    subtotal = sum(item.precio_unitario * item.cantidad for item in pedido_in.items)
    costo_envio = sucursal.get("costo_envio", 0) or 0
    descuento = 0
    propina = pedido_in.propina or 0
    total = subtotal + costo_envio - descuento + propina

    # 4. Generar order_number
    order_number = f"PID-{uuid.uuid4().hex[:6].upper()}"

    # 5. Crear el pedido
    pedido = Pedido(
        id=uuid.uuid4(),
        user_id=user_id,
        sucursal_id=pedido_in.sucursal_id,
        negocio_id=sucursal["negocio_id"],
        domicilio_id=pedido_in.domicilio_id,
        direccion_entrega=direccion_entrega,
        order_number=order_number,
        estado="pending",
        notas=pedido_in.notas,
        cupon_id=pedido_in.cupon_id,
        subtotal=subtotal,
        costo_envio=costo_envio,
        descuento=descuento,
        propina=propina,
        total=total,
    )
    db.add(pedido)
    db.flush()

    # 6. Crear los items con snapshot de precios
    for item in pedido_in.items:
        pedido_item = PedidoItem(
            id=uuid.uuid4(),
            pedido_id=pedido.id,
            menu_item_id=item.menu_item_id,
            nombre=item.nombre,
            precio_unitario=item.precio_unitario,
            cantidad=item.cantidad,
            personalizaciones=item.personalizaciones,
            subtotal=item.precio_unitario * item.cantidad,
            notas=item.notas,
        )
        db.add(pedido_item)

    db.commit()
    db.refresh(pedido)

    # 7. Cargar los items del pedido
    items = db.query(PedidoItem).filter(PedidoItem.pedido_id == pedido.id).all()
    pedido.items = items

    return pedido