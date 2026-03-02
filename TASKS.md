# 🛵 Pidelo — Backend Tasks
> **Periodo:** 2 marzo → 1 mayo 2026 | **Equipo:** Yahir · Jesús · Tú

---

## 👥 División de responsabilidades

| Área | Responsable |
|---|---|
| Pedidos, Repartidores & Pagos | **Jesús** |
| Restaurantes, Menú & Reviews | **Yahir** |
| Usuarios, Auth & Cupones | **Tú** |

---

## Semana 1 — 3–9 mar · Setup & Fundamentos

**Tú — Auth & Profiles**
- [ ] Configurar Supabase (dev + prod) y .env
- [ ] Probar trigger `handle_new_user`
- [ ] `GET /me` y `PATCH /me`
- [ ] Postman collection base

**Yahir — Negocios base**
- [ ] Setup repo (TypeScript, linter, estructura)
- [ ] `GET /negocios` con filtros
- [ ] `GET /negocios/:slug`
- [ ] `GET /sucursales/:id`

**Jesús — Pedidos base**
- [ ] Elegir framework (Hono/Fastify) y conectar DB
- [ ] Diagrama de estados del pedido
- [ ] `GET /pedidos` → historial del usuario

---

## Semana 2 — 10–16 mar · Domicilios, Menú & Crear Pedido

**Tú — Domicilios**
- [ ] CRUD completo de `/domicilios` (GET, POST, PATCH, DELETE)
- [ ] Validar trigger de domicilio predeterminado

**Yahir — Menú público**
- [ ] `GET /sucursales/:id/menu` (categorías + items)
- [ ] `GET /menu/items/search?q=` (búsqueda difusa pg_trgm)
- [ ] Validar JSONB de personalizaciones

**Jesús — Crear pedido**
- [ ] `POST /pedidos` → validar items, calcular totales, snapshot de precios
- [ ] `GET /pedidos/:id` con items

---

## Semana 3 — 17–23 mar · Panel Admin & Estados de Pedido

**Tú — Admin de Negocio**
- [ ] Middleware `isBusinessAdmin`
- [ ] `GET/PATCH /admin/negocios/:id`
- [ ] `POST/PATCH /admin/sucursales` + horarios JSONB

**Yahir — CRUD Menú admin**
- [ ] CRUD de menú admin (`/admin/menu/categorias`, `/admin/menu/items`)
- [ ] Subida de imágenes a Supabase Storage

**Jesús — Estados del pedido**
- [ ] `PATCH /admin/pedidos/:id/estado` → `pending → confirmed → preparing → ready`
- [ ] `PATCH /pedidos/:id/cancelar` (solo en pending/confirmed)
- [ ] Realtime suscripción a tabla `pedidos`

---

## Semana 4 — 24–30 mar · Repartidores & Tracking

**Tú — Auth Repartidores**
- [ ] `POST /repartidores/registro` + middleware `isDriver`
- [ ] `PATCH /repartidores/estado` (offline/available/busy)
- [ ] `GET /repartidores/pedidos-disponibles`

**Yahir — Búsqueda geoespacial**
- [ ] `GET /sucursales/cercanas?lat=&lng=&radio=` (PostGIS)
- [ ] Paginación en listados
- [ ] Swagger / OpenAPI de sus endpoints

**Jesús — Tracking en tiempo real**
- [ ] `POST /repartidores/ubicacion` → upsert GPS
- [ ] `PATCH /pedidos/:id/asignar-repartidor`
- [ ] `picked_up → on_the_way → delivered`
- [ ] Realtime a `repartidor_ubicacion`

---

## Semana 5 — 31 mar–6 abr · Pagos & Cupones

**Tú — Cupones**
- [ ] `POST /cupones/validar` → vigencia, usos, descuento por tipo
- [ ] Aplicar cupón en `POST /pedidos` → registrar en `cupones_uso`
- [ ] CRUD admin de cupones

**Yahir — Reviews**
- [ ] `POST /reviews` (solo pedidos `delivered`)
- [ ] `GET /sucursales/:id/reviews` con paginación
- [ ] Imágenes de reviews en Storage

**Jesús — Pagos**
- [ ] `POST /pagos` + webhook Stripe/MercadoPago
- [ ] `GET /pedidos/:id/pago`
- [ ] Lógica de reembolso → estado `refunded`

---

## Semana 6 — 7–13 abr · Testing

| | Tarea |
|---|---|
| **Tú** | Tests Auth, Domicilios, Cupones + validar RLS policies |
| **Yahir** | Tests Menú/Negocios/Reviews + seed script con datos de prueba |
| **Jesús** | Tests e2e flujo de pedido + pagos sandbox Stripe + rate limiting |

---

## Semana 7 — 14–20 abr · QA Cruzado

- QA cruzado (cada quien prueba endpoints del otro)
- Deploy a staging
- Smoke tests

---

## Semana 8 — 21 abr–1 may · Launch 🚀

- Fix de bugs del QA
- README + Postman collection final
- Deploy producción
- **Go-live 1 de mayo**

---

## ⚠️ Dependencias clave

```
Semana 1: Auth de Tú → Yahir y Jesús implementan sus middlewares
Semana 2: Menú de Yahir → Jesús puede crear pedidos
Semana 4: Flujo de pedido de Jesús → Tú implementa cupones (sem 5)
```

---

## 🗂 Endpoints por módulo

| Módulo | # Endpoints | Owner |
|---|---|---|
| Auth / Profiles | 4 | Tú |
| Domicilios | 5 | Tú |
| Negocio Admin | 5 | Tú |
| Cupones | 4 | Tú |
| Negocios / Sucursales | 5 | Yahir |
| Menú público | 4 | Yahir |
| Menú admin | 5 | Yahir |
| Reviews | 3 | Yahir |
| Geolocalización | 2 | Yahir |
| Pedidos | 5 | Jesús |
| Estados de pedido | 3 | Jesús |
| Repartidores | 5 | Jesús |
| Tracking | 3 | Jesús |
| Pagos | 4 | Jesús |

---

## 🛠 Stack sugerido

- **Runtime:** Node.js + TypeScript
- **Framework:** Hono o Fastify
- **DB Client:** Supabase JS Client
- **Auth:** Supabase Auth (JWT)
- **Storage:** Supabase Storage
- **Pagos:** Stripe (sandbox primero)
- **Testing:** Vitest
- **Docs:** Swagger / Scalar
- **CI/CD:** GitHub Actions