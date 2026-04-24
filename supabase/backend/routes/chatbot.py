import os
import json
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

QWEN_MODEL = "qwen2.5:7b"


class QwenMessage(BaseModel):
    role: str  # system | user | assistant
    content: str


class ChatRequest(BaseModel):
    messages: List[QwenMessage]


# ─── Modelos especializados ───────────────────────────────────────────────────

class MenuMagicRequest(BaseModel):
    dish_name: str
    category: Optional[str] = None
    price: Optional[str] = None

class ReviewAnalysisRequest(BaseModel):
    reviews: List[dict]  # [{rating, comentario, ...}]
    negocio_nombre: Optional[str] = None

class DriverSupportRequest(BaseModel):
    message: str
    history: Optional[List[QwenMessage]] = []


# ─── Helper interno ───────────────────────────────────────────────────────────

async def _call_ollama(messages: list, temperature: float = 0.4, num_predict: int = 600) -> str:
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    url = f"{ollama_base_url}/api/chat"
    payload = {
        "model": QWEN_MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": num_predict,
            "repeat_penalty": 1.15,
            "top_p": 0.85,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama tardó demasiado")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ollama respondió con error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error conectando con Ollama: {str(e)}")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/debug")
async def debug():
    return {"OLLAMA_BASE_URL": os.getenv("OLLAMA_BASE_URL", "NO DEFINIDA")}


@router.post("/chat")
async def chat(req: ChatRequest):
    content = await _call_ollama([m.dict() for m in req.messages])
    return {"content": content}


@router.post("/menu-magic")
async def menu_magic(req: MenuMagicRequest):
    """
    Recibe el nombre de un platillo y genera automáticamente:
    descripción irresistible, tags sugeridos y tiempo de preparación.
    Responde SOLO en JSON válido.
    """
    system_prompt = (
        "Eres un experto en marketing gastronómico y menús de restaurante. "
        "Cuando el usuario te dé el nombre de un platillo (y opcionalmente categoría y precio), "
        "debes responder ÚNICAMENTE con un JSON válido con exactamente estas claves:\n"
        '{"descripcion": "...", "tags": ["...", "..."], "prep_time": "15"}\n\n'
        "Reglas:\n"
        "- descripcion: 2-3 oraciones apetitosas y emocionales, máximo 150 caracteres.\n"
        "- tags: entre 2 y 4 etiquetas del siguiente listado: "
        "[Vegetarian, Vegan, Spicy, Gluten-Free, Bestseller, New, Featured]\n"
        "- prep_time: solo el número en minutos (ej: '15', '20', '30').\n"
        "- No agregues nada fuera del JSON. No uses markdown ni comillas extras.\n"
        "- Responde en español."
    )

    user_msg = f"Platillo: {req.dish_name}"
    if req.category:
        user_msg += f"\nCategoría: {req.category}"
    if req.price:
        user_msg += f"\nPrecio: ${req.price}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    raw = await _call_ollama(messages, temperature=0.6, num_predict=300)

    # Intentar parsear JSON de la respuesta
    try:
        # Limpiar posibles marcadores de markdown
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        result = json.loads(clean)
        return result
    except Exception:
        # Si falla el parse, devolver el texto crudo para que el frontend lo maneje
        return {"raw": raw, "error": "No se pudo parsear JSON"}


@router.post("/review-analysis")
async def review_analysis(req: ReviewAnalysisRequest):
    """
    Recibe una lista de reseñas y genera un análisis ejecutivo de sentimiento.
    """
    if not req.reviews:
        raise HTTPException(status_code=400, detail="No hay reseñas para analizar")

    system_prompt = (
        "Eres un analista de negocio especializado en gastronomía y experiencia del cliente. "
        "Recibirás una lista de reseñas de clientes de un restaurante. "
        "Tu tarea es generar un resumen ejecutivo BREVE y ÚTIL para el dueño del negocio. "
        "El resumen debe:\n"
        "1. Mencionar el sentimiento general (positivo/neutro/negativo) con un emoji\n"
        "2. Destacar 1-2 puntos fuertes que los clientes repiten\n"
        "3. Señalar 1-2 áreas de mejora concretas si las hay\n"
        "4. Dar 1 recomendación accionable\n"
        "Sé directo, usa lenguaje informal pero profesional. Máximo 120 palabras. Responde en español."
    )

    # Preparar resumen de reseñas
    resumen_reviews = []
    for r in req.reviews[:20]:  # Máximo 20 reseñas para no saturar el contexto
        entrada = f"- Rating: {r.get('rating_general', r.get('rating', '?'))}/5"
        if r.get('comentario'):
            entrada += f" | Comentario: {r['comentario'][:100]}"
        resumen_reviews.append(entrada)

    negocio_txt = f"Negocio: {req.negocio_nombre}\n" if req.negocio_nombre else ""
    user_msg = f"{negocio_txt}Reseñas recientes ({len(req.reviews)} en total):\n" + "\n".join(resumen_reviews)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]

    analysis = await _call_ollama(messages, temperature=0.3, num_predict=300)
    return {"analysis": analysis, "total_reviews": len(req.reviews)}


@router.post("/driver-support")
async def driver_support(req: DriverSupportRequest):
    """
    Chatbot SOS para repartidores. Actúa como coordinador logístico de Kivo
    y conoce las políticas de la plataforma.
    """
    system_prompt = (
        "Eres KivoSOS, el asistente de soporte logístico de Kivo Delivery para repartidores. "
        "Tu rol es actuar como un coordinador experto que ayuda a los repartidores a resolver "
        "situaciones difíciles durante sus entregas. Conoces las políticas de Kivo:\n\n"
        "POLÍTICAS CLAVE:\n"
        "- Cliente no contesta: Llama 2 veces; si no responde en 5 minutos, puedes retirarte y marcar 'cliente no disponible'.\n"
        "- Restaurante cerrado al llegar: Tomar foto como evidencia, reportar en la app, el pedido se cancela automáticamente.\n"
        "- Comida derramada o dañada: Tomar foto, contactar soporte. Si es culpa del restaurante, el negocio asume el costo.\n"
        "- Accidente vial: Tu seguridad es primero. Detente en lugar seguro, llama a emergencias si es necesario, luego reporta a Kivo.\n"
        "- Pedido muy lejos de la ruta: Si excede 3km del radio acordado, puedes rechazarlo sin penalización.\n\n"
        "ESTILO:\n"
        "- Sé directo, empático y práctico.\n"
        "- Responde en máximo 3-4 oraciones.\n"
        "- Cuando aplique, sugiere el siguiente paso concreto.\n"
        "- Usa lenguaje informal pero profesional.\n"
        "- Responde en español."
    )

    history = [m.dict() for m in (req.history or [])]
    messages = [{"role": "system", "content": system_prompt}] + history + [
        {"role": "user", "content": req.message}
    ]

    response = await _call_ollama(messages, temperature=0.4, num_predict=250)
    return {"content": response}