from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db.database import SessionLocal
from core.dependencies import get_current_user_id
from typing import List

router = APIRouter(tags=["Pedidos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

TEST_USER_ID = "00000000-0000-0000-0000-000000000000"

@router.get("/pedidos", summary="Obtener historial de pedidos")
def get_pedidos(db: Session = Depends(get_db)):
    query = text("""
    SELECT 
        p.id,
        p.order_number        AS "orderNumber",
        p.user_id             AS "userId",
        p.negocio_id          AS "restaurantId",
        p.estado              AS status,
        p.total,
        p.creado_en           AS date,
        p.direccion_entrega   AS "deliveryAddress",
        n.nombre              AS "restaurantName",
        n.logo_url            AS "restaurantImage"
    FROM pedidos p
    LEFT JOIN negocios n ON n.id = p.negocio_id
    WHERE p.user_id = :user_id
    ORDER BY p.creado_en DESC
""")
    result = db.execute(query, {"user_id": TEST_USER_ID})
    rows = result.mappings().all()
    return [dict(row) for row in rows]

@router.get("/pedidos/{pedido_id}", summary="Obtener pedido por ID")
def get_pedido(pedido_id: str, db: Session = Depends(get_db)):
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
    result = db.execute(query, {"pedido_id": pedido_id, "user_id": TEST_USER_ID})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return dict(row)