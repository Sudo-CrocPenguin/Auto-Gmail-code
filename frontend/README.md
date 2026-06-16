# Auto-Gmail-code Frontend Web

## Que es

Auto-Gmail-code Frontend Web es la consola web del producto. Esta construida con React, TypeScript y Vite para consumir la API HTTP del backend existente. La primera version incluye login, dashboard, cuentas Gmail, bandeja de correos, alertas, reglas automaticas y settings del workspace.

El estilo visual usa una direccion cyberpunk, Tron y gamer: fondo oscuro, grilla neon, acentos cyan, magenta, verde acido y componentes compactos para lectura operativa.

## Para que sirve

Sirve para validar y operar desde navegador las capacidades ya disponibles en el backend:

- Autenticacion con JWT propio del backend.
- Registro de usuario propietario y workspace desde `POST /api/auth/register`.
- Gestion de una cuenta interna Auto-Gmail con varias cuentas Gmail registradas dentro.
- Carga de resumen analytics del workspace.
- Consulta de cuentas Gmail conectadas.
- Inicio de OAuth Gmail desde `POST /api/gmail/oauth/start`.
- Sincronizacion manual de cuentas Gmail.
- Lectura filtrada de correos recientes con detalle, scores y adjuntos.
- Acciones de correo: marcar revisado y marcar importante.
- Gestion de alertas abiertas: resolver o ignorar.
- Creacion rapida y activacion/pausa de reglas automaticas.
- Lectura de settings del workspace: tema, idioma, notificaciones, clasificacion y retencion.

## Como funciona

El frontend no contiene reglas de negocio del backend. La UI llama casos de uso del lado cliente, esos casos usan repositorios HTTP y los repositorios consumen endpoints REST.

Flujo principal de autenticacion:

1. El usuario puede crear cuenta con nombre, email, password, workspace y aceptacion de terminos.
2. `RegisterUserUseCase` llama `POST /api/auth/register` y recibe `accessToken`.
3. El usuario tambien puede entrar con `LoginUserUseCase`, que llama `POST /api/auth/login`.
4. El token se guarda en `localStorage` con `BrowserTokenStorage`.
5. `HttpClient` agrega `Authorization: Bearer <token>` en rutas privadas.
6. `WorkspaceOverviewService` carga en paralelo analytics, Gmail, emails, alertas, reglas y settings.
7. Los repositorios normalizan respuestas del backend cuando la API entrega objetos anidados, por ejemplo `classification` en correos o `emailAddress` en cuentas Gmail.
8. Los paneles renderizan datos ya normalizados por modulo.
9. Las acciones operativas vuelven a pasar por `App`, ejecutan el repositorio correspondiente y refrescan el overview.

Base API por defecto:

```txt
http://localhost:4000/api
```

El backend debe permitir el origen del front con:

```txt
FRONTEND_URL=http://localhost:5173
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

## Flujos operativos actuales

### Registro y cuenta propia

El formulario inicial tiene modo `Entrar` y `Crear cuenta`. En `Crear cuenta`, el frontend envia `name`, `email`, `password`, `workspaceName` y `acceptTerms` a `POST /api/auth/register`. Si el backend responde correctamente, la sesion queda activa, el JWT se guarda localmente y la consola abre el modulo Gmail.

Esa cuenta interna de Auto-Gmail es el contenedor de trabajo. Dentro de ella puedes registrar una o muchas cuentas Gmail reales, todas asociadas al mismo workspace del usuario autenticado.

### Gmail real

El modulo `gmail` llama `POST /api/gmail/oauth/start`. Si el backend tiene `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, abre la URL real de Google. Google vuelve al backend en `/api/gmail/oauth/callback` y el backend redirige al frontend con `/gmail-accounts?oauth=success&email=...&synced=...`.

Si faltan credenciales Google, el frontend no abre el flujo demo: muestra un aviso para evitar confundir datos reales con simulacion.

El boton cambia entre `Registrar primer Gmail` y `Registrar otro Gmail`. Puedes repetir el OAuth por cada cuenta Gmail que quieras conectar. La lista muestra cantidad de cuentas, conectadas y correos indexados.

### Inbox

El modulo `emails` permite buscar por texto, filtrar por cuenta Gmail, categoria, riesgo minimo, no leidos, importantes o accion requerida. Al seleccionar un correo, el frontend llama `GET /api/emails/:id` y muestra remitente, cuenta, destinatarios, cuerpo de texto, adjuntos, etiquetas Gmail, categorias secundarias, scores de clasificacion e historial de acciones. Las acciones `POST /api/emails/:id/mark-reviewed` y `POST /api/emails/:id/mark-important` actualizan el backend y luego refrescan la consola.

### Alertas

El modulo `alerts` lista alertas `NEW` y permite resolverlas o ignorarlas. Cada accion llama al endpoint especifico del backend y vuelve a cargar el overview para retirar la alerta cerrada del panel.

### Reglas

El modulo `rules` ofrece un formulario de creacion rapida. La UI construye una regla con una condicion, una accion, prioridad y estado inicial. Tambien permite pausar o activar reglas existentes con `POST /api/rules/:id/disable` y `POST /api/rules/:id/enable`.

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

Puedes crear una cuenta real desde la pantalla inicial. Si quieres usar el seed local en memoria, el usuario demo es:

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

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/gmail/accounts`
- `POST /api/gmail/oauth/start`
- `POST /api/gmail/accounts/:id/sync`
- `GET /api/emails`
- `GET /api/emails/:id`
- `POST /api/emails/:id/mark-reviewed`
- `POST /api/emails/:id/mark-important`
- `GET /api/alerts`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/ignore`
- `GET /api/rules`
- `POST /api/rules`
- `POST /api/rules/:id/enable`
- `POST /api/rules/:id/disable`
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
