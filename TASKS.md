# 🛵 Pidelo — Tasks Fullstack
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

## Semana 1 — 3–9 mar · Setup & Fundamentos

### Tú — Auth & Profiles
**Backend**
- [ ] Configurar Supabase (dev + prod) y variables de entorno
- [ ] Probar trigger `handle_new_user`
- [ ] `GET /me` → perfil del usuario autenticado
- [ ] `PATCH /me` → actualizar nombre, teléfono, avatar

**Frontend**
- [ ] Conectar Supabase Auth en Expo (login, registro, logout)
- [ ] Pantalla de Login y Registro funcionando con la DB
- [ ] Guardar sesión con AsyncStorage / SecureStore
- [ ] Pantalla de Perfil mostrando datos reales del usuario

---

### Yahir — Negocios base
**Backend**
- [ ] Setup repo (FastAPI, virtual env, estructura de carpetas, Pydantic schemas)
- [ ] `GET /negocios` con filtros (categoría, ciudad, activo)
- [ ] `GET /negocios/:slug` → detalle del negocio
- [ ] `GET /sucursales/:id` → detalle de sucursal

**Frontend**
- [ ] Pantalla Home mostrando listado real de negocios desde API
- [ ] Filtros funcionales (categoría, ciudad)
- [ ] Pantalla de detalle del negocio con info real (logo, banner, descripción)
- [ ] Pantalla de detalle de sucursal (dirección, horarios, calificación)

---

### Jesús — Pedidos base
**Backend**
- [ ] Setup FastAPI + conectar Supabase con supabase-py
- [ ] Diagrama de estados del pedido
- [ ] `GET /pedidos` → historial del usuario

**Frontend**
- [ ] Pantalla "Mis pedidos" conectada a la API
- [ ] Lista de pedidos con estado, fecha y total reales
- [ ] Componente de tarjeta de pedido con badge de estado

---

## Semana 2 — 10–16 mar · Domicilios, Menú & Crear Pedido

### Tú — Domicilios
**Backend**
- [ ] `GET /domicilios` → domicilios del usuario
- [ ] `POST /domicilios` → crear con coordenadas GPS
- [ ] `PATCH /domicilios/:id` → editar
- [ ] `DELETE /domicilios/:id` → eliminar
- [ ] Validar trigger de domicilio predeterminado

**Frontend**
- [ ] Pantalla "Mis domicilios" listando direcciones reales
- [ ] Formulario de agregar/editar domicilio con mapa (react-native-maps)
- [ ] Selector de domicilio predeterminado funcionando
- [ ] Selector de domicilio al hacer un pedido

---

### Yahir — Menú público
**Backend**
- [ ] `GET /sucursales/:id/menu` → categorías + items disponibles
- [ ] `GET /menu/items/search?q=` → búsqueda difusa (pg_trgm)
- [ ] Validar estructura JSONB de personalizaciones

**Frontend**
- [ ] Pantalla de Menú por sucursal con categorías y platillos reales
- [ ] Scroll de categorías con filtrado por sección
- [ ] Buscador de platillos funcionando (búsqueda difusa)
- [ ] Pantalla de detalle de platillo (foto, precio, personalizaciones)

---

### Jesús — Crear pedido
**Backend**
- [ ] `POST /pedidos` → validar items, calcular totales, snapshot de precios
- [ ] `GET /pedidos/:id` → detalle con items

**Frontend**
- [ ] Carrito funcional: agregar/quitar items, elegir personalizaciones
- [ ] Pantalla de resumen de pedido (items, subtotal, envío, total)
- [ ] Botón "Hacer pedido" conectado a la API
- [ ] Pantalla de confirmación con `order_number` real

---

## Semana 3 — 17–23 mar · Panel Admin & Estados de Pedido

### Tú — Admin de Negocio
**Backend**
- [ ] Middleware `isBusinessAdmin`
- [ ] `GET/PATCH /admin/negocios/:id`
- [ ] `POST/PATCH /admin/sucursales` + horarios JSONB

**Frontend**
- [ ] Pantalla admin: info del negocio editable (nombre, descripción, logo)
- [ ] Formulario de sucursal: dirección, horarios, radio de entrega
- [ ] Subida de logo/banner a Supabase Storage desde la app
- [ ] Validación de formularios con feedback visual

---

### Yahir — CRUD Menú (admin)
**Backend**
- [ ] `POST /admin/menu/categorias`
- [ ] `POST /admin/menu/items` con personalizaciones
- [ ] `PATCH /admin/menu/items/:id` → precio, disponibilidad
- [ ] `DELETE /admin/menu/items/:id`

**Frontend**
- [ ] Pantalla admin: gestión de categorías (crear, reordenar, activar/desactivar)
- [ ] Pantalla admin: gestión de items (crear, editar, eliminar)
- [ ] Toggle de disponibilidad de platillo en tiempo real
- [ ] Subida de foto del platillo a Supabase Storage

---

### Jesús — Estados del pedido
**Backend**
- [ ] `PATCH /admin/pedidos/:id/estado` → `pending → confirmed → preparing → ready`
- [ ] `PATCH /pedidos/:id/cancelar` (solo en pending/confirmed)
- [ ] Suscripción Realtime a tabla `pedidos`

**Frontend**
- [ ] Pantalla admin: lista de pedidos entrantes en tiempo real
- [ ] Botones para confirmar, preparar y marcar como listo
- [ ] Pantalla cliente: detalle del pedido con estado actualizado en vivo
- [ ] Notificación push / toast al cambiar el estado del pedido

