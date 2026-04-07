from typing import Any
import json
from sqlalchemy import text
from sqlalchemy.orm import Session
from uuid import UUID
from exceptions.negocios import NegocioNoExistente
from exceptions.sucursal import SucursalNoExistente
from schemas.admin import NegocioPatch, SucursalCreate, SucursalPatch



# =============================================================================
# Negocio
# =============================================================================

def get_negocio_admin(db: Session, negocio_id: UUID) -> dict:
    """
    Obtiene todos los campos del negocio para el panel admin.
    El middleware ya garantizó que el usuario es admin y el negocio existe.
    """
    row = db.execute(
        text(
            """
            SELECT id, slug, nombre, descripcion, logo_url, banner_url,
                   categoria, tags, pais, activo, verificado
            FROM negocios
            WHERE id = :id
            """
        ),
        {"id": negocio_id},
    ).mappings().fetchone()

    if not row:
        raise NegocioNoExistente()

    return dict(row)


def patch_negocio(db: Session, negocio_id: str, payload: NegocioPatch) -> dict:
    """
    Actualiza solo los campos enviados (PATCH semántico).
    Ignora campos None para no pisar datos existentes.
    """
    campos = payload.model_dump(exclude_none=True)

    if not campos:
        # Nada que actualizar — devolver el negocio tal como está
        return get_negocio_admin(db, negocio_id)

    # Construir SET dinámico de forma segura
    set_clause = ", ".join(f"{col} = :{col}" for col in campos)
    campos["id"] = negocio_id
    campos["actualizado_en"] = "NOW()"

    db.execute(
        text(
            f"""
            UPDATE negocios
            SET {set_clause}, actualizado_en = NOW()
            WHERE id = :id
            """
        ),
        campos,
    )
    db.commit()

    return get_negocio_admin(db, negocio_id)


# =============================================================================
# Sucursal
# =============================================================================

def create_sucursal(db: Session, payload: SucursalCreate) -> dict:
    """
    Crea una nueva sucursal. Convierte horarios Pydantic → JSONB string.
    """
    horarios_json = json.dumps(
        [h.model_dump() for h in payload.horarios],
        ensure_ascii=False,
    )

    row = db.execute(
        text(
            """
            INSERT INTO sucursales (
                negocio_id, nombre, telefono, whatsapp,
                direccion, ciudad, estado, pais, codigo_postal,
                horarios, radio_entrega_km, tiempo_entrega_min,
                acepta_efectivo, acepta_tarjeta
            ) VALUES (
                :negocio_id, :nombre, :telefono, :whatsapp,
                :direccion, :ciudad, :estado, :pais, :codigo_postal,
                :horarios::jsonb, :radio_entrega_km, :tiempo_entrega_min,
                :acepta_efectivo, :acepta_tarjeta
            )
            RETURNING id, negocio_id, nombre, telefono, whatsapp,
                      direccion, ciudad, estado, pais, codigo_postal,
                      horarios, radio_entrega_km, tiempo_entrega_min,
                      calificacion, total_reviews, activo,
                      acepta_efectivo, acepta_tarjeta
            """
        ),
        {
            "negocio_id": payload.negocio_id,
            "nombre": payload.nombre,
            "telefono": payload.telefono,
            "whatsapp": payload.whatsapp,
            "direccion": payload.direccion,
            "ciudad": payload.ciudad,
            "estado": payload.estado,
            "pais": payload.pais,
            "codigo_postal": payload.codigo_postal,
            "horarios": horarios_json,
            "radio_entrega_km": payload.radio_entrega_km,
            "tiempo_entrega_min": payload.tiempo_entrega_min,
            "acepta_efectivo": payload.acepta_efectivo,
            "acepta_tarjeta": payload.acepta_tarjeta,
        },
    ).mappings().fetchone()

    db.commit()
    return _parse_horarios(dict(row))


