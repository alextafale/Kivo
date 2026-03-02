# TASKS — Pidelo Backend & Frontend Repartidor

> Stack: FastAPI (backend) · Firebase (Firestore + Realtime DB + Auth) · WebSocket (notificaciones) · expo-location (tracking)
> Última actualización: Febrero 2026

---

## Convenciones Generales

- Base URL: `/api/v1`
- Auth: Firebase Auth token en header `Authorization: Bearer <token>`
- Roles: `user` | `business` | `delivery`
- Respuesta exitosa: `{ "success": true, "data": { ... } }`
- Respuesta de error: `{ "success": false, "message": "..." }`
- Validación: Pydantic en todos los endpoints (nativo en FastAPI)
- Base de datos: Firestore para datos estructurados · Realtime Database para tracking en vivo
- Notificaciones en tiempo real: WebSocket en `/ws/notifications/{user_id}`
- Documentación: FastAPI genera Swagger automático en `/docs`

---

## INDICE DE MODULOS

| # | Módulo | Rol | Prioridad |
|---|--------|-----|-----------|
| 1 | Autenticación usuario | user | Alta |
| 2 | Autenticación negocio | business | Alta |
| 3 | Autenticación repartidor | delivery | Alta |
| 4 | HomeFeed & Negocios | user | Alta |
| 5 | Menú del Negocio | business | Alta |
| 6 | Carrito | user | Alta |
| 7 | Checkout & Órdenes | user/business | Alta |
| 8 | Pagos & Métodos de pago | user | Alta |
| 9 | Tracking en vivo | user/delivery | Alta |
| 10 | Notificaciones WebSocket | user/business/delivery | Alta |
| 11 | Gestión de órdenes negocio | business | Media |
| 12 | Dashboard & Insights | business | Media |
| 13 | Perfil de usuario | user | Media |
| 14 | Direcciones | user | Media |
| 15 | Favoritos | user | Media |
| 16 | Calificaciones & Reseñas | user | Media |
| 17 | Chatbot usuario | user | Baja |
| 18 | Chatbot config negocio | business | Baja |
| 19 | Soporte & Ayuda | user | Baja |
| 20 | Configuración del negocio | business | Baja |
| 21 | Frontend Repartidor | delivery | Alta |

---

## 1. Autenticación — Usuario

**Frontend:** `/screens/auth/Login.tsx`, `Signup.tsx`
**Colección Firestore:** `users`

**Endpoints:**
```
POST  /api/v1/auth/register         (publico) Registro email/password via Firebase Auth
POST  /api/v1/auth/login            (publico) Login, devuelve Firebase ID token
POST  /api/v1/auth/logout           Invalidar sesion
POST  /api/v1/auth/forgot-password  (publico) Enviar email de recuperacion
GET   /api/v1/auth/me               Datos del usuario autenticado
```

