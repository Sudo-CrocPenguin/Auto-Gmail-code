# Auto-Gmail-code Frontend Web

## Que es

Auto-Gmail-code Frontend Web es la consola web del producto. Esta construida con React, TypeScript y Vite para consumir la API HTTP del backend existente. La primera version incluye login, dashboard, cuentas Gmail, bandeja de correos, alertas, reglas automaticas y settings del workspace.

El estilo visual usa una direccion cyberpunk, Tron y gamer: fondo oscuro, grilla neon, acentos cyan, magenta, verde acido y componentes compactos para lectura operativa.

## Para que sirve

Sirve para validar y operar desde navegador las capacidades ya disponibles en el backend:

- Autenticacion con JWT propio del backend.
- Carga de resumen analytics del workspace.
- Consulta de cuentas Gmail conectadas.
- Inicio de OAuth Gmail desde `POST /api/gmail/oauth/start`.
- Sincronizacion manual de cuentas Gmail.
- Lectura de correos recientes, alertas abiertas, reglas y settings.

## Como funciona

El frontend no contiene reglas de negocio del backend. La UI llama casos de uso del lado cliente, esos casos usan repositorios HTTP y los repositorios consumen endpoints REST.

Flujo principal:

1. El usuario entra con email y password.
2. `LoginUserUseCase` llama `POST /api/auth/login`.
3. El token se guarda en `localStorage` con `BrowserTokenStorage`.
4. `HttpClient` agrega `Authorization: Bearer <token>` en rutas privadas.
5. `WorkspaceOverviewService` carga en paralelo analytics, Gmail, emails, alertas, reglas y settings.
6. Los paneles renderizan datos ya normalizados por modulo.

Base API por defecto:

```txt
http://localhost:4000/api
```

Puedes cambiarla con:

```txt
VITE_API_BASE_URL=http://localhost:4001/api
```

## Arquitectura

La estructura sigue una separacion modular inspirada en DDD y Clean Architecture:

```txt
src/
  app/
    application/       # composicion de servicios de aplicacion
    presentation/      # shell visual y navegacion principal
  features/
    auth/
    gmail/
    emails/
    alerts/
    analytics/
    rules/
    settings/
  shared/
    domain/            # contratos reutilizables
    infrastructure/    # HTTP, config y storage
    presentation/      # componentes reutilizables
```

Cada feature separa:

- `domain`: entidades y tipos del modulo.
- `application`: contratos o casos de uso.
- `infrastructure`: repositorios concretos que llaman la API.
- `presentation`: componentes React del modulo.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Backend levantado en `http://localhost:4000/api` o variable `VITE_API_BASE_URL` ajustada.

## Instalacion

Desde `frontend/`:

```bash
npm install
cp .env.example .env
```

## Ejecucion local

Desde `frontend/`:

```bash
npm run dev -- --host 0.0.0.0
```

URL habitual:

```txt
http://localhost:5173
```

Usuario demo si el backend esta en memoria:

```txt
email: owner@autogmail.local
password: Password123!
```

## Scripts

```bash
npm run dev      # servidor Vite con HMR
npm run build    # TypeScript + build productivo
npm run lint     # ESLint del frontend
npm run preview  # previsualiza dist/
```

## Contratos actuales

El frontend consume estos endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/gmail/accounts`
- `POST /api/gmail/oauth/start`
- `POST /api/gmail/accounts/:id/sync`
- `GET /api/emails`
- `GET /api/alerts`
- `GET /api/rules`
- `GET /api/settings`
- `GET /api/analytics/summary`
- `GET /api/analytics/categories`
- `GET /api/analytics/emails-by-day`
- `GET /api/analytics/top-senders`

## Validacion

Antes de entregar cambios del frontend:

```bash
npm run build
npm run lint
```
