from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import json
from core.config import settings

bearer_scheme = HTTPBearer()

SUPABASE_JWK = {
  "x": "KyXeJ4_v8ct824moH9zWV1aOYz_gwb1wCEGQhr8BfX0",
  "y": "-kUGMAphlvf9ilSGiWNT5B4HfM06qDidZpAnPxauWUU",
  "alg": "ES256",
  "crv": "P-256",
  "ext": True,
  "kid": "a9f4a83e-d332-44b5-b134-acc0bbfc024a",
  "kty": "EC",
  "key_ops": ["verify"]
}

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWK,          # jose acepta el JWK dict directo
            algorithms=["ES256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: falta el campo sub",
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}",
        )