---

## Semana 4 — 24–30 mar · Repartidores & Tracking

### Tú — Auth Repartidores
**Backend**
- [ ] `POST /repartidores/registro` + middleware `isDriver`
- [ ] `PATCH /repartidores/estado` (offline/available/busy)
- [ ] `GET /repartidores/pedidos-disponibles`

**Frontend**
- [ ] Pantalla de registro de repartidor (vehículo, placa)
- [ ] Toggle de disponibilidad (online/offline) en la app del repartidor
- [ ] Lista de pedidos disponibles para tomar en tiempo real

---

### Yahir — Búsqueda geoespacial
**Backend**
- [ ] `GET /sucursales/cercanas?lat=&lng=&radio=` (PostGIS)
- [ ] `GET /negocios?ciudad=` → filtro por ciudad
- [ ] Paginación en listados de negocios y menú

**Frontend**
- [ ] Home mostrando negocios cercanos usando GPS del dispositivo
- [ ] Mapa con marcadores de sucursales cercanas (react-native-maps)
- [ ] Paginación / scroll infinito en listado de negocios
- [ ] Swagger / OpenAPI: documentar sus endpoints

---

### Jesús — Tracking en tiempo real
**Backend**
- [ ] `POST /repartidores/ubicacion` → upsert GPS
- [ ] `PATCH /pedidos/:id/asignar-repartidor`
- [ ] Endpoints: `picked_up → on_the_way → delivered`
- [ ] Realtime suscripción a `repartidor_ubicacion`

**Frontend**
- [ ] App repartidor: enviar ubicación GPS cada N segundos
- [ ] App cliente: mapa en vivo con pin del repartidor moviéndose
- [ ] ETA estimado visible para el cliente durante la entrega
- [ ] Pantalla de "Pedido entregado" con resumen final

---

## Semana 5 — 31 mar–6 abr · Pagos & Cupones

### Tú — Cupones
**Backend**
- [ ] `POST /cupones/validar` → vigencia, usos, descuento por tipo
- [ ] Aplicar cupón en `POST /pedidos` → registrar en `cupones_uso`
- [ ] CRUD admin de cupones (`GET/POST /admin/cupones`)

**Frontend**
- [ ] Campo de código de cupón en pantalla de resumen del pedido
- [ ] Validación en tiempo real con feedback (válido ✓ / inválido ✗)
- [ ] Descuento reflejado en el total antes de confirmar
- [ ] Pantalla admin: crear y gestionar cupones

---

### Yahir — Reviews
**Backend**
- [ ] `POST /reviews` (solo pedidos `delivered`)
- [ ] `GET /sucursales/:id/reviews` con paginación

**Frontend**
- [ ] Modal de review al marcar pedido como entregado
- [ ] Calificación separada: comida, entrega, general (estrellitas)
- [ ] Sección de reviews en pantalla de sucursal con paginación
- [ ] Subida de fotos opcionales en la review

---

### Jesús — Pagos
**Backend**
- [ ] `POST /pagos` + webhook Stripe/MercadoPago
- [ ] `GET /pedidos/:id/pago` → estado del pago
- [ ] Lógica de reembolso → estado `refunded`

**Frontend**
- [ ] Selector de método de pago (efectivo, tarjeta, transferencia)
- [ ] Flujo de pago con tarjeta via Stripe SDK en Expo
- [ ] Pantalla de estado del pago (procesando / completado / fallido)
- [ ] Historial de pagos en el perfil del usuario

---

## Semana 6 — 7–13 abr · Testing

| | Backend | Frontend |
|---|---|---|
| **Tú** | Tests Auth, Domicilios, Cupones + validar RLS | QA flujos de usuario: registro, domicilios, cupones |
| **Yahir** | Tests Menú/Negocios/Reviews + seed script | QA pantallas de menú, búsqueda y reviews |
| **Jesús** | Tests e2e pedido + pagos sandbox Stripe + rate limiting | QA flujo completo: carrito → pago → tracking |

---

## Semana 7 — 14–20 abr · QA Cruzado

- [ ] QA cruzado: cada quien prueba la app del área de los otros
- [ ] Pruebas en dispositivo físico (iOS + Android)
- [ ] Deploy backend a staging
- [ ] Build de Expo en staging (EAS Build)
- [ ] Smoke tests de la app completa

---

## Semana 8 — 21 abr–1 may · Launch 🚀

- [ ] Fix de bugs del QA
- [ ] README final + Postman collection exportada
- [ ] Deploy backend a producción
- [ ] Build de producción en EAS (Expo Application Services)
- [ ] Smoke tests en producción
- [ ] **🚀 Go-live 1 de mayo**

---

## ⚠️ Dependencias clave

```
Semana 1: Auth de Tú listo → Yahir y Jesús pueden usar sesión en sus pantallas
Semana 2: Menú de Yahir listo → Jesús puede integrar el carrito y crear pedidos
Semana 2: Domicilios de Tú listos → Jesús los usa al crear un pedido
Semana 4: Tracking de Jesús listo → Tú puede mostrar cupones en el flujo de pago
```

---

## 🛠 Stack

| Capa | Tecnología |
|---|---|
| Backend | Python + FastAPI |
| Base de datos | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Frontend | React Native + Expo + TSX |
| Mapas | react-native-maps |
| Pagos | Stripe SDK |
| Build | EAS (Expo Application Services) |
| Testing | Pytest (backend) |
| Docs | Swagger / Scalar 