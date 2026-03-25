from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from exceptions.isDriver import RepartidorYaExiste, RepartidorNoEncontrado
from schemas.repartidores import RepartidorRegistro, RepartidorEstadoUpdate


# ── Registro ──────────────────────────────────────────────────────────────────

def registrar_repartidor(db: Session, user_id: str, data: RepartidorRegistro) -> dict:
    """
    Crea un perfil de repartidor para el usuario autenticado.
    Lanza RepartidorYaExiste si ya tiene uno.
    """
    # Verificar que no exista ya un perfil
    existente = db.execute(
        text("SELECT id FROM repartidores WHERE user_id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).fetchone()

    if existente:
        raise RepartidorYaExiste()

    # Verificar que el usuario tenga role 'driver' en profiles
    profile = db.execute(
        text("SELECT role FROM profiles WHERE id = :user_id LIMIT 1"),
        {"user_id": user_id},
    ).fetchone()

    if not profile or profile.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El perfil debe tener role 'driver' para registrarse como repartidor.",
        )

    # Insertar repartidor
    result = db.execute(
        text(
            """
            INSERT INTO repartidores (user_id, tipo, vehiculo, placa)
            VALUES (:user_id, :tipo, :vehiculo, :placa)
            RETURNING
                id, user_id, negocio_id, tipo, estado,
                vehiculo, placa, calificacion, total_entregas,
                activo, creado_en, actualizado_en
            """
        ),
        {
            "user_id": user_id,
            "tipo":    data.tipo.value,
            "vehiculo": data.vehiculo,
            "placa":    data.placa,
        },
    ).mappings().first()

    db.commit()
    return dict(result)


# ── Cambio de estado ──────────────────────────────────────────────────────────

def actualizar_estado(db: Session, user_id: str, data: RepartidorEstadoUpdate) -> dict:
    """
    Actualiza el estado del repartidor (offline / available / busy).
    Lanza RepartidorNoEncontrado si el usuario no tiene perfil activo.
    """
    result = db.execute(
        text(
            """
            UPDATE repartidores
            SET
                estado        = :estado,
                actualizado_en = :now
            WHERE user_id = :user_id
              AND activo   = TRUE
            RETURNING
                id, user_id, negocio_id, tipo, estado,
                vehiculo, placa, calificacion, total_entregas,
                activo, creado_en, actualizado_en
            """
        ),
        {
            "estado":  data.estado.value,
            "now":     datetime.now(timezone.utc),
            "user_id": user_id,
        },
    ).mappings().first()

    if not result:
        raise RepartidorNoEncontrado()

    db.commit()
    return dict(result)


# ── Pedidos disponibles ───────────────────────────────────────────────────────

def get_pedidos_disponibles(db: Session) -> list[dict]:
    """
    Retorna los pedidos en estado 'ready' que aún no tienen repartidor asignado.
    Cualquier repartidor 'available' puede verlos para tomarlos.
    """
    rows = db.execute(
        text(
            """
            SELECT
                p.id,
                p.order_number,
                p.sucursal_id,
                p.negocio_id,
                n.nombre          AS negocio_nombre,
                p.direccion_entrega,
                p.total,
                p.costo_envio,
                p.creado_en
            FROM pedidos p
            JOIN negocios n ON n.id = p.negocio_id
            WHERE p.estado        = 'ready'
              AND p.repartidor_id IS NULL
            ORDER BY p.creado_en ASC
            """
        )
    ).mappings().all()
# ── Tomar pedido ──────────────────────────────────────────────────────────────

def tomar_pedido(db: Session, user_id: str, pedido_id: str) -> dict:
    """
    El repartidor toma un pedido 'ready' sin asignar.
    - Asigna repartidor_id al pedido
    - Cambia estado del pedido a 'picked_up'
    - Cambia estado del repartidor a 'busy'
    Todo en una transacción — si algo falla, revierte.
    """
    # 1. Verificar que el repartidor existe y está available
    repartidor = db.execute(
        text("""
            SELECT id FROM repartidores
            WHERE user_id = :user_id AND activo = TRUE AND estado = 'available'
        """),
        {"user_id": user_id},
    ).fetchone()

    if not repartidor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes estar disponible para tomar un pedido.",
        )

    # 2. Verificar que el pedido sigue disponible (ready + sin repartidor)
    # El SELECT FOR UPDATE bloquea la fila para evitar que dos repartidores
    # tomen el mismo pedido al mismo tiempo (race condition)
    pedido = db.execute(
        text("""
            SELECT id FROM pedidos
            WHERE id = :pedido_id
              AND estado = 'ready'
              AND repartidor_id IS NULL
            FOR UPDATE SKIP LOCKED
        """),
        {"pedido_id": pedido_id},
    ).fetchone()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este pedido ya fue tomado por otro repartidor.",
        )

    now = datetime.now(timezone.utc)

    # 3. Asignar repartidor al pedido y avanzar estado
    db.execute(
        text("""
            UPDATE pedidos
            SET repartidor_id  = :repartidor_id,
                estado         = 'picked_up',
                recogido_en    = :now,
                actualizado_en = :now
            WHERE id = :pedido_id
        """),
        {"repartidor_id": str(repartidor.id), "now": now, "pedido_id": pedido_id},
    )

    # 4. Poner al repartidor como busy
    db.execute(
        text("""
            UPDATE repartidores
            SET estado         = 'busy',
                actualizado_en = :now
            WHERE user_id = :user_id
        """),
        {"now": now, "user_id": user_id},
    )

    db.commit()

    return {"ok": True, "pedido_id": pedido_id, "estado": "picked_up"}
    
    return [dict(row) for row in rows]