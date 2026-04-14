import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

QWEN_MODEL = "qwen2.5:7b"


class QwenMessage(BaseModel):
    role: str  # system | user | assistant
    content: str


class ChatRequest(BaseModel):
    messages: List[QwenMessage]


@router.get("/debug")
async def debug():
    return {"QWEN_HOST": os.getenv("QWEN_HOST", "NO DEFINIDA")}


@router.post("/chat")
async def chat(req: ChatRequest):
    # Leído en cada request con el nombre correcto de la variable
    qwen_host = os.getenv("QWEN_HOST", "http://localhost:11434")
    url = f"{qwen_host}/api/chat"

    payload = {
        "model": QWEN_MODEL,
        "messages": [m.dict() for m in req.messages],
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 800,
            "repeat_penalty": 1.2,
            "top_p": 0.85,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true",
                },
            )
            response.raise_for_status()
            data = response.json()
            return {"content": data["message"]["content"]}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama tardó demasiado")
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama respondió con error: {e.response.status_code}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error conectando con Ollama: {str(e)}",
        )