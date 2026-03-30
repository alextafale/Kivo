// supabase/services/ticketService.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;
}

export interface TicketData {
  ordenId: string;
  orderNumber: string;
  negocioNombre: string;
  negocioDireccion?: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioTelefono?: string | null;
  direccionEntrega: string;
  notas?: string;
  items: TicketItem[];
  subtotal: number;
  costoEnvio: number;
  total: number;
  fecha: string;
}

// ─── HTML del ticket ─────────────────────────────────────────────────────────

function generarHTML(t: TicketData): string {
  const itemsRows = t.items
    .map(
      i => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#374151;">${i.quantity}x ${i.name}</td>
        <td style="padding:6px 0;font-size:13px;color:#374151;text-align:right;font-weight:600;">
          $${(i.price * i.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Ticket #${t.orderNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,sans-serif;background:#f5f5f5;padding:24px;}
    .ticket{max-width:420px;margin:0 auto;background:#fff;border-radius:20px;
      overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);}
    .header{background:linear-gradient(135deg,#22c55e,#15803d);
      padding:28px 24px;text-align:center;color:#fff;}
    .header-logo{font-size:36px;margin-bottom:6px;}
    .header-title{font-size:22px;font-weight:700;}
    .header-sub{font-size:12px;opacity:.85;margin-top:4px;}
    .order-badge{display:inline-block;background:rgba(255,255,255,.2);
      border-radius:8px;padding:7px 18px;margin-top:14px;
      font-size:15px;font-weight:700;letter-spacing:2px;}
    .section{padding:16px 24px;border-bottom:1px solid #f3f4f6;}
    .section-label{font-size:10px;font-weight:700;color:#9ca3af;
      text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;}
    .row{display:flex;justify-content:space-between;margin-bottom:5px;}
    .lbl{font-size:13px;color:#6b7280;}
    .val{font-size:13px;color:#111827;font-weight:500;}
    table{width:100%;border-collapse:collapse;}
    .divider{height:1px;background:#f3f4f6;margin:6px 0;}
    .total-row td{padding-top:10px;font-size:15px;font-weight:700;color:#111827;}
    .total-val{color:#15803d!important;}
    .footer{background:#f9fafb;padding:18px 24px;text-align:center;}
    .badge{display:inline-block;background:#dcfce7;color:#15803d;
      font-size:11px;font-weight:700;padding:4px 12px;
      border-radius:99px;margin-bottom:10px;}
    .footer-text{font-size:11px;color:#9ca3af;line-height:1.6;}
  </style>
</head>
<body>
  <div class="ticket">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">🛵</div>
      <div class="header-title">Pidelo</div>
      <div class="header-sub">Comprobante de Pedido</div>
      <div class="order-badge">#${t.orderNumber}</div>
    </div>

    <!-- Info Pedido -->
    <div class="section">
      <div class="section-label">📅 Información</div>
      <div class="row"><span class="lbl">Fecha</span><span class="val">${t.fecha}</span></div>
      <div class="row"><span class="lbl">Estado</span><span class="val">🟡 Pendiente</span></div>
      <div class="row"><span class="lbl">Folio</span><span class="val">${t.ordenId.slice(-8).toUpperCase()}</span></div>
    </div>

    <!-- Negocio -->
    <div class="section">
      <div class="section-label">🏪 Negocio</div>
      <div class="row"><span class="lbl">Nombre</span><span class="val">${t.negocioNombre}</span></div>
      ${t.negocioDireccion ? `<div class="row"><span class="lbl">Dirección</span><span class="val">${t.negocioDireccion}</span></div>` : ''}
    </div>

    <!-- Cliente -->
    <div class="section">
      <div class="section-label">👤 Cliente</div>
      <div class="row"><span class="lbl">Nombre</span><span class="val">${t.usuarioNombre}</span></div>
      <div class="row"><span class="lbl">Email</span><span class="val">${t.usuarioEmail}</span></div>
      ${t.usuarioTelefono ? `<div class="row"><span class="lbl">Teléfono</span><span class="val">${t.usuarioTelefono}</span></div>` : ''}
    </div>

    <!-- Entrega -->
    <div class="section">
      <div class="section-label">📍 Entrega</div>
      <div class="val">${t.direccionEntrega}</div>
      ${t.notas ? `<div style="margin-top:6px;"><span class="lbl">Notas: </span><span class="val">${t.notas}</span></div>` : ''}
    </div>

    <!-- Items -->
    <div class="section">
      <div class="section-label">🍽️ Detalle del Pedido</div>
      <table>
        <tbody>
          ${itemsRows}
          <tr><td colspan="2"><div class="divider"></div></td></tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Subtotal</td>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;text-align:right;">$${t.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;">Costo de envío</td>
            <td style="padding:5px 0;font-size:13px;color:#6b7280;text-align:right;">$${t.costoEnvio.toFixed(2)}</td>
          </tr>
          <tr><td colspan="2"><div class="divider"></div></td></tr>
          <tr class="total-row">
            <td>Total</td>
            <td style="text-align:right;" class="total-val">$${t.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="badge">✓ Pedido Registrado</div>
      <p class="footer-text">Gracias por tu pedido.<br/>Te avisaremos cuando esté en camino. 🛵</p>
      <p class="footer-text" style="margin-top:8px;color:#d1d5db;">Pidelo — La Piedad, Michoacán</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Generar PDF ──────────────────────────────────────────────────────────────

export async function generarTicketPDF(ticketData: TicketData): Promise<string | null> {
  try {
    const html = generarHTML(ticketData);
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return uri;
  } catch (e) {
    console.error('Error generando PDF:', e);
    return null;
  }
}

// ─── Compartir PDF vía Share Sheet ───────────────────────────────────────────

export async function compartirTicketPDF(uri: string): Promise<void> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir ticket de pedido',
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (e) {
    console.error('Error compartiendo PDF:', e);
  }
}

// ─── Enviar resumen por WhatsApp (texto) al número del cliente ────────────────

export async function enviarResumenWhatsApp(ticketData: TicketData): Promise<void> {
  if (!ticketData.usuarioTelefono) return;

  const itemsTexto = ticketData.items
    .map(i => `  • ${i.quantity}x ${i.name} — $${(i.price * i.quantity).toFixed(2)}`)
    .join('\n');

  const mensaje =
    `🛵 *Pedido Confirmado — Pidelo*\n\n` +
    `📋 *#${ticketData.orderNumber}*\n` +
    `🏪 ${ticketData.negocioNombre}\n\n` +
    `${itemsTexto}\n\n` +
    `💰 *Total: $${ticketData.total.toFixed(2)}*\n` +
    `📍 *Entrega:* ${ticketData.direccionEntrega}\n` +
    (ticketData.notas ? `📝 *Notas:* ${ticketData.notas}\n` : '') +
    `\n🗓️ ${ticketData.fecha}` +
    `\n\n_Enviado desde Pidelo App_`;

  const phone = ticketData.usuarioTelefono.replace(/\D/g, '');
  const waUrl = `whatsapp://send?phone=52${phone}&text=${encodeURIComponent(mensaje)}`;
  const webUrl = `https://wa.me/52${phone}?text=${encodeURIComponent(mensaje)}`;

  const canOpen = await Linking.canOpenURL(waUrl);
  await Linking.openURL(canOpen ? waUrl : webUrl);
}
