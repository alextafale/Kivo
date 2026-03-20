from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.algorithms import ECAlgorithm
import json
from core.config import settings

bearer_scheme = HTTPBearer()

# Clave pública de Supabase en formato JWK
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

# Convertir JWK a clave pública que PyJWT puede usar
public_key = ECAlgorithm.from_jwk(json.dumps(SUPABASE_JWK))

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Valida el JWT firmado por Supabase y retorna el user_id (sub).
    El cliente Expo debe enviar el header:
        Authorization: Bearer <supabase_access_token>
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            public_key,
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
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}",
        )