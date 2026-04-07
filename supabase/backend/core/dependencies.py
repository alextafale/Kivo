from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests
from functools import lru_cache

from core.config import settings


bearer_scheme = HTTPBearer()

@lru_cache()
def get_jwks():
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"

    response = requests.get(url, timeout=10)
    response.raise_for_status()

    return response.json()
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials

    try:
        jwks = get_jwks()

        unverified_header = jwt.get_unverified_header(token)

        key = next(
            k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]
        )

        payload = jwt.decode(
            token,
            key,
            algorithms=["ES256"],
            audience="authenticated",
        )

        return payload

    except StopIteration:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave pública no encontrada",
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
    
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    payload = get_current_user(credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido: falta el campo sub",
        )
    return user_id