**Documento Firestore `users/{uid}`:**
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "avatar_url": "string",
  "role": "user",
  "created_at": "timestamp"
}
```

---

## 2. Autenticación — Negocio

**Frontend:** `/screens/admin/auth/Login.tsx`, `Signup.tsx`
**Colección Firestore:** `businesses`

**Endpoints:**
```
POST  /api/v1/auth/business/register  (publico) Registro de negocio
POST  /api/v1/auth/business/login     (publico) Login de negocio
GET   /api/v1/auth/business/me        Perfil del negocio autenticado
```

**Documento Firestore `businesses/{uid}`:**
```json
{
  "uid": "string",
  "owner_name": "string",
  "business_name": "string",
  "email": "string",
  "phone": "string",
  "logo_url": "string",
  "category": "string",
  "address": "string",
  "location": { "lat": 0.0, "lng": 0.0 },
  "rating": 0.0,
  "is_open": true,
  "role": "business",
  "created_at": "timestamp"
}
```

---

## 3. Autenticación — Repartidor

**Frontend:** A desarrollar (ver sección 21)
**Colección Firestore:** `delivery_drivers`

**Endpoints:**
```
POST   /api/v1/auth/delivery/register  (publico) Registro de repartidor
POST   /api/v1/auth/delivery/login     (publico) Login de repartidor
GET    /api/v1/auth/delivery/me        Perfil del repartidor
PATCH  /api/v1/auth/delivery/me        Actualizar datos personales
PATCH  /api/v1/delivery/status         Cambiar disponibilidad { is_available: bool }
```

**Documento Firestore `delivery_drivers/{uid}`:**
```json
{
  "uid": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "vehicle_type": "moto | bici | auto",
  "is_available": true,
  "current_location": { "lat": 0.0, "lng": 0.0 },
  "role": "delivery",
  "rating": 0.0,
  "created_at": "timestamp"
}
```

---

## 4. HomeFeed & Negocios

**Frontend:** `/screens/homeFeed/homeFeed.tsx`, `/screens/business/Businessdatailscreen.tsx`
**Colección Firestore:** `businesses`

**Endpoints:**
```
GET  /api/v1/feed                              Listado de negocios (filtros: category, search, lat, lng, radius)
GET  /api/v1/feed/categories                   Categorias disponibles
GET  /api/v1/feed/featured                     Negocios destacados
GET  /api/v1/businesses/{business_id}          Detalle completo del negocio
GET  /api/v1/businesses/{business_id}/reviews  Reseñas del negocio (paginadas)
```

---

## 5. Menú del Negocio

**Frontend:** `/screens/admin/menuManegement`, `/screens/admin/menuEdit`, `/screens/admin/businessSettings/menu`
**Subcolecciones Firestore:** `businesses/{id}/menu_categories`, `businesses/{id}/menu_items`

**Endpoints:**
```
GET     /api/v1/businesses/{business_id}/menu                Menu completo publico
POST    /api/v1/business/menu/categories                     Crear categoria de menu
PATCH   /api/v1/business/menu/categories/{category_id}       Editar categoria
DELETE  /api/v1/business/menu/categories/{category_id}       Eliminar categoria
POST    /api/v1/business/menu/items                          Crear producto
PATCH   /api/v1/business/menu/items/{item_id}                Editar producto
DELETE  /api/v1/business/menu/items/{item_id}                Eliminar producto
PATCH   /api/v1/business/menu/items/{item_id}/availability   Activar/desactivar producto
```

**Documento `menu_items/{id}`:**
```json
{
  "id": "string",
  "business_id": "string",
  "category_id": "string",
  "name": "string",
  "description": "string",
  "price": 0.0,
  "image_url": "string",
  "is_available": true
}
```

---

## 6. Carrito

**Frontend:** `/screens/homeFeed/homeFeed.tsx`, `/screens/orders/Order.tsx`
**Colección Firestore:** `carts`

**Endpoints:**
```
GET     /api/v1/cart                     Obtener carrito activo del usuario
POST    /api/v1/cart/items               Agregar item { item_id, quantity, notes? }
PATCH   /api/v1/cart/items/{item_id}     Actualizar cantidad
DELETE  /api/v1/cart/items/{item_id}     Eliminar item
DELETE  /api/v1/cart                     Vaciar carrito
```

**Lógica:**
- Un usuario = un carrito activo a la vez
- Si agrega producto de otro negocio: retornar error 409 para que el frontend pida confirmacion
- Validar disponibilidad del producto en cada operacion

---

## 7. Checkout & Órdenes

**Frontend:** `/screens/orders/Order.tsx`, `orderTraking.tsx`, `/screens/liveOrderTracking`
**Colección Firestore:** `orders`

**Endpoints:**
```
POST   /api/v1/checkout                           Crear checkout desde carrito activo
GET    /api/v1/checkout/{checkout_id}             Detalle del checkout
PATCH  /api/v1/checkout/{checkout_id}/address     Asignar direccion de entrega
PATCH  /api/v1/checkout/{checkout_id}/confirm     Confirmar y procesar orden

GET    /api/v1/orders                             Listar ordenes del usuario (filtros: status)
GET    /api/v1/orders/{order_id}                  Detalle de una orden
PATCH  /api/v1/orders/{order_id}/cancel           Cancelar orden (solo si esta en pending)

