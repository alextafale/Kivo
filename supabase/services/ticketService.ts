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
      <tr class="item-row">
        <td class="item-name">${i.quantity}× ${i.name}</td>
        <td class="item-price">$${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const folio = t.ordenId.slice(-8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Kivo — Pedido #${t.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Segoe UI', Arial, sans-serif;
      background: #ECEFF4;
      padding: 32px 16px;
      min-height: 100vh;
    }

    .ticket {
      max-width: 400px;
      margin: 0 auto;
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0,0,0,.14);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(145deg, #16a34a 0%, #0f6b30 100%);
      padding: 32px 24px 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -40px; right: -40px;
      width: 160px; height: 160px;
      border-radius: 50%;
      background: rgba(255,255,255,.06);
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -60px; left: -30px;
      width: 200px; height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,.04);
    }
    .brand {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: rgba(255,255,255,.7);
      margin-bottom: 6px;
    }
    .header-title {
      font-size: 32px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -1px;
      line-height: 1;
    }
    .header-sub {
      font-size: 12px;
      color: rgba(255,255,255,.65);
      margin-top: 4px;
      letter-spacing: .5px;
    }
    .order-pill {
      display: inline-block;
      background: rgba(255,255,255,.18);
      border: 1px solid rgba(255,255,255,.3);
      border-radius: 99px;
      padding: 6px 20px;
      margin-top: 18px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #fff;
    }

    /* ── Notch divider ── */
    .notch-wrap {
      background: #fff;
      display: flex;
      align-items: center;
      margin-top: -1px;
    }
    .notch-circle {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: #ECEFF4;
      flex-shrink: 0;
    }
    .notch-line {
      flex: 1;
      border-top: 2px dashed #E5E7EB;
      margin: 0 4px;
    }

    /* ── Status badge ── */
    .status-wrap {
      padding: 16px 24px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FEF9C3;
      color: #92400E;
      border-radius: 99px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .4px;
    }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #F59E0B; }
    .folio { font-size: 11px; color: #9CA3AF; font-weight: 500; letter-spacing: 1px; }

    /* ── Sections ── */
    .section { padding: 16px 24px; border-bottom: 1px solid #F3F4F6; }
    .section:last-of-type { border-bottom: none; }
    .section-label {
      font-size: 9px;
      font-weight: 800;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-cell {}
    .cell-label { font-size: 10px; color: #9CA3AF; margin-bottom: 2px; font-weight: 500; }
    .cell-value { font-size: 13px; color: #111827; font-weight: 600; }

    .address-box {
      background: #F9FAFB;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 13px;
      color: #374151;
      font-weight: 500;
      line-height: 1.5;
    }
    .notes-row {
      margin-top: 8px;
      font-size: 12px;
      color: #6B7280;
      font-style: italic;
    }

    /* ── Items table ── */
    table { width: 100%; border-collapse: collapse; }
    .item-row td { padding: 7px 0; }
    .item-name { font-size: 13px; color: #374151; font-weight: 500; }
    .item-price { font-size: 13px; color: #111827; font-weight: 600; text-align: right; }

    .summary-row td { padding: 5px 0; font-size: 12px; color: #6B7280; }
    .summary-val { text-align: right; }

    .sep { height: 1px; background: #F3F4F6; margin: 8px 0; }
    .sep-dashed { height: 0; border-top: 1px dashed #E5E7EB; margin: 8px 0; }

    .total-section {
      background: #F0FDF4;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    .total-label { font-size: 14px; font-weight: 700; color: #166534; }
    .total-value { font-size: 22px; font-weight: 800; color: #16a34a; }

    /* ── Footer ── */
    .footer {
      background: #F9FAFB;
      padding: 20px 24px 24px;
      text-align: center;
      border-top: 1px solid #F3F4F6;
    }
    .confirmed-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #DCFCE7;
      color: #166534;
      border-radius: 99px;
      padding: 6px 16px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .check-icon { font-size: 14px; }
    .footer-msg { font-size: 12px; color: #6B7280; line-height: 1.7; }
    .footer-brand { font-size: 11px; color: #D1D5DB; margin-top: 12px; letter-spacing: 1px; }

    /* ── Barcode strip ── */
    .barcode-strip {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 3px;
      padding: 10px 24px 0;
      opacity: .18;
    }
    .bar { background: #111827; border-radius: 1px; width: 3px; }
  </style>
</head>
<body>
  <div class="ticket">

    <!-- Header -->
    <div class="header">
      <div class="brand">Kivo Delivery</div>
      <div class="header-title">Comprobante</div>
      <div class="header-sub">de pedido</div>
      <div class="order-pill"># ${t.orderNumber}</div>
    </div>

    <!-- Notch -->
    <div class="notch-wrap">
      <div class="notch-circle" style="margin-left:-12px;"></div>
      <div class="notch-line"></div>
      <div class="notch-circle" style="margin-right:-12px;"></div>
    </div>

    <!-- Status + folio -->
    <div class="status-wrap">
      <div class="status-chip">
        <div class="status-dot"></div>
        En proceso
      </div>
      <div class="folio">FOLIO ${folio}</div>
    </div>

    <!-- Fecha / Negocio -->
    <div class="section">
      <div class="section-label">Información del pedido</div>
      <div class="info-grid">
        <div class="info-cell">
          <div class="cell-label">Fecha</div>
          <div class="cell-value">${t.fecha}</div>
        </div>
        <div class="info-cell">
          <div class="cell-label">Negocio</div>
          <div class="cell-value">${t.negocioNombre}</div>
        </div>
        <div class="info-cell">
          <div class="cell-label">Cliente</div>
          <div class="cell-value">${t.usuarioNombre}</div>
        </div>
        <div class="info-cell">
          <div class="cell-label">Contacto</div>
          <div class="cell-value" style="font-size:11px;word-break:break-all;">${t.usuarioEmail}</div>
        </div>
      </div>
    </div>

    <!-- Entrega -->
    <div class="section">
      <div class="section-label">Dirección de entrega</div>
      <div class="address-box">${t.direccionEntrega}</div>
      ${t.notas ? `<div class="notes-row">Nota: ${t.notas}</div>` : ''}
    </div>

    <!-- Items -->
    <div class="section">
      <div class="section-label">Detalle del pedido</div>
      <table>
        <tbody>
          ${itemsRows}
          <tr><td colspan="2"><div class="sep-dashed"></div></td></tr>
          <tr class="summary-row">
            <td>Subtotal</td>
            <td class="summary-val">$${t.subtotal.toFixed(2)}</td>
          </tr>
          <tr class="summary-row">
            <td>Costo de envío</td>
            <td class="summary-val">${t.costoEnvio === 0 ? 'Gratis' : '$' + t.costoEnvio.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="total-section">
        <span class="total-label">Total pagado</span>
        <span class="total-value">$${t.total.toFixed(2)}</span>
      </div>
    </div>

    <!-- Barcode decorativo -->
    <div class="barcode-strip">
      ${[8,14,6,18,10,5,16,8,12,20,7,14,9,6,17,11,5,15,8,13,6].map(h => `<div class="bar" style="height:${h}px;"></div>`).join('')}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="confirmed-badge">
        <span class="check-icon">✓</span>
        Pedido confirmado
      </div>
      <p class="footer-msg">
        Gracias por elegir Kivo.<br/>
        Te notificaremos cuando tu pedido esté en camino.
      </p>
      <p class="footer-brand">KIVO · La Piedad, Michoacán</p>
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
    `🛵 *Pedido Confirmado — Kivo Delivery*\n\n` +
    `📋 *#${ticketData.orderNumber}*\n` +
    `🏪 ${ticketData.negocioNombre}\n\n` +
    `${itemsTexto}\n\n` +
    `💰 *Total: $${ticketData.total.toFixed(2)}*\n` +
    `📍 *Entrega:* ${ticketData.direccionEntrega}\n` +
    (ticketData.notas ? `📝 *Notas:* ${ticketData.notas}\n` : '') +
    `\n🗓️ ${ticketData.fecha}` +
    `\n\n_Enviado desde Kivo App_`;

  const phone = ticketData.usuarioTelefono.replace(/\D/g, '');
  const waUrl = `whatsapp://send?phone=52${phone}&text=${encodeURIComponent(mensaje)}`;
  const webUrl = `https://wa.me/52${phone}?text=${encodeURIComponent(mensaje)}`;

  const canOpen = await Linking.canOpenURL(waUrl);
  await Linking.openURL(canOpen ? waUrl : webUrl);
}

// ─── Compartir resumen de múltiples pedidos por WhatsApp (sin número fijo) ────

export interface OrdenResumen {
  orderNumber: string;
  negocioNombre: string;
  total: number;
}

export async function compartirOrdenesWhatsApp(
  ordenes: OrdenResumen[],
  totalGeneral: number,
  fecha: string
): Promise<void> {
  const lineas = ordenes
    .map(o => `  🏪 ${o.negocioNombre}\n  📋 #${o.orderNumber} — $${o.total.toFixed(2)}`)
    .join('\n\n');

  const resumenTotal = ordenes.length > 1
    ? `\n💳 *Total general: $${totalGeneral.toFixed(2)}*`
    : '';

  const mensaje =
    `🛵 *Pedido${ordenes.length > 1 ? 's' : ''} Confirmado${ordenes.length > 1 ? 's' : ''} — Kivo Delivery*\n\n` +
    `${lineas}\n` +
    `${resumenTotal}\n` +
    `\n🗓️ ${fecha}\n` +
    `\n_Tu pedido ya está siendo preparado. Te avisaremos cuando esté en camino._\n` +
    `_Kivo Delivery · La Piedad, Michoacán_`;

  const waUrl = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;
  const webUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  const canOpen = await Linking.canOpenURL(waUrl);
  await Linking.openURL(canOpen ? waUrl : webUrl);
}
