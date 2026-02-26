// frontend/services/geminiService.ts
import { supabase } from '../config/supabaseConfig';
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

// ─── Supabase: Negocios ───────────────────────────────────────────────────────

export async function cargarNegocios(): Promise<Negocio[]> {
  try {
    const { data, error } = await supabase
      .from('negocios')
      .select('*')
      .eq('activo', true)
      .order('calificacion', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Negocio[];
  } catch (error) {
    console.error('Error cargando negocios:', error);
    return [];
  }
}

// ─── Supabase: Guardar pedido ─────────────────────────────────────────────────

export async function guardarPedido(
  pedido: PedidoEnCurso
): Promise<{ pedidoId: string; order: Order } | null> {
  if (!pedido.negocio || pedido.items.length === 0) return null;

  const total = pedido.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNumber = `PID-${Date.now().toString().slice(-6)}`;

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        negocio_id:        pedido.negocio.id,
        negocio_nombre:    pedido.negocio.nombre,
        negocio_whatsapp:  pedido.negocio.whatsapp,
        items:             pedido.items,
        total,
        direccion_entrega: pedido.direccionEntrega,
        notas:             pedido.notas,
        estado:            'pending',
        order_number:      orderNumber,
      })
      .select('id')
      .single();

    if (error) throw error;

    const order: Order = {
      id:              data.id,
      restaurantName:  pedido.negocio.nombre,
      restaurantImage: '',
      items:           pedido.items,
      total,
      status:          'pending',
      date:            new Date(),
      orderNumber,
      deliveryAddress: pedido.direccionEntrega,
    };

    return { pedidoId: data.id, order };
  } catch (error) {
    console.error('Error guardando pedido:', error);
    return null;
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

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

const CATEGORIA_KEYWORDS: Record<string, string[]> = {
  taqueria:         ['taco', 'tacos', 'pastor', 'asada', 'bistec', 'suadero', 'tripa', 'buche', 'campechano'],
  mariscos:         ['mariscos', 'camarón', 'camarones', 'ceviche', 'aguachile', 'coctel', 'pulpo', 'filete', 'marlín', 'jaiba', 'ostión'],
  pizzeria:         ['pizza', 'pizzas', 'pepperoni', 'hawaiana'],
  hamburgueseria:   ['hamburguesa', 'burger', 'doble', 'tocino'],
  barbacoa:         ['barbacoa', 'borrego', 'cabeza', 'cachete', 'lengua', 'maciza'],
  pozoleria:        ['pozole', 'pozolería'],
  antojitos:        ['sope', 'sopes', 'gordita', 'gorditas', 'enchilada', 'quesadilla', 'flauta', 'flautas'],
  parrilla:         ['arrachera', 'corte', 'costilla', 'parrilla', 'carne asada', 'rib eye'],
  desayunos:        ['desayuno', 'chilaquiles', 'huevo', 'huevos', 'hotcakes', 'waffle', 'molletes'],
  sushi:            ['sushi', 'rol', 'rollo', 'rollos', 'ramen'],
  italiana:         ['pasta', 'lasaña', 'espagueti', 'italiano'],
  cafeteria:        ['café', 'cafe', 'latte', 'capuchino', 'frappé', 'churro', 'churros'],
  postres:          ['postre', 'pastel', 'flan', 'dona', 'helado', 'gelatina', 'crepa'],
  cenaduria:        ['cenaduría', 'cenaduria', 'flautas', 'tacos dorados'],
  torteria:         ['torta', 'tortas', 'ahogada', 'milanesa'],
  hotdogs:          ['hot dog', 'hotdog'],
  alitas:           ['alitas', 'boneless', 'wings'],
  burritos:         ['burrito', 'burritos'],
  birrieria:        ['birria', 'quesabirria', 'consomé'],
  polleria:         ['pollo', 'rostizado', 'rosticería'],
  buffet:           ['buffet'],
  comida_mexicana:  ['mexicano', 'mexicana', 'guisado', 'mole', 'chile relleno', 'molcajete'],
  comida_saludable: ['saludable', 'ensalada', 'bowl', 'wrap', 'vegano', 'quinoa'],
};

function filtrarNegociosRelevantes(
  userMessage: string,
  history: GeminiMessage[],
  negocios: Negocio[],
  maxNegocios = 8
): Negocio[] {
  const recentHistory = history.slice(-4).map(h => h.parts[0].text).join(' ');
  const ctx = (userMessage + ' ' + recentHistory).toLowerCase();

  // 1. Coincidencia por nombre exacto
  const porNombre = negocios.filter(n =>
    ctx.includes(n.nombre.toLowerCase()) || ctx.includes(n.id.toLowerCase())
  );
  if (porNombre.length > 0) {
    const categorias = new Set(porNombre.map(n => n.categoria));
    const extras = negocios.filter(n => categorias.has(n.categoria) && !porNombre.includes(n));
    return [...porNombre, ...extras.slice(0, 3)].slice(0, maxNegocios);
  }

  // 2. Coincidencia por categoría
  const categoriasMatch = new Set<string>();
  for (const [cat, keywords] of Object.entries(CATEGORIA_KEYWORDS)) {
    if (keywords.some(k => ctx.includes(k))) categoriasMatch.add(cat);
  }
  if (categoriasMatch.size > 0) {
    const porCategoria = negocios
      .filter(n => categoriasMatch.has(n.categoria))
      .sort((a, b) => b.calificacion - a.calificacion);
    if (porCategoria.length > 0) return porCategoria.slice(0, maxNegocios);
  }

  // 3. General → top con variedad de categorías
  const top: Negocio[] = [];
  const vistas = new Set<string>();
  for (const n of [...negocios].sort((a, b) => b.calificacion - a.calificacion)) {
    if (top.length >= maxNegocios) break;
    if (!vistas.has(n.categoria)) { top.push(n); vistas.add(n.categoria); }
  }
  return top;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function formatNegocio(n: Negocio): string {
  const menu = n.menu
    ?.map(m => `      • ${m.nombre}: $${m.precio} — ${m.descripcion}`)
    .join('\n') ?? '      (sin menú)';
  return `▸ ${n.nombre} [ID: ${n.id}]
    Categoría: ${n.categoria} | ⭐${n.calificacion}
    Dirección: ${n.direccion}
    Horario: ${n.horario}
    Menú:\n${menu}`;
}

function buildSystemPrompt(relevantes: Negocio[], todos: Negocio[]): string {
  const lista = todos
    .sort((a, b) => b.calificacion - a.calificacion)
    .map(n => `${n.nombre} (${n.categoria})`)
    .join(' | ');

  const detalle = relevantes.map(formatNegocio).join('\n\n');

  return `Eres el asistente de Pidelo, app de delivery en La Piedad, Michoacán. Hablas en español mexicano informal.

TODOS LOS NEGOCIOS (${todos.length}):
${lista}

DETALLE DE NEGOCIOS RELEVANTES:
${detalle}

═══════ REGLAS OBLIGATORIAS ═══════

REGLA 1 — NO ALUCINES:
Solo menciona negocios, platillos y precios que aparezcan EXACTAMENTE arriba.
Si no tienes el dato di: "No tengo esa información."

REGLA 2 — NO MUESTRES JSON:
Responde siempre en texto natural. Nunca muestres JSON al usuario.

REGLA 3 — FLUJO DE PEDIDO:
  1. Confirma qué quiere y de qué negocio
  2. Muestra resumen en texto con total
  3. Pide dirección de entrega
  4. Pregunta notas especiales (opcional)
  5. Pide confirmación: "¿Confirmas el pedido?"
  6. Solo tras confirmación → escribe PEDIDO_LISTO

REGLA 4 — PEDIDO_LISTO en UNA SOLA LÍNEA:
PEDIDO_LISTO:{"negocioId":"id-exacto","items":[{"name":"Nombre Exacto","price":120,"quantity":1}],"direccionEntrega":"dirección","notas":""}

  Reglas del JSON:
  - negocioId: ID exacto (ej: "birria-el-compita")
  - name: nombre EXACTO del menú
  - price: número sin $ (ej: 120)
  - quantity: número (ej: 2)
  - Sin saltos de línea dentro del JSON

REGLA 5 — FORMATO:
  Menú: 🍕 Nombre — $precio (descripción)
  Respuestas cortas y claras, emojis con moderación.`;
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

  let depth = 0, end = -1;
  for (let i = start; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') depth++;
    else if (jsonStr[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }

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
    if (!pedidoJson.negocioId || !Array.isArray(pedidoJson.items) || pedidoJson.items.length === 0) {
      console.warn('PEDIDO_LISTO inválido:', pedidoJson);
      return { displayText: responseText, pedidoJson: null };
    }
    const displayText = responseText.slice(0, marker).trim() || '¡Listo! Aquí el resumen 🎉';
    return { displayText, pedidoJson };
  } catch (e) {
    console.error('Error parseando pedido:', e);
    return { displayText: responseText, pedidoJson: null };
  }
}

// ─── Ollama ───────────────────────────────────────────────────────────────────

const OLLAMA_URL = `http://${process.env.OLLAMA_HOST ?? '192.168.1.100'}:11434/api/chat`;
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
  const relevantes = filtrarNegociosRelevantes(userMessage, history, todosLosNegocios);

  const messages: OllamaMessage[] = [
    { role: 'system', content: buildSystemPrompt(relevantes, todosLosNegocios) },
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
      options: { temperature: 0.3, num_predict: 800, repeat_penalty: 1.2, top_p: 0.85 },
    }),
  });

  if (!response.ok) {
    console.error('Ollama error:', await response.text());
    throw new Error('Error al conectar con Ollama');
  }

  const data = await response.json();
  return data.message?.content ?? 'No pude obtener respuesta. Intenta de nuevo.';
}