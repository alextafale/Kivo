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

    return [dict(row) for row in rows]