def patch_sucursal(db: Session, sucursal_id: str, negocio_id: str, payload: SucursalPatch) -> dict:
    """
    Actualiza campos de la sucursal.
    Valida que la sucursal pertenezca al negocio del admin (protección extra).
    """
    # Verificar que la sucursal exista y pertenezca a este negocio
    existe = db.execute(
        text(
            "SELECT 1 FROM sucursales WHERE id = :id AND negocio_id = :negocio_id"
        ),
        {"id": sucursal_id, "negocio_id": negocio_id},
    ).fetchone()

    if not existe:
        raise SucursalNoExistente()

    campos = payload.model_dump(exclude_none=True)

    if not campos:
        return get_sucursal_admin(db, sucursal_id)

    # Serializar horarios si vienen en el payload
    if "horarios" in campos:
        campos["horarios"] = json.dumps(campos["horarios"], ensure_ascii=False)
        horarios_cast = "horarios = :horarios::jsonb"
        otros = {k: v for k, v in campos.items() if k != "horarios"}
        set_parts = [horarios_cast] + [f"{col} = :{col}" for col in otros]
    else:
        otros = campos
        set_parts = [f"{col} = :{col}" for col in otros]

    set_clause = ", ".join(set_parts)
    campos["id"] = sucursal_id

    db.execute(
        text(
            f"""
            UPDATE sucursales
            SET {set_clause}, actualizado_en = NOW()
            WHERE id = :id
            """
        ),
        campos,
    )
    db.commit()

    return get_sucursal_admin(db, sucursal_id)


def get_sucursal_admin(db: Session, sucursal_id: str) -> dict:
    """Lee una sucursal con todos sus campos para la respuesta admin."""
    row = db.execute(
        text(
            """
            SELECT id, negocio_id, nombre, telefono, whatsapp,
                   direccion, ciudad, estado, pais, codigo_postal,
                   horarios, radio_entrega_km, tiempo_entrega_min,
                   calificacion, total_reviews, activo,
                   acepta_efectivo, acepta_tarjeta
            FROM sucursales
            WHERE id = :id
            """
        ),
        {"id": sucursal_id},
    ).mappings().fetchone()

    if not row:
        raise SucursalNoExistente()

    return _parse_horarios(dict(row))


# =============================================================================
# Helpers
# =============================================================================

def _parse_horarios(row: dict) -> dict:
    """
    Supabase/psycopg2 puede devolver horarios como str o como list.
    Normalizamos siempre a list[dict].
    """
    horarios = row.get("horarios", [])
    if isinstance(horarios, str):
        row["horarios"] = json.loads(horarios)
    return row


# =============================================================================
# Onboarding — crear negocio + admin entry en una sola transacción
# =============================================================================

def create_negocio_onboarding(db: Session, user_id: str, payload) -> dict:
    """
    Crea el negocio y lo vincula al user_id en negocio_admins.
    Llamado una sola vez durante el onboarding del business admin.
    """
    import re

    # Validar que el slug sea URL-friendly
    if not re.match(r'^[a-z0-9-]+$', payload.slug):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail="El slug solo puede contener letras minúsculas, números y guiones."
        )

    # 1. Crear el negocio
    negocio = db.execute(
        text(
            """
            INSERT INTO negocios (nombre, slug, categoria, descripcion, tags, pais)
            VALUES (:nombre, :slug, :categoria, :descripcion, :tags, :pais)
            RETURNING id, slug, nombre, descripcion, logo_url, banner_url,
                      categoria, tags, pais, activo, verificado
            """
        ),
        {
            "nombre":      payload.nombre,
            "slug":        payload.slug,
            "categoria":   payload.categoria,
            "descripcion": payload.descripcion,
            "tags":        payload.tags,
            "pais":        payload.pais,
        },
    ).mappings().fetchone()

    negocio_id = negocio["id"]

    # 2. Registrar al user como admin del negocio con todos los permisos
    db.execute(
        text(
            """
            INSERT INTO negocio_admins
                (negocio_id, user_id, puede_editar_menu, puede_ver_pedidos, puede_editar_negocio)
            VALUES (:negocio_id, :user_id, TRUE, TRUE, TRUE)
            ON CONFLICT (negocio_id, user_id) DO NOTHING
            """
        ),
        {"negocio_id": negocio_id, "user_id": user_id},
    )

    db.commit()
    return dict(negocio)