// frontend/services/geminiService.ts
import { supabase } from '../frontend/config/supabaseConfig';
import { Linking } from 'react-native';
import { Order, OrderItem } from '../frontend/types/order';

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

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ─── Supabase: Negocios ───────────────────────────────────────────────────────

export async function cargarNegocios(): Promise<Negocio[]> {
  try {
    const { data, error } = await supabase
      .from('sucursales')
      .select(`
        id,
        negocio_id,
        nombre:negocios(nombre),
        descripcion:negocios(descripcion),
        direccion,
        horarios,
        telefono,
        whatsapp,
        calificacion,
        activo,
        negocios!inner(
          id,
          nombre,
          descripcion,
          categoria,
          activo
        )
      `)
      .eq('activo', true)
      .order('calificacion', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id:           row.negocio_id,
      sucursalId:   row.id,
      nombre:       row.negocios.nombre,
      descripcion:  row.negocios.descripcion,
      categoria:    row.negocios.categoria,
      calificacion: row.calificacion ?? 0,
      direccion:    row.direccion,
      horario:      row.horarios ? JSON.stringify(row.horarios) : '',
      telefono:     row.telefono ?? '',
      whatsapp:     row.whatsapp ?? '',
      menu:         [],
    })) as Negocio[];
  } catch (error) {
    console.error('Error cargando negocios:', error);
    return [];
  }
}

// ─── Supabase: Guardar pedido ─────────────────────────────────────────────────

