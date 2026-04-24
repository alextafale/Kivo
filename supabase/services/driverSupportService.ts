// frontend/services/driverSupportService.ts
// Servicio de Qwen para el SOS del repartidor — llama directo a Ollama

// ─── Constante de URL ────────────────────────────────────────────────────────
const OLLAMA_URL = 'http://192.168.1.93:11434/api/chat';

// Número de WhatsApp del equipo de soporte Kivo (formato internacional sin +)
export const SUPPORT_WHATSAPP = '523521065471'; // ← cambia al número real

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DriverSupportMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface SupportAction {
    label: string;            // Texto del botón, ej: "📍 Notificar a soporte ahora"
    whatsappTemplate: string; // Texto del mensaje (sin ubicación, se añade al presionar)
}

export interface SupportResponse {
    text: string;
    action: SupportAction | null; // null = situación menor, no requiere soporte humano
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const DRIVER_SYSTEM_PROMPT = `Eres KivoSOS, el coordinador logístico de la plataforma Kivo (delivery en La Piedad, Michoacán, México).
Tu función es asistir EXCLUSIVAMENTE a repartidores de Kivo durante sus entregas activas.

═══════ POLÍTICAS DE KIVO ═══════

CLIENTE NO CONTESTA:
- Intenta llamarle al menos 2 veces.
- Si no contesta en 5 minutos, puedes retirarte con el pedido.
- El pedido se marca como "intento fallido". No pierdes tu pago.
- NO requiere notificar a soporte (el repartidor lo resuelve solo).

RESTAURANTE CERRADO AL LLEGAR:
- Toma foto como evidencia y notifica a soporte.
- No esperes más de 5 minutos.
- Pago completo al repartidor garantizado.

COMIDA DERRAMADA / DAÑADA:
- No entregues el pedido en mal estado. Toma fotos.
- Notifica a soporte para gestionar reembolso al cliente.

ACCIDENTE VIAL:
- Tu seguridad es primero. Detente en lugar seguro.
- Si hay heridos, llama al 911 INMEDIATAMENTE.
- Notifica a soporte con tu ubicación. El pedido se reasigna automáticamente.

PEDIDO MUY LEJOS / FUERA DE ZONA:
- Puedes rechazar la entrega si está fuera de la zona acordada.
- Notifica a soporte para reasignación.

MAL CLIMA:
- La decisión de continuar es tuya. No hay penalización por clima extremo.

═══════ FORMATO DE RESPUESTA (CRÍTICO) ═══════
Responde SIEMPRE con un JSON válido. Sin texto fuera del JSON. Sin bloques markdown.

Formato base:
{"text":"Tu respuesta aquí. Corta y directa. Máximo 3 oraciones.","action":null}

Cuando la situación requiere contactar a soporte (accidente, comida dañada, restaurante cerrado, emergencia, zona incorrecta):
{"text":"Tu respuesta aquí.","action":{"label":" Notificar a soporte con mi ubicación","whatsappTemplate":"🚨 ALERTA KIVO\\n\\nSituación: [descripción específica de la emergencia]\\nSe requiere atención inmediata."}}

CUÁNDO poner action (soporte humano necesario):
- Accidente vial
- Comida derramada o dañada
- Restaurante cerrado al llegar
- Pedido fuera de zona
- Cualquier emergencia de seguridad

CUÁNDO NO poner action (repartidor lo resuelve solo):
- Cliente no contesta (tiene política clara, puede retirarse)
- Preguntas sobre políticas
- Situaciones menores de entrega

El whatsappTemplate debe describir la situación ESPECÍFICA del repartidor, no genérica.`;

// ─── Función principal ────────────────────────────────────────────────────────

export async function askDriverSupport(
    userMessage: string,
    history: DriverSupportMessage[],
): Promise<SupportResponse> {
    const recentHistory = history.slice(-6);

    const messages: DriverSupportMessage[] = [
        { role: 'system', content: DRIVER_SYSTEM_PROMPT },
        ...recentHistory,
        { role: 'user', content: userMessage },
    ];

    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen2.5:7b',
            messages,
            stream: false,
            options: {
                temperature: 0.2,
                num_predict: 300,
                repeat_penalty: 1.15,
                top_p: 0.9,
            },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('[KivoSOS] Error Ollama:', response.status, err);
        throw new Error('Error al conectar con KivoSOS');
    }

    const data = await response.json();
    const raw = data.message?.content?.trim() ?? '';

    return parseResponse(raw);
}

// ─── Parser: extrae JSON de la respuesta de Qwen ─────────────────────────────

function parseResponse(raw: string): SupportResponse {
    try {
        // Limpiar bloques markdown que Qwen a veces añade
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = clean.indexOf('{');
        if (start === -1) throw new Error('Sin JSON');

        const parsed = JSON.parse(clean.slice(start));

        return {
            text: parsed.text ?? 'No pude procesar la respuesta. Intenta de nuevo.',
            action: parsed.action ?? null,
        };
    } catch {
        // Fallback: tratar la respuesta como texto plano sin acción
        console.warn('[KivoSOS] Respuesta no era JSON, usando texto plano');
        return { text: raw || 'No pude obtener respuesta. Intenta de nuevo.', action: null };
    }
}

// ─── Construcción del mensaje de WhatsApp con ubicación ──────────────────────

export function buildWhatsAppMessage(
    template: string,
    coords: { latitude: number; longitude: number },
    driverName?: string,
): string {
    const mapsLink = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
    const nombre = driverName ? `\nRepartidor: ${driverName}` : '';
    return `${template}${nombre}\n\n Ubicación en tiempo real:\n${mapsLink}`;
}