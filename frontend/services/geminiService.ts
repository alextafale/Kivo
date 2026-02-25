// frontend/services/geminiService.ts
import { db } from '../config/firenaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  limit,
} from 'firebase/firestore';
import { Linking } from 'react-native';

import { Order, OrderItem } from '../types/order';

// ─── Tipos Firestore ──────────────────────────────────────────────────────────

export interface MenuItem {
  nombre: string;
  precio: number;
  descripcion: string;
}

export interface Negocio {
  id: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  horario: string;
  telefono: string;
  whatsapp: string; // formato: 5215512345678 (sin + ni espacios)
  categoria: string;
  calificacion: number;
  menu: MenuItem[];
}

// Usa los mismos tipos que tu types/order.ts
export interface PedidoEnCurso {
  negocio: Negocio | null;
  items: OrderItem[]; // { name, quantity, price }
  direccionEntrega: string;
  notas: string;
}

// ─── Cargar negocios desde Firestore ─────────────────────────────────────────

export async function cargarNegocios(): Promise<Negocio[]> {
  try {
    const q = query(collection(db, 'negocios'), limit(30));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Negocio[];
  } catch (error) {
    console.error('Error cargando negocios:', error);
    return [];
  }
}

// ─── Guardar pedido en Firestore ──────────────────────────────────────────────
// Devuelve un Order compatible con tu types/order.ts para navegar a orderTracking

export async function guardarPedido(
  pedido: PedidoEnCurso
): Promise<{ pedidoId: string; order: Order } | null> {
  if (!pedido.negocio || pedido.items.length === 0) return null;

  const total = pedido.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNumber = `PID-${Date.now().toString().slice(-6)}`;

  try {
    const docRef = await addDoc(collection(db, 'pedidos'), {
      negocioId: pedido.negocio.id,
      negocioNombre: pedido.negocio.nombre,
      negocioWhatsapp: pedido.negocio.whatsapp,
      items: pedido.items,
      total,
      direccionEntrega: pedido.direccionEntrega,
      notas: pedido.notas,
      estado: 'pending',
      orderNumber,
      creadoEn: Timestamp.now(),
    });

    // Objeto Order listo para pasar a la ruta 'orderTracking'
    const order: Order = {
      id: docRef.id,
      restaurantName: pedido.negocio.nombre,
      restaurantImage: '',
      items: pedido.items,
      total,
      status: 'pending',
      date: new Date(),
      orderNumber,
      deliveryAddress: pedido.direccionEntrega,
    };

    return { pedidoId: docRef.id, order };
  } catch (error) {
    console.error('Error guardando pedido:', error);
    return null;
  }
}

// ─── Enviar pedido por WhatsApp ───────────────────────────────────────────────

export async function enviarPedidoWhatsApp(pedido: PedidoEnCurso, pedidoId: string) {
  if (!pedido.negocio) return;

  const total = pedido.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemsTexto = pedido.items
    .map(i => `  • ${i.quantity}x ${i.name} — $${i.price * i.quantity}`)
    .join('\n');

  const mensaje =
    `🛵 *NUEVO PEDIDO — Pidelo App*\n\n` +
    `📋 *#${pedidoId.slice(-6).toUpperCase()}*\n\n` +
    `${itemsTexto}\n\n` +
    `💰 *Total: $${total}*\n\n` +
    `📍 *Entrega:* ${pedido.direccionEntrega}\n` +
    (pedido.notas ? `📝 *Notas:* ${pedido.notas}\n` : '') +
    `\n_Enviado desde Pidelo App_`;

  const waUrl = `whatsapp://send?phone=${pedido.negocio.whatsapp}&text=${encodeURIComponent(mensaje)}`;
  const webUrl = `https://wa.me/${pedido.negocio.whatsapp}?text=${encodeURIComponent(mensaje)}`;

  const canOpen = await Linking.canOpenURL(waUrl);
  await Linking.openURL(canOpen ? waUrl : webUrl);
}

// ─── Ollama (llama3) ──────────────────────────────────────────────────────────

const OLLAMA_URL = 'http://192.168.1.100:11434/api/chat';
const OLLAMA_MODEL = 'llama3';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

// Formato interno de Ollama
interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(negocios: Negocio[]): string {
  const info = negocios
    .map(n => {
      const menuStr =
        n.menu?.map(m => `    - ${m.nombre}: $${m.precio} (${m.descripcion})`).join('\n') ?? '';
      return `
NEGOCIO: ${n.nombre} | ID: ${n.id}
  Descripción: ${n.descripcion}
  Dirección: ${n.direccion}
  Horario: ${n.horario}
  Teléfono: ${n.telefono}
  Calificación: ${n.calificacion}⭐
  Menú:
${menuStr}`;
    })
    .join('\n\n');

  return `Eres el asistente virtual de Pidelo, una app de delivery de comida. Eres amable, eficiente y hablas en español mexicano informal.

NEGOCIOS DISPONIBLES:
${info}

TUS RESPONSABILIDADES:
1. Responder preguntas sobre menú, precios, horarios, dirección y descripción de los negocios.
2. Tomar pedidos paso a paso:
   a) Preguntar qué quieren ordenar y de qué negocio
   b) Confirmar items y total
   c) Pedir dirección de entrega
   d) Preguntar si tienen notas especiales (alergias, modificaciones, etc.)
   e) Al confirmar, responde EXACTAMENTE con este formato (sin markdown ni backticks):
   PEDIDO_LISTO:{"negocioId":"id","items":[{"name":"nombre","price":0,"quantity":1}],"direccionEntrega":"dirección","notas":"notas"}

3. Si no sabes algo, sé honesto y ofrece alternativas.
4. Usa emojis con moderación. Respuestas cortas y claras.

CRÍTICO: El JSON debe usar "name", "price", "quantity" en inglés para ser compatible con la app.`;
}

// Convierte historial formato Gemini → formato Ollama
function toOllamaHistory(history: GeminiMessage[]): OllamaMessage[] {
  return history.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts[0].text,
  }));
}

export async function askGemini(
  userMessage: string,
  history: GeminiMessage[],
  negocios: Negocio[]
): Promise<string> {
  const messages: OllamaMessage[] = [
    { role: 'system', content: buildSystemPrompt(negocios) },
    ...toOllamaHistory(history),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 1024 },
    }),
  });

  if (!response.ok) {
    console.error('Ollama error:', await response.text());
    throw new Error('Error al conectar con Ollama');
  }

  const data = await response.json();
  return data.message?.content ?? 'No pude obtener respuesta. Intenta de nuevo.';
}