# 🛵 Pidelo — Tasks Pendientes
> **Periodo:** 2 marzo → 1 mayo 2026 | **Equipo:** Yahir · Jesús · Tú
> **Stack:** Python + FastAPI (backend) · React Native + Expo + TSX (frontend)

---

## 👥 División de responsabilidades

| Área | Responsable |
|---|---|
| Pedidos, Repartidores & Pagos | **Jesús** |
| Restaurantes, Menú & Reviews | **Yahir** |
| Usuarios, Auth & Cupones | **Tú** |

---

## Tú — Pendientes

**Auth avanzado**
- [ ] Sign In con Google (OAuth completo conectado a Supabase Auth)
- [ ] Sign In con X / Twitter (OAuth completo conectado a Supabase Auth)
- [x] Autenticación de 2 pasos (2FA) para login por correo electrónico ✅ (TOTP vía VerifyMfaModal + AuthContext)
- [ ] Páginas de Términos y Condiciones (deploy en Vercel)

**Perfiles**
- [ ] Subida de foto de perfil desde galería — cliente
- [ ] Subida de foto de perfil desde galería — repartidor

**Chatbot (frontend)**
- [x] Ventana del chatbot con diseño integrado al resto de la app ✅
- [x] Al confirmar el pedido, el chatbot muestra mensaje de agradecimiento personalizado ✅
- [x] Botón "Ver mi carrito" dentro del chat para que el usuario verifique antes de enviar ✅
- [x] El usuario confirma el pedido manualmente con un botón final (no automático) ✅

---

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

**Logo & Banner del negocio**
- [ ] Endpoint para subir logo del negocio a Supabase Storage
- [ ] Endpoint para subir banner del negocio a Supabase Storage
- [ ] Subida de logo del negocio desde galería (admin del negocio)
- [ ] Subida de banner del negocio desde galería (admin del negocio)

---

## Fernanda — Ventanas

**Screens**

- [] Disenar las ventanas restantes
- [] Reorganizarlas ventanas en assets
- [] Mejorar las ventanas que el equipo decida que ocupan mejora del diseno


---

## Jesús — Pendientes

**CRUD Menú (admin)**
- [ ] `POST /admin/menu/categorias`
- [ ] `POST /admin/menu/items` con personalizaciones
- [ ] `PATCH /admin/menu/items/:id` → precio, disponibilidad
- [ ] `DELETE /admin/menu/items/:id`
- [ ] Pantalla admin: gestión de categorías (crear, reordenar, activar/desactivar)
- [ ] Pantalla admin: gestión de items (crear, editar, eliminar)
- [ ] Toggle de disponibilidad de platillo en tiempo real
- [ ] Subida de foto del platillo a Supabase Storage

**Auth Repartidores**
- [ ] `POST /repartidores/registro` + middleware `isDriver`
- [ ] `PATCH /repartidores/estado` (offline/available/busy)
- [ ] `GET /repartidores/pedidos-disponibles`
- [ ] Pantalla de registro de repartidor (vehículo, placa)
- [ ] Toggle de disponibilidad (online/offline) en la app del repartidor
- [ ] Lista de pedidos disponibles para tomar en tiempo real

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

**Cupones**
- [ ] `POST /cupones/validar` → vigencia, usos, descuento por tipo
- [ ] Aplicar cupón en `POST /pedidos` → registrar en `cupones_uso`
- [ ] CRUD admin de cupones (`GET/POST /admin/cupones`)
- [ ] Campo de código de cupón en pantalla de resumen del pedido
- [ ] Validación en tiempo real con feedback (válido ✓ / inválido ✗)
- [ ] Descuento reflejado en el total antes de confirmar
- [ ] Pantalla admin: crear y gestionar cupones

**WebSocket & Notificaciones**
- [ ] WebSocket para repartidor (conexión persistente para ubicación y recepción de pedidos)
- [ ] Integración de notificaciones push (Expo Notifications / FCM) para eventos clave
- [ ] Notificaciones funcionales: nuevo pedido, cambio de estado, pedido entregado

**Tickets**
- [x] Generación de ticket al usuario al confirmar su pedido (número de orden, items y total) ✅ PDF con expo-print
- [x] PDF de ticket generado automáticamente, compartido via Share Sheet + WhatsApp al número registrado ✅

**Chatbot (backend)**
- [ ] Endpoint para que el chatbot reciba y procese el pedido del usuario
- [ ] Lógica para confirmar pedido desde el chat y generar la orden en la DB

---

## ⚠️ Dependencias clave

```
Auth de Tú (OAuth/2FA) listo → base segura antes de testing
WebSocket de Jesús listo → tracking en tiempo real operativo
Reviews de Yahir listas → visibles en perfil del negocio
Chatbot backend de Jesús listo → Tú conecta el flujo de confirmación en el frontend
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
| Landing / T&C | Vercel |
| Build | EAS (Expo Application Services) |
| Testing | Pytest (backend) |
| Docs | Swagger / Scalar |