[NEGOCIO]
GET    /api/v1/business/orders                    Listar ordenes recibidas por el negocio
PATCH  /api/v1/business/orders/{order_id}/status  Actualizar estado de la orden
```

**Estados de orden:** `pending → confirmed → preparing → ready → on_the_way → delivered | cancelled`

**Documento Firestore `orders/{id}`:**
```json
{
  "id": "string",
  "user_id": "string",
  "business_id": "string",
  "driver_id": "string | null",
  "items": [{ "item_id": "", "name": "", "price": 0, "quantity": 0 }],
  "status": "pending",
  "subtotal": 0.0,
  "delivery_fee": 0.0,
  "total": 0.0,
  "address": { "street": "", "lat": 0.0, "lng": 0.0 },
  "payment_id": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## 8. Pagos & Métodos de Pago

**Frontend:** `/screens/payments/confirmPayment.tsx`, `paymentSucess.tsx`, `/screens/PaymentsMethod`
**Colección Firestore:** `payment_methods`, `payments`

**Endpoints:**
```
GET    /api/v1/payments/methods                      Listar metodos de pago del usuario
POST   /api/v1/payments/methods                      Agregar tarjeta/metodo (via Stripe)
DELETE /api/v1/payments/methods/{method_id}          Eliminar metodo
PATCH  /api/v1/payments/methods/{method_id}/default  Marcar como predeterminado
POST   /api/v1/payments/process                      Procesar pago { checkout_id, method_id }
GET    /api/v1/payments/{payment_id}                 Estado de un pago
```

**Lógica:**
- Integrar con Stripe (SDK Python disponible: `stripe`)
- Estados de pago: `pending → processing → success | failed`
- Al exito: crear orden en Firestore + notificar al negocio via WebSocket

---

## 9. Tracking en Vivo

**Frontend:** `/screens/orders/orderTraking.tsx`, `/screens/liveOrderTracking`

**Implementacion:**

El repartidor usa `expo-location` con `watchPositionAsync` para enviar su posicion cada 5 segundos.
La posicion se escribe directamente en Firebase Realtime Database (baja latencia):

```
Realtime DB:
/tracking/{order_id}/driver_location: { lat, lng, timestamp }
/tracking/{order_id}/status: "on_the_way"
```

La app del usuario escucha ese nodo en tiempo real con el SDK de Firebase.

**Endpoints FastAPI:**
```
GET   /api/v1/orders/{order_id}/tracking              Estado actual + ultima ubicacion
POST  /api/v1/delivery/location                       Repartidor actualiza ubicacion { order_id, lat, lng }
POST  /api/v1/business/orders/{order_id}/assign-driver  Asignar repartidor a una orden
```

---

## 10. Notificaciones en Tiempo Real (WebSocket)

**Frontend:** `/screens/notifications`, `/screens/admin/notifications/businessNotifications.tsx`
**Colección Firestore:** `notifications`

**WebSocket:**
```
WS  /ws/notifications/{user_id}   Conexion persistente para recibir notificaciones en tiempo real
```

**Endpoints REST (para historial):**
```
GET    /api/v1/notifications                 Listar notificaciones (paginadas)
GET    /api/v1/notifications/unread-count    Contador de no leidas
PATCH  /api/v1/notifications/{id}/read       Marcar como leida
PATCH  /api/v1/notifications/read-all        Marcar todas como leidas
DELETE /api/v1/notifications/{id}            Eliminar notificacion
```

**Eventos que disparan notificaciones:**

| Tipo | Destinatario | Disparador |
|------|-------------|------------|
| `new_order` | business | Usuario confirma orden |
| `order_confirmed` | user | Negocio confirma orden |
| `order_preparing` | user | Negocio empieza a preparar |
| `order_ready` | delivery | Orden lista para recoger |
| `order_picked_up` | user | Repartidor recoge la orden |
| `order_delivered` | user | Orden entregada |
| `order_cancelled` | user / business | Cualquiera cancela |
| `new_review` | business | Usuario deja reseña |
| `new_delivery_request` | delivery | Orden disponible cerca |

**Implementacion WebSocket en FastAPI:**
```python
active_connections: dict[str, WebSocket] = {}

@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        del active_connections[user_id]

async def send_notification(user_id: str, payload: dict):
    if user_id in active_connections:
        await active_connections[user_id].send_json(payload)
```

---

## 11. Gestión de Órdenes — Negocio

**Frontend:** `/screens/admin/manageOrders/manageOrders.tsx`, `/screens/admin/orderList/orderList.tsx`

**Endpoints:**
```
GET    /api/v1/business/orders                        Listar ordenes (filtros: status, fecha)
GET    /api/v1/business/orders/{order_id}             Detalle de orden
PATCH  /api/v1/business/orders/{order_id}/status      Cambiar estado de la orden
PATCH  /api/v1/business/orders/{order_id}/reject      Rechazar orden con motivo
```

Nota: Cada cambio de estado debe disparar la notificacion WebSocket correspondiente al usuario.

---

## 12. Dashboard & Insights del Negocio

**Frontend:** `/screens/admin/dashboard/dashboard.tsx`, `/screens/admin/businessSettings/insights/Businessinsights.tsx`

**Endpoints:**
```
GET  /api/v1/business/dashboard         Resumen del dia: ordenes, ingresos, pendientes, rating
GET  /api/v1/business/insights          Metricas generales por periodo
GET  /api/v1/business/insights/orders   Historico de ordenes con filtros de fecha
GET  /api/v1/business/insights/revenue  Ingresos por dia / semana / mes
```

**Respuesta ejemplo `/dashboard`:**
```json
{
  "orders_today": 12,
  "revenue_today": 1450.00,
  "pending_orders": 3,
  "avg_rating": 4.7,
  "top_items": ["Tacos", "Burrito", "Agua de Jamaica"]
}
```

---

## 13. Perfil de Usuario

**Frontend:** `/screens/profile/Profile.tsx`, `EdithProfile.tsx`

**Endpoints:**
```
GET    /api/v1/users/me           Obtener perfil
PATCH  /api/v1/users/me           Actualizar nombre, telefono
POST   /api/v1/users/me/avatar    Subir foto (multipart a Firebase Storage)
PATCH  /api/v1/users/me/password  Cambiar contraseña via Firebase Auth
DELETE /api/v1/users/me           Eliminar cuenta
```

---

## 14. Direcciones

**Frontend:** `/screens/addresses/addAddress.tsx`, `deliveryAddresses.tsx`
**Subcolección Firestore:** `users/{uid}/addresses`

**Endpoints:**
```
GET    /api/v1/addresses                       Listar direcciones del usuario
POST   /api/v1/addresses                       Agregar { street, city, lat, lng, alias? }
PATCH  /api/v1/addresses/{address_id}          Editar direccion
DELETE /api/v1/addresses/{address_id}          Eliminar direccion
PATCH  /api/v1/addresses/{address_id}/default  Marcar como predeterminada
```

---

## 15. Negocios Favoritos

**Subcolección Firestore:** `users/{uid}/favorites`

**Endpoints:**
```
GET    /api/v1/user/favorites                  Listar negocios favoritos
POST   /api/v1/user/favorites/{business_id}    Agregar a favoritos
DELETE /api/v1/user/favorites/{business_id}    Quitar de favoritos
```

---

## 16. Calificaciones & Reseñas

**Frontend:** Flujo post-entrega disparado desde `paymentSucess.tsx`
**Subcolecciones Firestore:** `orders/{id}/review`, `businesses/{id}/reviews`

**Endpoints:**
```
POST  /api/v1/orders/{order_id}/review  Crear reseña { rating: 1-5, comment?: string }
GET   /api/v1/orders/{order_id}/review  Verificar si ya existe reseña
```

**Lógica:**
- Solo ordenes con estado `delivered` pueden calificarse
- Una reseña por orden (validar duplicado)
- Al crear: recalcular rating promedio del negocio en Firestore
- Al crear: notificar al negocio via WebSocket con tipo `new_review`

---

## 17. Chatbot — Usuario

**Frontend:** `/screens/chatbot/Chatbot.tsx`
**Subcolección Firestore:** `users/{uid}/chat_history`

**Endpoints:**
```
POST   /api/v1/chatbot/message    Enviar mensaje y recibir respuesta de IA
GET    /api/v1/chatbot/history    Historial de conversacion
DELETE /api/v1/chatbot/history    Limpiar historial
```

**Lógica:**
- Integrar con OpenAI GPT o Dialogflow
- Si el usuario pregunta por su pedido: consultar Firestore y responder con estado real
- Temas soportados: seguimiento, pagos, cuenta, ayuda general

---

## 18. Configuración Chatbot — Negocio

**Frontend:** `/screens/admin/chatbot/chatbotConfiguration.tsx`
**Subcolección Firestore:** `businesses/{uid}/chatbot_config`

**Endpoints:**
```
GET    /api/v1/business/chatbot/config  Obtener configuracion actual del chatbot
PATCH  /api/v1/business/chatbot/config  Actualizar respuestas automaticas, horarios, tono
```

---

## 19. Soporte & Ayuda — Usuario

**Frontend:** `/screens/helpSupport/helpSupport.tsx`
**Colección Firestore:** `support_tickets`, `faqs`

**Endpoints:**
```
GET   /api/v1/support/faq                   Listar preguntas frecuentes
POST  /api/v1/support/tickets               Crear ticket { subject, message, category }
GET   /api/v1/support/tickets               Listar tickets del usuario
GET   /api/v1/support/tickets/{ticket_id}   Detalle de un ticket
```

---

## 20. Configuración del Negocio

**Frontend:** `/screens/admin/settingsBusiness/settingsBusiness.tsx`, `/screens/admin/businessSettings/businessSettings.tsx`

**Endpoints:**
```
GET    /api/v1/business/settings          Obtener configuracion actual
PATCH  /api/v1/business/settings          Actualizar nombre, descripcion, categoria, direccion
PATCH  /api/v1/business/settings/hours    Actualizar horarios de atencion
PATCH  /api/v1/business/settings/status   Abrir o cerrar negocio { is_open: bool }
POST   /api/v1/business/settings/logo     Subir logo (multipart a Firebase Storage)
```

---

## 21. Frontend Repartidor — A DESARROLLAR

> Nuevo modulo React Native / Expo. Crear en `/frontend/screens/driver/`

### Pantallas a crear

**Auth:**
- `DriverLogin.tsx` — Login del repartidor
- `DriverSignup.tsx` — Registro con datos del vehiculo (tipo, placa)

**Dashboard:**
- `DriverHome.tsx` — Toggle online/offline, mapa con ubicacion actual, resumen del dia

**Ordenes:**
- `DeliveryRequests.tsx` — Solicitudes de entrega disponibles cerca con mapa
- `ActiveDelivery.tsx` — Entrega en curso: mapa con ruta negocio → cliente, botones de estado
- `DeliveryHistory.tsx` — Historial de entregas completadas

**Perfil:**
- `DriverProfile.tsx` — Datos personales, vehiculo, calificacion promedio
- `DriverEarnings.tsx` — Ganancias por dia / semana

### Funcionalidades clave

- `expo-location` con `watchPositionAsync` enviando ubicacion al backend cada 5 segundos
- Escuchar Firebase Realtime Database para nuevas solicitudes de entrega disponibles
- Recibir notificaciones via WebSocket en `/ws/notifications/{driver_id}`
- Mapa interactivo con ruta: negocio → repartidor → cliente
- Botones de accion en `ActiveDelivery`:
  - "Llegue al negocio"
  - "Recogi el pedido"
  - "Entregue el pedido"

### Flujo completo de entrega

```
Orden llega a estado "ready"
    ↓
WebSocket notifica a repartidores disponibles (new_delivery_request)
    ↓
Repartidor acepta en DeliveryRequests
    ↓
Estado orden cambia a: on_the_way
Driver asignado en orders/{id}/driver_id
    ↓
ActiveDelivery envia ubicacion cada 5s → Realtime DB
Usuario ve tracking en vivo en orderTraking.tsx
    ↓
Repartidor presiona "Entregue el pedido"
    ↓
Estado orden: delivered
Notificacion al usuario: order_delivered
    ↓
Se habilita flujo de reseña para el usuario
```

---

## Estructura sugerida del Backend

```
pidelo-backend/
├── main.py                   # Entry point FastAPI + WebSocket
├── firebase_config.py        # Firebase Admin SDK init
├── requirements.txt
├── .env
└── app/
    ├── routers/
    │   ├── auth.py
    │   ├── feed.py
    │   ├── cart.py
    │   ├── orders.py
    │   ├── checkout.py
    │   ├── payments.py
    │   ├── tracking.py
    │   ├── notifications.py
    │   ├── business/
    │   │   ├── menu.py
    │   │   ├── orders.py
    │   │   ├── dashboard.py
    │   │   ├── settings.py
    │   │   └── chatbot.py
    │   ├── delivery/
    │   │   ├── auth.py
    │   │   └── tracking.py
    │   └── user/
    │       ├── profile.py
    │       ├── addresses.py
    │       ├── favorites.py
    │       └── reviews.py
    ├── models/               # Pydantic schemas
    ├── services/             # Logica de negocio
    ├── websocket/            # Connection manager para WebSocket
    └── middleware/           # Verificacion de Firebase token
```

---

## Dependencias Backend

```
fastapi
uvicorn[standard]
firebase-admin
pydantic
python-dotenv
stripe
httpx
websockets
python-multipart
```

---

*Proyecto: Pidelo · FastAPI + Firebase + WebSocket + Expo*