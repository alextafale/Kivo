# 🛵 Pidelo — Tasks Pendientes
> **Periodo:** 2 marzo → 1 mayo 2026 | **Equipo:** Yahir · Jesús · Alex · Fernanda
> **Stack:** Python + FastAPI (backend) · React Native + Expo + TSX (frontend)

---

## 👥 División de responsabilidades

| Área | Responsable |
|---|---|
| Pedidos, Repartidores & Pagos | **Jesús** |
| Restaurantes, Menú & Reviews | **Yahir** |
| Usuarios, Auth & Cupones | **Alex** |
| Diseño & Frontend | **Fernanda** |

---

## Alex — Pendientes





## Yahir — Pendientes

**Búsqueda & Geoespacial**
- [ ] `GET /sucursales/cercanas?lat=&lng=&radio=` (PostGIS)
- [ ] `GET /negocios?ciudad=` → filtro por ciudad
- [ ] Paginación en listados de negocios y menú
- [ ] Home mostrando negocios cercanos usando GPS del dispositivo
- [ ] Mapa con marcadores de sucursales cercanas (react-native-maps)
- [ ] Paginación / scroll infinito en listado de negocios

**Documentación**
- [ ] Documentar todos sus endpoints en Swagger / OpenAPI (descripciones, ejemplos, códigos de error)

**Reviews & Negocio**
- [ ] `POST /reviews` (solo pedidos `delivered`)
- [ ] `GET /sucursales/:id/reviews` con paginación
- [ ] `GET /negocios/:id/reviews` → reseñas publicadas en el perfil del negocio
- [ ] Modal de review al marcar pedido como entregado
- [ ] Calificación separada: comida, entrega, general (estrellitas)
- [ ] Sección de reviews en pantalla de sucursal con paginación
- [ ] Subida de fotos opcionales en la review
- [ ] Sección de reseñas visible en el perfil/detalle del negocio


**IA — Generación automática de descripciones de platillos**
- [ ] `POST /admin/menu/items/generar-descripcion` → `{ nombre, foto_url }` → `{ descripcion }`
- [ ] El LLM genera descripción en 2-3 oraciones, el admin puede editar o regenerar antes de guardar
- [ ] Se integra al flujo de creación de item (no es paso extra para el admin)

**IA — Endpoint de categorización de platillos**
- [ ] `POST /admin/menu/items/categorizar` → `{ nombre, descripcion }` → `{ categoria, confianza }`
- [ ] Categorías válidas: Entradas / Platos fuertes / Postres / Bebidas / Otros

---

## Fernanda — Pendientes

**Screens & Assets**
- [ ] Reorganizar las pantallas existentes en assets
- [ ] Diseñar las ventanas que el equipo identifique como faltantes
- [ ] Mejorar el diseño de las pantallas que el equipo decida

**Perfil del negocio — Social (UI)**
- [ ] Sección de comentarios en el perfil del negocio — estilo feed de Facebook (foto de usuario, nombre, texto, fecha)
- [ ] Componente de reacciones — barra de emojis (👍 ❤️ 😂 😮 😢) con conteo por tipo
- [ ] Animación al reaccionar (tap → emoji flota brevemente)
- [ ] Pantalla de comentarios expandida con scroll infinito
- [ ] Distinguir visualmente comentarios del dueño del negocio (badge "Dueño")

---

## Jesús — Pendientes

**CRUD Menú (admin)**

- [ ] Pantalla admin: gestión de categorías (crear, reordenar, activar/desactivar)


**Tracking en tiempo real**
- [ ] `POST /repartidores/ubicacion` → upsert GPS
- [ ] `PATCH /pedidos/:id/asignar-repartidor`
- [ ] Endpoints: `picked_up → on_the_way → delivered`
- [ ] Realtime suscripción a `repartidor_ubicacion`
- [ ] App repartidor: enviar ubicación GPS cada N segundos
- [ ] App cliente: mapa en vivo con pin del repartidor moviéndose
- [ ] ETA estimado visible para el cliente durante la entrega
- [ ] Pantalla de "Pedido entregado" con resumen final

**Pagos**
- [ ] `POST /pagos` + webhook Stripe/MercadoPago
- [ ] `GET /pedidos/:id/pago` → estado del pago
- [ ] Lógica de reembolso → estado `refunded`
- [ ] Selector de método de pago (efectivo, tarjeta, transferencia)
- [ ] Flujo de pago con tarjeta via Stripe SDK en Expo
- [ ] Pantalla de estado del pago (procesando / completado / fallido)
- [ ] Historial de pagos en el perfil del usuario

**WebSocket & Notificaciones**
- [ ] WebSocket para repartidor (conexión persistente para ubicación y recepción de pedidos)
- [ ] Integración de notificaciones push (Expo Notifications / FCM) para eventos clave
- [ ] Notificaciones funcionales: nuevo pedido, cambio de estado, pedido entregado

**IA — Contexto de queja para resolución automática**
- [ ] `POST /orders/{order_id}/queja` → retorna contexto (tiempo entrega real vs prometido, items, total, historial quejas del usuario en los últimos 30 días)
- [ ] `POST /orders/{order_id}/resolucion` → ejecuta la acción decidida por el LLM (reembolso parcial / cupón / disculpa)
- [ ] Tabla `quejas_resoluciones` en Supabase (pedido_id, usuario_id, accion, monto, razon_interna, created_at)

---

## ✅ Completado

| Integrante | Feature |
|---|---|
| Alex | Sign In con Google (OAuth + Supabase Auth) |
| Alex | Sign In con X / Twitter (OAuth + Supabase Auth) |
| Alex | Autenticación de 2 pasos — TOTP vía VerifyMfaModal + AuthContext |
| Alex | Páginas de Términos y Condiciones (Vercel) |
| Alex | Subida de foto de perfil desde galería — cliente |
| Alex | Subida de foto de perfil desde galería — repartidor |
| Alex | Cupones — dominio, repositorio, hooks, pantallas cliente y admin, migración Supabase con RLS |
| Alex | Chatbot frontend — ventana integrada, agradecimiento personalizado, botón carrito, confirmación manual |
| Jesús | Tickets PDF — generación con expo-print, compartido via Share Sheet + WhatsApp |
| Jesús | Chatbot backend — endpoint recibe y procesa pedido, genera orden en DB |
| Jesús | Auth repartidores — registro, estado, pedidos disponibles |

---

## ⚠️ Dependencias clave

```
CRUD menú de Jesús listo        → Yahir conecta generación de descripciones (IA)
                                → Alex activa categorización automática (IA)
Reviews de Yahir listas         → Alex activa respuestas sugeridas a reviews negativas (IA)
Endpoint queja de Jesús listo   → Alex conecta resolución automática de quejas
WebSocket de Jesús listo        → tracking en tiempo real operativo
Screens de Fernanda             → pantalla ReportarProblema para resolución de quejas
```

---

## 🛠 Stack

| Capa | Tecnología |
|---|---|
| Backend | Python + FastAPI |
| Base de datos | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (JWT + OAuth + 2FA) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime + WebSocket |
| Frontend | React Native + Expo + TSX |
| Mapas | react-native-maps |
| Pagos | Stripe SDK |
| Notificaciones | Expo Notifications / FCM |
| IA | Qwen (modelo gratuito, integrado) |
| Landing / T&C | Vercel |
| Build | EAS (Expo Application Services) |
| Docs | Swagger / Scalar |