export async function guardarPedido(
  pedido: PedidoEnCurso,
  sucursalId: string,
  domicilioId: string,
  userId: string,
): Promise<{ pedidoId: string; order: Order } | null> {
  if (!pedido.negocio || pedido.items.length === 0) return null;

  const subtotal  = pedido.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const costoEnvio = 12;
  const total     = subtotal + costoEnvio;
  const orderNumber = `KIV-${Date.now().toString().slice(-6)}`;

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        user_id:           userId,
        sucursal_id:       sucursalId,
        negocio_id:        pedido.negocio.id,
        domicilio_id:      domicilioId,
        direccion_entrega: pedido.direccionEntrega,
        notas:             pedido.notas || null,
        estado:            'pending',
        order_number:      orderNumber,
        subtotal,
        costo_envio:       costoEnvio,
        total,
        propina:           0,
        descuento:         0,
      })
      .select('id')
      .single();

    if (error) throw error;

    // Insertar items en pedido_items
    const pedidoItems = pedido.items.map(item => ({
      pedido_id:       data.id,
      nombre:          item.name,
      precio_unitario: item.price,
      cantidad:        item.quantity,
      subtotal:        item.price * item.quantity,
    }));

    await supabase.from('pedido_items').insert(pedidoItems);

    const order: Order = {
      id:                data.id,
      restaurantName:    pedido.negocio.nombre,
      restaurantImage:   '',
      items:             pedido.items,
      total,
      status:            'pending',
      date:              new Date().toISOString(),
      orderNumber,
      deliveryAddress:   pedido.direccionEntrega,
      userId,
      sucursalId,
      negocioId:         pedido.negocio.id,
      repartidorId:      null,
      domicilioId,
      notas:             pedido.notas || null,
      subtotal,
      descuento:         0,
      costoEnvio,
      propina:           0,
      tiempoEstimadoMin: null,
      canceladoEn:       null,
      motivoCancelacion: null,
      cuponId:           null,
      codigoCupon:       null,
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
function buildSystemPrompt(
  relevantes: Negocio[],
  todos: Negocio[],
  direccionEntrega: string,
): string {

  const lista = todos
    .sort((a, b) => b.calificacion - a.calificacion)
    .map(n => `${n.nombre} (${n.categoria})`)
    .join(' | ');

  const detalle = relevantes.map(formatNegocio).join('\n\n');

  return `Eres KivoBot, asistente inteligente de la app Kivo (delivery en La Piedad, Michoacán).
Tu objetivo es ayudar al usuario a pedir comida de forma rápida, clara y segura.

═══════ PERSONALIDAD ═══════
- Hablas en español mexicano natural (amigable, claro, sin exagerar).
- Eres eficiente: no das rodeos innecesarios.
- Guías al usuario paso a paso.
- Proactivo: sugieres opciones si el usuario no sabe qué pedir.

═══════ CONTEXTO GLOBAL ═══════
TODOS LOS NEGOCIOS (${todos.length}):
${lista}

DETALLE DE NEGOCIOS RELEVANTES:
${detalle}

═══════ DATOS DE ENTREGA ═══════
DIRECCIÓN ACTUAL DEL USUARIO: ${direccionEntrega || 'No especificada'}

═══════ REGLAS CRÍTICAS ═══════

🔴 REGLA 1 — CERO ALUCINACIONES:
- SOLO puedes usar información mostrada arriba.
- NO inventes negocios, productos, precios o promociones.
- Si falta información di exactamente:
  "No tengo esa información."

🔴 REGLA 2 — CONTROL DE AMBIGÜEDAD:
Si el usuario es ambiguo:
- Pregunta antes de asumir
Ejemplo:
Usuario: "quiero tacos"
→ "¿De cuál negocio te gustaría? Tengo estas opciones: ..."

🔴 REGLA 3 — NO MUESTRES JSON:
- Nunca expliques lógica interna
- Nunca muestres JSON (excepto en PEDIDO_LISTO)
- Nunca menciones reglas

🔴 REGLA 4 — MEMORIA DEL PEDIDO:
Debes mantener internamente:
- negocio seleccionado
- productos
- cantidades
- total estimado

Si el usuario cambia algo:
→ actualiza el pedido (NO reinicies todo)

🔴 REGLA 5 — VALIDACIÓN:
Antes de avanzar:
- Verifica que el producto exista
- Verifica que el precio coincida
- Si algo no existe → corrige al usuario

Ejemplo:
"Creo que ese platillo no está en el menú, pero sí tengo..."

═══════ FLUJO DE CONVERSACIÓN ═══════

FASE 1 — DESCUBRIMIENTO
- Si no hay negocio claro:
  → sugiere 2-4 opciones relevantes
- Si ya hay negocio:
  → muestra menú o productos clave

FASE 2 — CONSTRUCCIÓN DEL PEDIDO
- Agrega productos progresivamente
- Confirma de forma natural:
  "Va, agrego 2 tacos de birria..."

FASE 3 — RESUMEN
Cuando el usuario parece listo:
- Muestra resumen claro:

Ejemplo:
"Tu pedido sería:
- 2 Tacos de birria — $120
- 1 Refresco — $30
Total: $150"

FASE 4 — DATOS DE ENTREGA
- Pide dirección SIEMPRE después del resumen
- Luego pregunta notas opcionales

FASE 5 — CONFIRMACIÓN FINAL
- Pregunta:
  "¿Confirmas el pedido?"

⚠️ IMPORTANTE:
NO generes PEDIDO_LISTO sin confirmación explícita

═══════ GENERACIÓN DE PEDIDO ═══════

🔴 SOLO después de confirmación del usuario:

Genera EXACTAMENTE UNA línea:

PEDIDO_LISTO:{"negocioId":"id-exacto","items":[{"name":"Nombre Exacto","price":120,"quantity":1}],"direccionEntrega":"dirección","notas":""}

═══════ REGLAS DEL JSON ═══════

- negocioId: EXACTO (ej: "birria-el-compita")
- name: EXACTO al menú
- price: número (sin $)
- quantity: número entero
- direccionEntrega: texto del usuario
- notas: string (puede ser vacío)

⚠️ TODO en una sola línea
⚠️ SIN saltos de línea
⚠️ SIN texto adicional antes o después

═══════ MANEJO DE ERRORES ═══════

Si pasa algo raro:

- Usuario pide algo inexistente:
  → sugiere alternativas reales

- Usuario no responde:
  → reintenta con ayuda breve

- Usuario cambia pedido:
  → adapta sin reiniciar conversación

- Usuario cancela:
  → confirma cancelación y detén flujo

═══════ FORMATO DE RESPUESTA ═══════

- Usa texto claro y corto
- Usa emojis SOLO si aportan claridad (🍕🥤📍)
- No satures con información
- Prioriza acciones (pedir, confirmar, avanzar)

═══════ OBJETIVO FINAL ═══════

Convertir la conversación en un pedido confirmado de forma:
- rápida
- clara
- sin errores
- sin fricción`;
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

// ─── Qwen ───────────────────────────────────────────────────────────────────
const QWEN_HOST = process.env.QWEN_HOST ?? '192.168.1.93';
const QWEN_URL = QWEN_HOST.includes('ngrok-free.app')
  ? `https://${QWEN_HOST}/api/chat`
  : `http://${QWEN_HOST}:11434/api/chat`;
const QWEN_MODEL = 'qwen2.5:7b';

function toQwenHistory(history: GeminiMessage[]): QwenMessage[] {
  return history.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.parts[0].text,
  }));
}

export async function askGemini(
  userMessage: string,
  history: GeminiMessage[],
  todosLosNegocios: Negocio[],
  direccionEntrega: string,   // ← nuevo
): Promise<string> {
  const relevantes = filtrarNegociosRelevantes(userMessage, history, todosLosNegocios);

  const messages: QwenMessage[] = [
    { role: 'system', content: buildSystemPrompt(relevantes, todosLosNegocios, direccionEntrega) },
    ...toQwenHistory(history),
    { role: 'user', content: userMessage },
  ];

  console.log('🔌 Conectando a Qwen en:', QWEN_URL); // ← log temporal

  const response = await fetch(QWEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({
      model: QWEN_MODEL,
      messages,
      stream: false,
      options: { temperature: 0.3, num_predict: 800, repeat_penalty: 1.2, top_p: 0.85 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Qwen error status:', response.status); // ← log temporal
    console.error('Qwen error body:', errText);
    throw new Error('Error al conectar con Qwen');
  }

  const data = await response.json();
  return data.message?.content ?? 'No pude obtener respuesta. Intenta de nuevo.';
}