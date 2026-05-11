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
  negocioCategoria?: string;
  negocioCalificacion?: number;
  negocioHorario?: string;
  negocioDescripcion?: string;
  negocioTelefono?: string;
  negocioWhatsapp?: string;
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
  const folio = t.ordenId.slice(-8).toUpperCase();
  const initials = (t.negocioNombre ?? 'N')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  const stars = t.negocioCalificacion
    ? Math.round(Math.max(0, Math.min(5, t.negocioCalificacion)))
    : 0;
  const starsHtml = stars > 0
    ? `<div class="stars-row">
        ${'<span class="star filled">&#9733;</span>'.repeat(stars)}${'<span class="star empty">&#9733;</span>'.repeat(5 - stars)}
        <span class="rating-num">${t.negocioCalificacion!.toFixed(1)}</span>
      </div>`
    : '';

  const itemRows = t.items.map(i => `
    <div class="item-row">
      <div class="item-qty-wrap">
        <div class="item-qty">${i.quantity}</div>
      </div>
      <div class="item-body">
        <div class="item-name">${i.name}</div>
        <div class="item-unit">$${i.price.toFixed(2)} c/u</div>
      </div>
      <div class="item-subtotal">$${(i.price * i.quantity).toFixed(2)}</div>
    </div>`).join('');

  const bars = [4,9,6,14,8,3,12,7,15,5,11,18,6,9,4,13,7,10,5,16,8,3,12,6,14,7,4,11,8,15,5,9,6,14,3,12]
    .map(h => `<div class="bar" style="height:${h * 1.6}px;width:${h > 10 ? '3px' : '2px'};"></div>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Kivo — Pedido ${t.orderNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{
      font-family:-apple-system,'SF Pro Display','Segoe UI',system-ui,sans-serif;
      background:#0a0a0a;
      min-height:100vh;
      display:flex;align-items:flex-start;justify-content:center;
      padding:32px 16px;
    }
    .ticket{
      max-width:440px;width:100%;margin:0 auto;
      background:#fff;border-radius:32px;overflow:hidden;
      box-shadow:0 40px 100px rgba(0,0,0,.75),0 8px 32px rgba(0,0,0,.5);
    }

    /* ═══ HEADER ═══ */
    .hd{
      background:linear-gradient(155deg,#081208 0%,#0d1f0d 40%,#091509 100%);
      padding:30px 26px 26px;position:relative;overflow:hidden;
    }
    .hd::before{
      content:'';position:absolute;top:-70px;right:-50px;width:260px;height:260px;
      border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.13) 0%,transparent 65%);
    }
    .hd::after{
      content:'';position:absolute;bottom:-90px;left:-30px;width:220px;height:220px;
      border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.07) 0%,transparent 65%);
    }
    .hd-inner{position:relative;z-index:1;}

    .brand-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
    .brand-left{display:flex;align-items:center;gap:10px;}
    .logo-mark{
      width:42px;height:42px;
      background:linear-gradient(135deg,#22c55e,#15803d);border-radius:13px;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;font-weight:900;color:#fff;letter-spacing:-1px;
      box-shadow:0 4px 20px rgba(34,197,94,.5);
    }
    .brand-name{font-size:21px;font-weight:800;color:#fff;letter-spacing:-.5px;line-height:1;}
    .brand-sub{font-size:9px;font-weight:600;color:rgba(255,255,255,.32);letter-spacing:3px;text-transform:uppercase;margin-top:2px;}
    .status-pill{
      display:inline-flex;align-items:center;gap:5px;
      background:rgba(34,197,94,.14);border:1px solid rgba(34,197,94,.28);
      border-radius:99px;padding:6px 13px;
      font-size:10px;font-weight:700;color:#4ade80;letter-spacing:.5px;
    }
    .sdot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}

    .amount-label{font-size:10px;font-weight:600;color:rgba(255,255,255,.3);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:6px;}
    .amount-row{display:flex;align-items:flex-start;gap:2px;line-height:1;}
    .amount-curr{font-size:22px;font-weight:800;color:#22c55e;margin-top:8px;}
    .amount-val{font-size:60px;font-weight:900;color:#fff;letter-spacing:-4px;}

    .order-meta{
      display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;
      margin-top:20px;padding-top:16px;
      border-top:1px solid rgba(255,255,255,.06);
    }
    .meta-cell{padding-right:12px;}
    .meta-cell:last-child{padding-right:0;text-align:right;}
    .meta-label{font-size:8px;color:rgba(255,255,255,.28);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;}
    .meta-val{font-size:13px;font-weight:800;color:#fff;letter-spacing:.3px;}
    .meta-val-sm{font-size:11px;font-weight:600;color:rgba(255,255,255,.5);line-height:1.4;}

    /* ═══ TEAR ═══ */
    .tear{
      background:linear-gradient(155deg,#081208 0%,#0d1f0d 40%,#091509 100%);
      display:flex;align-items:center;height:28px;
    }
    .notch{width:28px;height:28px;border-radius:50%;background:#0a0a0a;flex-shrink:0;}
    .tear-line{flex:1;border-top:1.5px dashed rgba(255,255,255,.07);margin:0 4px;}

    /* ═══ SECTIONS ═══ */
    .sec{padding:20px 24px;border-bottom:1px solid #F1F3F5;}
    .sec:last-child{border-bottom:none;}
    .sec-hd{display:flex;align-items:center;gap:8px;margin-bottom:14px;}
    .sec-icon{
      width:28px;height:28px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .sec-title{font-size:9px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:2px;}

    /* ═══ RESTAURANT CARD ═══ */
    .biz-card{
      background:linear-gradient(135deg,#F0FDF4,#ECFDF5);
      border:1px solid #BBF7D0;border-radius:16px;overflow:hidden;
    }
    .biz-card-top{display:flex;align-items:flex-start;gap:14px;padding:16px;}
    .biz-avatar{
      width:54px;height:54px;flex-shrink:0;
      background:linear-gradient(135deg,#22c55e,#15803d);
      border-radius:14px;display:flex;align-items:center;justify-content:center;
      font-size:18px;font-weight:900;color:#fff;
      box-shadow:0 6px 20px rgba(34,197,94,.35);
    }
    .biz-info{flex:1;min-width:0;}
    .biz-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px;}
    .biz-name{font-size:17px;font-weight:800;color:#14532D;line-height:1.2;}
    .biz-cat{
      display:inline-block;
      background:#22c55e;color:#fff;
      font-size:9px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
      padding:3px 8px;border-radius:99px;white-space:nowrap;flex-shrink:0;margin-top:2px;
    }
    .stars-row{display:flex;align-items:center;gap:2px;margin-bottom:6px;}
    .star{font-size:13px;}
    .star.filled{color:#F59E0B;}
    .star.empty{color:#D1D5DB;}
    .rating-num{font-size:11px;font-weight:700;color:#6B7280;margin-left:4px;}
    .biz-desc{font-size:11px;color:#4B7C60;line-height:1.6;font-style:italic;}
    .biz-divider{height:1px;background:#BBF7D0;margin:0 16px;}
    .biz-meta{display:grid;grid-template-columns:1fr 1fr;gap:0;}
    .biz-meta-item{
      display:flex;align-items:center;gap:8px;
      padding:10px 16px;border-right:1px solid #BBF7D0;
    }
    .biz-meta-item:nth-child(2){border-right:none;}
    .biz-meta-item:nth-child(3){border-right:1px solid #BBF7D0;border-top:1px solid #BBF7D0;}
    .biz-meta-item:nth-child(4){border-right:none;border-top:1px solid #BBF7D0;}
    .biz-meta-icon{width:26px;height:26px;border-radius:8px;background:#DCFCE7;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .biz-meta-icon svg{display:block;}
    .biz-meta-text{font-size:11px;color:#374151;font-weight:500;line-height:1.4;}
    .biz-meta-label{font-size:9px;color:#9CA3AF;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-bottom:1px;}

    /* ═══ INFO GRID ═══ */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
    .info-cell{background:#F8FAFC;border-radius:11px;padding:11px 13px;}
    .i-label{font-size:8px;color:#94A3B8;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:4px;}
    .i-val{font-size:13px;color:#1E293B;font-weight:700;line-height:1.3;}
    .i-val-sm{font-size:11px;color:#475569;font-weight:600;word-break:break-all;line-height:1.4;}
    .info-cell.full{grid-column:1/3;}

    /* ═══ DELIVERY ═══ */
    .addr-box{
      display:flex;align-items:flex-start;gap:12px;
      background:#F0FDF4;border:1px solid #BBF7D0;border-radius:13px;padding:14px;
    }
    .addr-icon{
      width:30px;height:30px;background:#22c55e;border-radius:9px;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;
    }
    .addr-icon svg{display:block;}
    .addr-label{font-size:8px;color:rgba(255,255,255,.0);height:0;}
    .addr-text{font-size:13px;color:#166534;font-weight:600;line-height:1.6;}
    .notes-box{
      margin-top:10px;display:flex;align-items:flex-start;gap:10px;
      background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:12px 14px;
    }
    .notes-icon{
      width:28px;height:28px;background:#F59E0B;border-radius:8px;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
    }
    .notes-text{font-size:12px;color:#92400E;font-style:italic;line-height:1.6;}

    /* ═══ ITEMS ═══ */
    .items-list{margin-bottom:14px;}
    .item-row{
      display:flex;align-items:center;gap:12px;
      padding:11px 0;border-bottom:1px solid #F1F3F5;
    }
    .item-row:last-child{border-bottom:none;}
    .item-qty-wrap{flex-shrink:0;}
    .item-qty{
      width:30px;height:30px;background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:9px;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:800;color:#16a34a;
    }
    .item-body{flex:1;min-width:0;}
    .item-name{font-size:13px;color:#1E293B;font-weight:600;line-height:1.3;}
    .item-unit{font-size:10px;color:#94A3B8;margin-top:2px;}
    .item-subtotal{font-size:14px;font-weight:700;color:#111827;white-space:nowrap;}

    /* ═══ SUMMARY ═══ */
    .summary{background:#F8FAFC;border-radius:14px;overflow:hidden;border:1px solid #E2E8F0;}
    .sum-row{display:flex;justify-content:space-between;align-items:center;padding:10px 15px;border-bottom:1px solid #E2E8F0;}
    .sum-row:last-child{border-bottom:none;}
    .sum-label{font-size:12px;color:#64748B;}
    .sum-val{font-size:12px;font-weight:700;color:#374151;}
    .sum-badge{
      font-size:9px;font-weight:700;color:#16a34a;
      background:#DCFCE7;padding:2px 7px;border-radius:99px;letter-spacing:.3px;
    }

    .total-block{
      margin-top:12px;
      background:linear-gradient(135deg,#081208,#0d1f0d);
      border-radius:16px;padding:16px 20px;
      display:flex;justify-content:space-between;align-items:center;
    }
    .total-lbl{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:.3px;text-transform:uppercase;}
    .total-val{font-size:28px;font-weight:900;color:#22c55e;letter-spacing:-1px;}
    .total-items{font-size:9px;color:rgba(255,255,255,.3);margin-top:3px;}

    /* ═══ BARCODE ═══ */
    .barcode-area{
      padding:20px 24px 14px;
      display:flex;flex-direction:column;align-items:center;gap:9px;
      border-top:1px solid #F1F3F5;
    }
    .barcode-label{font-size:8px;color:#CBD5E1;letter-spacing:2px;text-transform:uppercase;font-weight:600;}
    .bars{display:flex;align-items:flex-end;gap:2.5px;}
    .bar{background:#1E293B;border-radius:1.5px;}
    .barcode-id{font-size:9px;color:#94A3B8;letter-spacing:4px;font-family:monospace;font-weight:600;}

    /* ═══ FOOTER ═══ */
    .footer{background:linear-gradient(135deg,#F8FAFC,#F0FDF4);padding:20px 24px 28px;text-align:center;border-top:1px solid #E8F5E9;}
    .confirm-badge{
      display:inline-flex;align-items:center;gap:8px;
      background:#DCFCE7;color:#166534;border:1px solid #BBF7D0;border-radius:99px;
      padding:8px 20px;font-size:12px;font-weight:700;margin-bottom:14px;
    }
    .check-circle{
      width:18px;height:18px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:50%;
      display:inline-flex;align-items:center;justify-content:center;
      font-size:10px;color:#fff;font-weight:900;
    }
    .footer-msg{font-size:12px;color:#6B7280;line-height:1.9;margin-bottom:16px;}
    .footer-divider{height:1px;background:#E2E8F0;margin:14px 0;}
    .footer-brand{font-size:10px;color:#9CA3AF;letter-spacing:3px;font-weight:700;text-transform:uppercase;}
    .footer-city{font-size:10px;color:#B0B8C1;margin-top:4px;letter-spacing:.5px;}
  </style>
</head>
<body>
<div class="ticket">

  <!-- ═══ HEADER ═══ -->
  <div class="hd">
    <div class="hd-inner">
      <div class="brand-row">
        <div class="brand-left">
          <div class="logo-mark">K</div>
          <div>
            <div class="brand-name">Kivo</div>
            <div class="brand-sub">Delivery</div>
          </div>
        </div>
        <div class="status-pill"><div class="sdot"></div>Confirmado</div>
      </div>

      <div class="amount-label">Total del pedido</div>
      <div class="amount-row">
        <span class="amount-curr">$</span>
        <span class="amount-val">${t.total.toFixed(2)}</span>
      </div>

      <div class="order-meta">
        <div class="meta-cell">
          <div class="meta-label">Pedido</div>
          <div class="meta-val">${t.orderNumber}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Folio</div>
          <div class="meta-val-sm">${folio}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-label">Fecha</div>
          <div class="meta-val-sm">${t.fecha}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ TEAR ═══ -->
  <div class="tear">
    <div class="notch" style="margin-left:-14px;"></div>
    <div class="tear-line"></div>
    <div class="notch" style="margin-right:-14px;"></div>
  </div>

  <!-- ═══ RESTAURANTE ═══ -->
  <div class="sec">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#F0FDF4;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2Z"/></svg>
      </div>
      <div class="sec-title">Restaurante</div>
    </div>
    <div class="biz-card">
      <div class="biz-card-top">
        <div class="biz-avatar">${initials}</div>
        <div class="biz-info">
          <div class="biz-header">
            <div class="biz-name">${t.negocioNombre}</div>
            ${t.negocioCategoria ? `<div class="biz-cat">${t.negocioCategoria}</div>` : ''}
          </div>
          ${starsHtml}
          ${t.negocioDescripcion ? `<div class="biz-desc">${t.negocioDescripcion}</div>` : ''}
        </div>
      </div>
      <div class="biz-divider"></div>
      <div class="biz-meta">
        ${t.negocioDireccion ? `
        <div class="biz-meta-item">
          <div class="biz-meta-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div>
            <div class="biz-meta-label">Dirección</div>
            <div class="biz-meta-text">${t.negocioDireccion}</div>
          </div>
        </div>` : ''}
        ${t.negocioHorario ? `
        <div class="biz-meta-item">
          <div class="biz-meta-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <div class="biz-meta-label">Horario</div>
            <div class="biz-meta-text">${t.negocioHorario}</div>
          </div>
        </div>` : ''}
        ${t.negocioTelefono ? `
        <div class="biz-meta-item">
          <div class="biz-meta-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.62 4.52 2 2 0 0 1 3.59 2.33h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17Z"/></svg>
          </div>
          <div>
            <div class="biz-meta-label">Teléfono</div>
            <div class="biz-meta-text">${t.negocioTelefono}</div>
          </div>
        </div>` : ''}
        ${t.negocioWhatsapp ? `
        <div class="biz-meta-item">
          <div class="biz-meta-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>
          </div>
          <div>
            <div class="biz-meta-label">WhatsApp</div>
            <div class="biz-meta-text">${t.negocioWhatsapp}</div>
          </div>
        </div>` : ''}
      </div>
    </div>
  </div>

  <!-- ═══ CLIENTE ═══ -->
  <div class="sec">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#EFF6FF;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="sec-title">Cliente</div>
    </div>
    <div class="info-grid">
      <div class="info-cell">
        <div class="i-label">Nombre</div>
        <div class="i-val">${t.usuarioNombre}</div>
      </div>
      ${t.usuarioTelefono ? `
      <div class="info-cell">
        <div class="i-label">Teléfono</div>
        <div class="i-val-sm">${t.usuarioTelefono}</div>
      </div>` : '<div class="info-cell"></div>'}
      <div class="info-cell full">
        <div class="i-label">Correo electrónico</div>
        <div class="i-val-sm">${t.usuarioEmail}</div>
      </div>
    </div>
  </div>

  <!-- ═══ ENTREGA ═══ -->
  <div class="sec">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#F0FDF4;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="sec-title">Dirección de entrega</div>
    </div>
    <div class="addr-box">
      <div class="addr-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="addr-text">${t.direccionEntrega}</div>
    </div>
    ${t.notas ? `
    <div class="notes-box">
      <div class="notes-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
      </div>
      <div class="notes-text"><strong>Nota:</strong> ${t.notas}</div>
    </div>` : ''}
  </div>

  <!-- ═══ ITEMS ═══ -->
  <div class="sec">
    <div class="sec-hd">
      <div class="sec-icon" style="background:#FFF7ED;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2.5" stroke-linecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      </div>
      <div class="sec-title">Detalle del pedido · ${t.items.length} producto${t.items.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="items-list">${itemRows}</div>
    <div class="summary">
      <div class="sum-row">
        <span class="sum-label">Subtotal (${t.items.reduce((a, i) => a + i.quantity, 0)} artículos)</span>
        <span class="sum-val">$${t.subtotal.toFixed(2)}</span>
      </div>
      <div class="sum-row">
        <span class="sum-label">Costo de envío</span>
        ${t.costoEnvio === 0
          ? `<span class="sum-badge">GRATIS</span>`
          : `<span class="sum-val">$${t.costoEnvio.toFixed(2)}</span>`}
      </div>
    </div>
    <div class="total-block">
      <div>
        <div class="total-lbl">Total pagado</div>
        <div class="total-items">${t.items.reduce((a, i) => a + i.quantity, 0)} artículo(s) · MXN</div>
      </div>
      <span class="total-val">$${t.total.toFixed(2)}</span>
    </div>
  </div>

  <!-- ═══ BARCODE ═══ -->
  <div class="barcode-area">
    <div class="barcode-label">ID de transacción</div>
    <div class="bars">${bars}</div>
    <div class="barcode-id">${t.ordenId.slice(-16).toUpperCase()}</div>
  </div>

  <!-- ═══ FOOTER ═══ -->
  <div class="footer">
    <div class="confirm-badge">
      <span class="check-circle">&#10003;</span>
      Pedido confirmado y procesado
    </div>
    <p class="footer-msg">
      Gracias por elegir <strong>Kivo Delivery</strong>.<br/>
      Tu pedido ha sido recibido y está siendo preparado.<br/>
      Te notificaremos cuando esté en camino.
    </p>
    <div class="footer-divider"></div>
    <div class="footer-brand">Kivo Delivery</div>
    <div class="footer-city">La Piedad, Michoacán</div>
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
