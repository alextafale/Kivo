import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
QWEN_MODEL = "qwen2.5:7b"

class QwenMessage(BaseModel):
    role: str  # system | user | assistant
    content: str

class ChatRequest(BaseModel):
    messages: List[QwenMessage]

@router.post("/chat")
async def chat(req: ChatRequest):
    url = f"{OLLAMA_BASE_URL}/api/chat"
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
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"ngrok-skip-browser-warning": "true"},
            )
            response.raise_for_status()
            data = response.json()
            return {"content": data["message"]["content"]}
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama tardó demasiado")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error conectando con Ollama: {str(e)}")