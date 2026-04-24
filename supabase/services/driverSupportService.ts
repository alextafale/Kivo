// frontend/services/driverSupportService.ts
// Servicio de Qwen para el SOS del repartidor — llama directo a Ollama

// ─── Constante de URL ────────────────────────────────────────────────────────
// Misma URL que usa geminiService.ts. Cámbiala si usas ngrok.
const OLLAMA_URL = 'http://192.168.1.93:11434/api/chat';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DriverSupportMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const DRIVER_SYSTEM_PROMPT = `Eres KivoSOS, el coordinador logístico de la plataforma Kivo (servicio de delivery en La Piedad, Michoacán, México).

Tu función es asistir EXCLUSIVAMENTE a repartidores de Kivo durante sus entregas activas.

═══════ POLÍTICAS DE KIVO QUE DEBES CONOCER ═══════

CLIENTE NO CONTESTA:
- Intenta llamarle al menos 2 veces.
- Si no contesta en 5 minutos desde la llegada, el repartidor puede retirarse con el pedido.
- El pedido se marca como "intento fallido" y soporte contacta al cliente.
- El repartidor NO pierde su pago en este caso.

RESTAURANTE CERRADO AL LLEGAR:
- Toma foto como evidencia.
- Notifica a soporte inmediatamente desde la app.
- No esperes más de 5 minutos. El pedido se cancela con pago completo al repartidor.

COMIDA DERRAMADA / DAÑADA:
- No entregues el pedido en mal estado.
- Toma fotos del daño.
- Contacta soporte: se gestiona reembolso al cliente y pago parcial al repartidor.

ACCIDENTE VIAL:
- Tu seguridad es primero. Detente en lugar seguro.
- Si hay heridos, llama al 911 inmediatamente.
- Notifica a soporte con tu ubicación. El pedido se reasigna automáticamente.
- Kivo cubre el reporte del incidente.

PEDIDO MUY LEJOS / FUERA DE ZONA:
- Si la dirección está fuera de la zona de cobertura acordada, puedes rechazar la entrega.
- Notifica a soporte para reasignación.

MAL CLIMA (lluvia, granizo):
- La decisión de continuar o pausar es tuya.
- Si decides pausar, notifica a soporte. No hay penalización por clima extremo.

═══════ REGLAS DE RESPUESTA ═══════
- Respuestas cortas y directas. Máximo 4 oraciones.
- Español mexicano natural. Tono de coordinador profesional, no robótico.
- Si la situación es urgente (accidente, violencia), prioriza siempre llamar al 911.
- No inventes políticas que no están listadas arriba.
- Si no sabes la respuesta, di: "Esta situación requiere soporte humano. Escríbenos al WhatsApp de soporte Kivo."
- Nunca respondas preguntas que no sean sobre entregas o situaciones de repartidor.`;

// ─── Función principal ────────────────────────────────────────────────────────

export async function askDriverSupport(
    userMessage: string,
    history: DriverSupportMessage[],
): Promise<string> {
    // Limitar historial a los últimos 6 mensajes para reducir tokens
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
                temperature: 0.25,   // Bajo: respuestas consistentes y confiables
                num_predict: 250,    // Corto: respuestas directas
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
    return data.message?.content?.trim() ?? 'No pude obtener respuesta. Intenta de nuevo.';
}