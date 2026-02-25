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

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  whatsapp: string;
  categoria: string;
  calificacion: number;
  menu: MenuItem[];
}

export interface PedidoEnCurso {
  negocio: Negocio | null;
  items: OrderItem[];
  direccionEntrega: string;
  notas: string;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ─── Firestore ────────────────────────────────────────────────────────────────

export async function cargarNegocios(): Promise<Negocio[]> {
  try {
    const q = query(collection(db, 'negocios'), limit(100));
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

// ─── Contexto inteligente ─────────────────────────────────────────────────────
// Manda solo los negocios relevantes al modelo según lo que pregunta el usuario.
// Esto evita que el modelo se pierda con 65 negocios y alucine datos.

const CATEGORIA_KEYWORDS: Record<string, string[]> = {
  taqueria:         ['taco', 'tacos', 'pastor', 'asada', 'bistec', 'suadero', 'tripa', 'buche', 'campechano', 'taquería'],
  mariscos:         ['mariscos', 'camarón', 'camarones', 'ceviche', 'aguachile', 'coctel', 'pulpo', 'filete', 'marlín', 'jaiba', 'ostión'],
  pizzeria:         ['pizza', 'pizzas', 'pepperoni', 'hawaiana', 'pizzería'],
  hamburgueseria:   ['hamburguesa', 'burger', 'doble', 'tocino'],
  barbacoa:         ['barbacoa', 'borrego', 'cabeza', 'cachete', 'lengua', 'maciza'],
  pozoleria:        ['pozole', 'pozolería'],
  antojitos:        ['sope', 'sopes', 'gordita', 'gorditas', 'enchilada', 'enchiladas', 'quesadilla', 'antojito', 'flauta', 'flautas', 'tlacoyo'],
  parrilla:         ['arrachera', 'corte', 'costilla', 'parrilla', 'carne asada', 'rib eye', 'asadero', 'parrillada'],
  desayunos:        ['desayuno', 'chilaquiles', 'huevo', 'huevos', 'hotcakes', 'hot cakes', 'waffle', 'molletes', 'omelet'],
  sushi:            ['sushi', 'rol', 'rollo', 'rollos', 'japonés', 'japonesa', 'ramen'],
  italiana:         ['pasta', 'lasaña', 'espagueti', 'italiano', 'italiana', 'fetuccini', 'ravioles'],
  cafeteria:        ['café', 'cafe', 'latte', 'capuchino', 'frappé', 'frappe', 'churro', 'churros', 'pan'],
  postres:          ['postre', 'pastel', 'flan', 'dona', 'helado', 'gelatina', 'dulce', 'crepa', 'crepas'],
  cenaduria:        ['cenaduría', 'cenaduria', 'flautas', 'tacos dorados'],
  torteria:         ['torta', 'tortas', 'ahogada', 'milanesa', 'pierna'],
  hotdogs:          ['hot dog', 'hotdog'],
  alitas:           ['alitas', 'alita', 'boneless', 'wings'],
  burritos:         ['burrito', 'burritos'],
  birrieria:        ['birria', 'birriería', 'quesabirria', 'consomé'],
  polleria:         ['pollo', 'rostizado', 'rosticería', 'cuarto', 'medio pollo'],
  buffet:           ['buffet'],
  comida_mexicana:  ['mexicano', 'mexicana', 'guisado', 'mole', 'comida casera', 'chile relleno', 'molcajete'],
  comida_saludable: ['saludable', 'ensalada', 'bowl', 'wrap', 'vegano', 'light', 'quinoa'],
};

function filtrarNegociosRelevantes(
  userMessage: string,
  history: GeminiMessage[],
  negocios: Negocio[],
  maxNegocios = 8
): Negocio[] {
  // Combinar mensaje actual + últimos 2 turnos del historial para más contexto
  const recentHistory = history.slice(-4).map(h => h.parts[0].text).join(' ');
  const contextoCompleto = (userMessage + ' ' + recentHistory).toLowerCase();

  // 1. Coincidencia exacta con nombre de negocio
  const porNombre = negocios.filter(n =>
    contextoCompleto.includes(n.nombre.toLowerCase()) ||
    contextoCompleto.includes(n.id.toLowerCase())
  );
  if (porNombre.length > 0) {
    // Si encontramos por nombre, incluir también su categoría para sugerencias
    const categorias = new Set(porNombre.map(n => n.categoria));
    const mismaCategoria = negocios.filter(n => categorias.has(n.categoria) && !porNombre.includes(n));
    return [...porNombre, ...mismaCategoria.slice(0, 3)].slice(0, maxNegocios);
  }

  // 2. Coincidencia por palabras clave de categoría
  const categoriasMatch = new Set<string>();
  for (const [cat, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
    if (keywords.some(k => contextoCompleto.includes(k))) {
      categoriasMatch.add(cat);
    }
  }

  if (categoriasMatch.size > 0) {
    const porCategoria = negocios
      .filter(n => categoriasMatch.has(n.categoria))
      .sort((a, b) => b.calificacion - a.calificacion);
    if (porCategoria.length > 0) return porCategoria.slice(0, maxNegocios);
  }

  // 3. Pregunta general → top negocios por calificación con variedad de categorías
  const topPorCategoria: Negocio[] = [];
  const categoriasVistas = new Set<string>();
  const sorted = [...negocios].sort((a, b) => b.calificacion - a.calificacion);
  for (const n of sorted) {
    if (topPorCategoria.length >= maxNegocios) break;
    if (!categoriasVistas.has(n.categoria)) {
      topPorCategoria.push(n);
      categoriasVistas.add(n.categoria);
    }
  }
  return topPorCategoria;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function formatNegocio(n: Negocio): string {
  const menu = n.menu
    ?.map(m => `      • ${m.nombre}: $${m.precio} — ${m.descripcion}`)
    .join('\n') ?? '      (sin menú registrado)';

  return `▸ ${n.nombre} [ID: ${n.id}]
    Categoría: ${n.categoria} | ⭐${n.calificacion}
    Dirección: ${n.direccion}
    Horario: ${n.horario}
    Menú:
${menu}`;
}

function buildSystemPrompt(negociosRelevantes: Negocio[], todosLosNegocios: Negocio[]): string {
  const listaNombres = todosLosNegocios
    .sort((a, b) => b.calificacion - a.calificacion)
    .map(n => `${n.nombre} (${n.categoria})`)
    .join(' | ');

  const detalle = negociosRelevantes.map(formatNegocio).join('\n\n');

  return `Eres el asistente de Pidelo, app de delivery en La Piedad, Michoacán. Hablas en español mexicano informal.

TODOS LOS NEGOCIOS REGISTRADOS (${todosLosNegocios.length}):
${listaNombres}

INFORMACIÓN DETALLADA DE NEGOCIOS RELEVANTES:
${detalle}

═══════ REGLAS QUE DEBES SEGUIR SIEMPRE ═══════

REGLA 1 — NO ALUCINES:
Únicamente menciona negocios, platillos y precios que aparezcan EXACTAMENTE en la información de arriba.
Si no tienes el dato, di: "No tengo esa información, pero puedo ayudarte con otra cosa."
NUNCA inventes precios, platillos ni negocios.

REGLA 2 — NO MUESTRES JSON AL USUARIO:
Responde siempre en texto natural y amigable. El JSON solo va al final cuando el pedido esté confirmado.

REGLA 3 — FLUJO DE PEDIDO (sigue estos pasos en orden):
  1. Pregunta qué quiere y de qué negocio
  2. Confirma items y total en texto: "Serían X tacos de Y a $Z cada uno. Total: $W"
  3. Pide dirección de entrega
  4. Pregunta si hay notas especiales (si no quiere omitir, está bien)
  5. Pide confirmación: "¿Confirmas el pedido?"
  6. Solo cuando el usuario confirme → escribe el PEDIDO_LISTO

REGLA 4 — FORMATO DEL PEDIDO_LISTO:
Escríbelo en UNA SOLA LÍNEA, sin espacios antes del {, sin saltos de línea dentro:
PEDIDO_LISTO:{"negocioId":"id-exacto","items":[{"name":"Nombre Exacto Del Platillo","price":120,"quantity":2}],"direccionEntrega":"dirección completa","notas":""}

  - negocioId: ID exacto del negocio (ej: "birria-el-compita")
  - name: nombre EXACTO del platillo como aparece en el menú
  - price: número sin $ ni comillas (ej: 120)
  - quantity: número (ej: 2)
  - notas: "" si no hay notas

REGLA 5 — FORMATO DE RESPUESTAS:
  - Listas el menú así: 🍕 Nombre — $precio (descripción)
  - Sin markdown excesivo
  - Respuestas cortas y directas
  - Emojis con moderación`;
}

// ─── Parser robusto ───────────────────────────────────────────────────────────

export function parsePedidoFromResponse(
  responseText: string
): { displayText: string; pedidoJson: any | null } {
  const marker = responseText.indexOf('PEDIDO_LISTO:');
  if (marker === -1) return { displayText: responseText, pedidoJson: null };

  let jsonStr = responseText.slice(marker + 'PEDIDO_LISTO:'.length).trim();
  jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  jsonStr = jsonStr.replace(/[\n\r]/g, ' ');

  const start = jsonStr.indexOf('{');
  if (start === -1) return { displayText: responseText, pedidoJson: null };

  // Encontrar cierre balanceado
  let depth = 0, end = -1;
  for (let i = start; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') depth++;
    else if (jsonStr[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }

  // Si viene incompleto, cerrar lo que falta
  let finalJson = end !== -1
    ? jsonStr.slice(start, end + 1)
    : (() => {
        let p = jsonStr.slice(start);
        p += ']'.repeat(Math.max(0, (p.match(/\[/g) || []).length - (p.match(/\]/g) || []).length));
        p += '}'.repeat(Math.max(0, (p.match(/\{/g) || []).length - (p.match(/\}/g) || []).length));
        return p;
      })();

  try {
    const pedidoJson = JSON.parse(finalJson);

    // Validar estructura mínima
    if (!pedidoJson.negocioId || !Array.isArray(pedidoJson.items) || pedidoJson.items.length === 0) {
      console.warn('PEDIDO_LISTO con estructura inválida:', pedidoJson);
      return { displayText: responseText, pedidoJson: null };
    }

    const displayText = responseText.slice(0, marker).trim() || '¡Listo! Aquí el resumen de tu pedido 🎉';
    return { displayText, pedidoJson };
  } catch (e) {
    console.error('Error parseando JSON del pedido:', e, '\nJSON:', finalJson);
    return { displayText: responseText, pedidoJson: null };
  }
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

const OLLAMA_URL = 'http://192.168.1.100:11434/api/chat';
const OLLAMA_MODEL = 'llama3';

function toOllamaHistory(history: GeminiMessage[]): OllamaMessage[] {
  return history.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts[0].text,
  }));
}

export async function askGemini(
  userMessage: string,
  history: GeminiMessage[],
  todosLosNegocios: Negocio[]
): Promise<string> {
  // Contexto inteligente: solo negocios relevantes para este mensaje
  const negociosRelevantes = filtrarNegociosRelevantes(userMessage, history, todosLosNegocios);

  const messages: OllamaMessage[] = [
    { role: 'system', content: buildSystemPrompt(negociosRelevantes, todosLosNegocios) },
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
      options: {
        temperature: 0.3,     // bajo = más preciso, menos alucinaciones
        num_predict: 800,
        repeat_penalty: 1.2,  // evita que repita lo mismo
        top_p: 0.85,
      },
    }),
  });

  if (!response.ok) {
    console.error('Ollama error:', await response.text());
    throw new Error('Error al conectar con Ollama');
  }

  const data = await response.json();
  return data.message?.content ?? 'No pude obtener respuesta. Intenta de nuevo.';
}