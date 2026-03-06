<div align="center">

# Kivo — Plataforma de Delivery Inteligente

**Conectando negocios locales con clientes a través de tecnología moderna**

[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Demo](#demo) · [Características](#características) · [Instalación](#instalación) · [Contribuir](#contribuir)

</div>

---

## Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Problema y Solución](#problema-y-solución)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Uso](#uso)
- [Roadmap](#roadmap)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Contacto](#contacto)

---

## Sobre el Proyecto

Kivo es una plataforma integral de delivery construida con React Native, Expo y FastAPI. Ofrece seguimiento de pedidos en tiempo real, un panel administrativo completo para negocios y asistencia al cliente mediante chatbot inteligente.

### Visión

Democratizar el acceso a tecnología de delivery profesional para pequeños y medianos negocios, permitiéndoles competir con plataformas establecidas sin requerir inversión técnica compleja.

### Demo

| Onboarding | Home Feed | Tracking en Vivo |
|:---:|:---:|:---:|
| ![Onboarding](https://via.placeholder.com/250x500?text=Onboarding) | ![Home](https://via.placeholder.com/250x500?text=Home) | ![Tracking](https://via.placeholder.com/250x500?text=Tracking) |

---

## Problema y Solución

| Problema | Impacto | Solución Kivo |
|----------|---------|---------------|
| Gestión desorganizada de pedidos | Pérdida de órdenes y errores frecuentes | Sistema centralizado con confirmación automática |
| Falta de visibilidad para el cliente | Frustración y llamadas constantes al negocio | Tracking GPS en tiempo real con notificaciones push |
| Procesos manuales | Errores humanos y lentitud operativa | Digitalización completa del flujo de pedidos |
| UX deficiente en plataformas actuales | Carritos abandonados y baja conversión | Interfaz optimizada con checkout en tres pasos |
| Barrera tecnológica para negocios pequeños | Exclusión del mercado digital | Onboarding guiado sin conocimientos técnicos |

### Propuesta de Valor

**Para Clientes**
- Descubrimiento de negocios cercanos con filtros avanzados
- Checkout optimizado en menos de un minuto
- Seguimiento de cada etapa del pedido en tiempo real
- Asistencia 24/7 mediante chatbot
- Historial de pedidos con reordenamiento en un tap

**Para Negocios**
- Configuración completa en menos de 15 minutos
- Panel administrativo para productos, precios e inventario
- Analytics en tiempo real: ventas, productos top y horarios pico
- Alertas automáticas de nuevos pedidos
- Reducción de errores mediante automatización del flujo

---

## Características

### Autenticación y Perfiles
- Registro y login con email y contraseña vía Supabase Auth
- JWT con persistencia segura en SecureStore
- Selección de rol al registrarse: Cliente, Negocio o Repartidor
- Perfil editable: nombre, teléfono y avatar
- Recuperación de contraseña

### Experiencia de Cliente

**Feed de Negocios**
- Búsqueda en tiempo real con autocompletado
- Filtros por tipo de comida, precio, rating y distancia
- Vista de mapa interactiva

**Sistema de Pedidos**
- Carrito persistente con sincronización
- Personalización de productos con extras y notas
- Cálculo dinámico de subtotal, costo de envío y propina
- Múltiples métodos de pago (en desarrollo)

**Tracking en Tiempo Real**
- Mapa con ubicación del repartidor en vivo
- Estados: Recibido → Preparando → En camino → Entregado
- Notificaciones push en cada cambio de estado
- ETA dinámico

**Chatbot**
- Respuestas automáticas a preguntas frecuentes
- Consulta de estado de órdenes
- Sugerencias basadas en historial del usuario

### Panel Administrativo

**Dashboard**
- Ventas del día, semana y mes con gráficos
- Productos más vendidos y horarios de mayor demanda
- Rating promedio y reviews recientes

**Gestión de Menú**
- CRUD completo de productos con imágenes
- Categorización personalizada
- Modificadores y variantes (tamaños, extras)
- Control de disponibilidad por horario

**Administración de Órdenes**
- Vista en tiempo real de pedidos activos
- Aceptación y rechazo con tiempos de preparación
- Historial completo exportable

---

## Tecnologías

### Frontend Mobile

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React Native | 0.74+ | Framework principal para desarrollo móvil |
| Expo | SDK 51+ | Toolchain, OTA updates y push notifications |
| TypeScript | 5.3+ | Type safety y mejor developer experience |
| React Navigation | 6.x | Navegación y routing |
| Expo SecureStore | 13.x | Almacenamiento seguro de tokens |
| Supabase JS | 2.x | Cliente de autenticación |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| FastAPI | 0.111+ | API REST principal |
| SQLAlchemy | 2.x | ORM para PostgreSQL |
| Supabase | 2.x | Base de datos, auth y realtime |
| PostgreSQL | 15+ | Base de datos relacional con PostGIS |
| PyJWT | 2.x | Validación de tokens JWT |
| Pydantic | 2.x | Validación de datos y schemas |

### Infraestructura

```
Supabase        — Base de datos, autenticación y WebSockets
PostGIS         — Consultas geoespaciales para tracking
EAS Build       — Compilación de binarios nativos
GitHub Actions  — CI/CD automatizado
```

---

## Arquitectura

### Diagrama del Sistema

```
Cliente Expo (iOS / Android)
        |
        | REST  —  Authorization: Bearer <JWT>
        v
   FastAPI  /api/v1/...
        |
        | SQLAlchemy
        v
   Supabase PostgreSQL
        |
   Supabase Auth ——— JWT Secret ———> FastAPI (validación de tokens)
        |
   Supabase Realtime (pedidos en vivo, tracking GPS)
```

### Arquitectura Frontend — Hexagonal (Ports & Adapters)

El frontend separa la lógica de negocio de las implementaciones concretas. El dominio no importa nada de React Native ni librerías externas.

```
domain/
  entities/          — Tipos puros de TypeScript (User, Order...)
  ports/             — Interfaces (IAuthRepository, IProfileRepository)
  usecases/          — Lógica de negocio pura

infrastructure/
  repositories/      — Implementaciones concretas (Supabase, FastAPI)

application/
  context/           — React Contexts para inyección de dependencias
  hooks/             — Custom hooks (useAuth, useProfile, useOrders)

ui/
  screens/           — Pantallas (solo renderizan, delegan lógica al hook)
  components/        — Componentes reutilizables
  navigation/        — Stack y Tab navigators
```

---

## Estructura del Proyecto

```
Kivo/
├── supabase/
│   ├── backend/                    — API FastAPI
│   │   ├── core/
│   │   │   ├── config.py           — Variables de entorno
│   │   │   └── dependencies.py     — Middleware JWT
│   │   ├── db/
│   │   │   └── database.py         — Conexión SQLAlchemy
│   │   ├── models/                 — Modelos ORM
│   │   ├── schemas/                — Schemas Pydantic
│   │   ├── services/               — Lógica de negocio
│   │   ├── routes/                 — Endpoints HTTP
│   │   ├── exceptions/             — Manejadores de error
│   │   └── main.py
│   │
│   └── frontend/                   — App React Native / Expo
│       ├── domain/
│       │   ├── entities/
│       │   └── ports/repositories/
│       ├── infrastructure/
│       │   └── repositories/
│       ├── application/
│       │   ├── context/            — AuthContext
│       │   └── hooks/
│       ├── config/
│       │   └── supabaseConfig.ts
│       ├── navigation/
│       ├── screens/
│       │   ├── auth/               — Login, Signup
│       │   ├── profile/            — Profile, EditProfile
│       │   ├── homeFeed/
│       │   ├── orders/
│       │   └── admin/              — Dashboard, MenuEditor
│       └── types/
│
├── App.js
├── app.json
├── package.json
├── tsconfig.json
└── .env
```

---

## Instalación

### Prerrequisitos

- Node.js >= 18.x
- Python >= 3.10
- Expo CLI: `npm install -g expo-cli`
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio

```bash
git clone https://github.com/alextafale/Kivo.git
cd Kivo
```

### 2. Instalar dependencias del frontend

```bash
npm install
```

### 3. Instalar dependencias del backend

```bash
cd supabase/backend
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crea `.env` en la raíz del proyecto:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
API_URL=http://192.168.x.x:8000
```

Crea `.env` en `supabase/backend/`:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_HOST=db.xxxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=postgres
SUPABASE_JWT_SECRET=tu_jwt_secret
```

> El JWT Secret se encuentra en Supabase → Settings → API → JWT Settings.

### 5. Configurar la base de datos

Ejecuta el schema en Supabase → SQL Editor. El archivo se encuentra en `supabase/schema.sql`.

### 6. Ejecutar el backend

```bash
cd supabase/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Ejecutar el frontend

```bash
npx expo start --clear
```

---

## Uso

### Credenciales de Prueba

**Cliente**
```
Email:    cliente@test.com
Password: Test123!
```

**Negocio**
```
Email:    negocio@test.com
Password: Test123!
```

### Flujo de Cliente

1. Registro o login → selecciona "Soy un Cliente"
2. Explora negocios en el Home Feed
3. Selecciona productos y personaliza tu pedido
4. Confirma dirección y método de pago
5. Sigue el estado en tiempo real
6. Califica la experiencia al recibir tu orden

### Flujo de Negocio

1. Registro o login → selecciona "Tengo un Negocio"
2. Configura perfil: logo, descripción y horarios
3. Crea tu menú con fotos, precios y categorías
4. Recibe notificaciones de nuevos pedidos
5. Acepta, prepara y actualiza estados de órdenes
6. Revisa métricas en el dashboard

---

## Roadmap

### Fase 1 — MVP (Completado)
- [x] Autenticación con Supabase Auth
- [x] Perfil de usuario con `GET /me` y `PATCH /me`
- [x] Navegación base y estructura del proyecto
- [x] Pantallas principales: Home, Orders, Profile
- [x] Panel administrativo base

### Fase 2 — Core Features (En Desarrollo)
- [ ] Sistema de pedidos end-to-end
- [ ] Tracking GPS en tiempo real
- [ ] WebSockets para actualizaciones en vivo
- [ ] Carrito persistente con sincronización
- [ ] Notificaciones push

### Fase 3 — Features Avanzados (Q2 2025)
- [ ] Integración de pagos (Stripe / MercadoPago)
- [ ] Chat en tiempo real cliente-repartidor
- [ ] Sistema de calificaciones y reviews
- [ ] Cupones y programa de puntos
- [ ] Recomendaciones personalizadas

### Fase 4 — Escalabilidad (Q3 2025)
- [ ] CDN para imágenes
- [ ] Cache con Redis
- [ ] Analytics detallado para negocios
- [ ] Panel de super-admin
- [ ] API pública para integraciones externas

---

## Contribuir

Las contribuciones son bienvenidas. Para contribuir:

1. Haz fork del proyecto
2. Crea una rama para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. Realiza tus cambios y haz commit:
   ```bash
   git commit -m 'feat: descripción del cambio'
   ```
4. Push a la rama y abre un Pull Request

### Guía de Estilo

- TypeScript en todos los archivos nuevos
- Sigue las convenciones de ESLint y Prettier del proyecto
- Código en inglés, comentarios en español
- Commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/)

### Reportar Bugs

Usa [GitHub Issues](https://github.com/alextafale/Kivo/issues) con la siguiente información:

```markdown
**Descripción**
Descripción clara del problema.

**Pasos para reproducir**
1. Ir a '...'
2. Hacer tap en '...'
3. Ver el error

**Comportamiento esperado**
Lo que debería ocurrir.

**Entorno**
- Dispositivo: iPhone 14
- OS: iOS 17.1
- Versión: 1.0.0
```

---

## Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

## Contacto

**Alex Tafale**

- GitHub: [@alextafale](https://github.com/alextafale)
- Email: alex
- LinkedIn: [linkedin.com/in/alextafale](https://linkedin.com/in/alextafale)

Repositorio: [https://github.com/alextafale/Kivo](https://github.com/alextafale/Kivo)

---

<div align="center">

Si este proyecto te resulta útil, considera darle una estrella en GitHub.

Made with dedication by [Alex Tafale](https://github.com/alextafale)

</div>