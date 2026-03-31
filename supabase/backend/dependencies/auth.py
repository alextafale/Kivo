# app/dependencies/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import httpx
from core.config import settings
from uuid import UUID

security = HTTPBearer()

# Clave pública de Supabase para verificar tokens ES256
_JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
_jwks_cache: dict = {}

def _get_public_key(kid: str):
    global _jwks_cache
    if not _jwks_cache:
        response = httpx.get(_JWKS_URL)
        response.raise_for_status()
        _jwks_cache = {key["kid"]: key for key in response.json()["keys"]}
    return _jwks_cache.get(kid)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    try:
        # Leer el header sin verificar para obtener el kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg", "HS256")

        if alg == "ES256":
            # Token firmado con clave privada de Supabase → verificar con JWKS
            key_data = _get_public_key(kid)
            if not key_data:
                raise HTTPException(status_code=401, detail="Invalid token")
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Token firmado con JWT secret (HS256) — flujo anterior
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": UUID(user_id)}

    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token")