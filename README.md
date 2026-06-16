# Auto-Gmail-code Backend

Auto-Gmail-code Backend es la API HTTP para administrar una o mas cuentas Gmail desde una aplicacion propia. El usuario conecta Gmail con OAuth de Google, nunca con contrasena Gmail. El backend guarda tokens cifrados, sincroniza correos, clasifica mensajes, genera alertas, gestiona remitentes, aplica reglas automaticas y deja auditoria de acciones sensibles.

Esta version es `autoGmail-code 1.0 only back`: backend listo para que el frontend web, movil o escritorio consuma contratos estables.

## Que usa

- Runtime: Node.js 20+.
- Package manager: npm 10+.
- Lenguaje: TypeScript.
- HTTP: Express.
- Validacion: Zod.
- Auth propia: JWT Bearer con sesiones revocables.
- OAuth externo: Google OAuth + Gmail API.
- Persistencia real: PostgreSQL con Prisma.
- Persistencia rapida: memoria con seed demo para desarrollo/tests.
- Seguridad HTTP: Helmet, CORS, rate limiting, request id y logs JSON.
- Tests: Vitest + Supertest.
- Infra local: Docker Compose con PostgreSQL.

## Que hace

- Registro, login, logout real y cambio de password.
- Sesiones persistidas en `app_sessions`; un JWT revocado deja de funcionar.
- Workspaces y settings.
- Inicio OAuth Gmail, callback, reconnect y disconnect.
- `state` OAuth firmado, expirado y consumido una sola vez.
- Tokens Gmail cifrados con AES-256-GCM.
- Sincronizacion Gmail reciente e incremental con `historyId`.
- Logs de sync por cuenta en `gmail_sync_logs`.
- Bandeja unificada con filtros y busqueda desde PostgreSQL.
- Detalle de correo con HTML sanitizado y texto plano.
- Descarga de adjuntos bajo demanda desde Gmail.
- Alertas, remitentes, reglas automaticas, analitica y auditoria.
- OpenAPI en `/api/openapi.json`.

## Como se comunica

El frontend se comunica por HTTP JSON.

Base URL local habitual:

```txt
http://localhost:4000/api
```

Si el puerto `4000` esta ocupado, puedes levantarlo en otro puerto, por ejemplo:

```txt
http://localhost:4001/api
```

Autenticacion:

```txt
Authorization: Bearer <accessToken>
```

Flujo general:

1. Front hace login o registro.
2. Backend devuelve `accessToken`, `user` y `workspace`.
3. Front guarda el token y lo envia en rutas privadas.
4. Front llama `POST /api/gmail/oauth/start`.
5. Backend devuelve `data.authUrl`.
6. Front abre `authUrl` en el navegador.
7. Google vuelve a `GET /api/gmail/oauth/callback`.
8. Backend guarda tokens cifrados, sincroniza correos y redirige al frontend.
9. Front consume `/api/gmail/accounts`, `/api/emails`, `/api/alerts`, `/api/analytics/*`, etc.

## Arquitectura

La API esta organizada por features:

```txt
src/
  features/
    auth/
    users/
    workspace/
    gmail-accounts/
    emails/
    alerts/
    senders/
    rules/
    analytics/
    audit/
    settings/
  shared/
    application/
    config/
    domain/
    http/
    infrastructure/
```

Cada feature separa:

- `domain`: entidades y contratos.
- `application`: casos de uso y reglas de negocio.
- `presentation/http`: rutas, controladores y DTOs.
- `shared/infrastructure`: Prisma, memoria, JWT, cifrado, logger y middleware.

Los controladores validan entrada con Zod y llaman casos de uso. Los casos de uso dependen de interfaces de repositorio, no de Express ni de una base de datos concreta.

## Requisitos

Obligatorios:

- Node.js 20 o superior.
- npm 10 o superior.
- Git.

Para modo completo:

- Docker y Docker Compose, o PostgreSQL 16+ instalado.
- Base de datos PostgreSQL.

Para Gmail real:

- Proyecto Google Cloud.
- Gmail API habilitada.
- OAuth consent screen configurado.
- OAuth Client tipo Web Application.
- Redirect URI autorizado.

## Instalacion inicial

Desde la raiz del proyecto:

```bash
npm install
cp .env.example .env
npm run db:generate
```

`npm run db:generate` genera Prisma Client. Ejecutalo despues de instalar dependencias y cada vez que cambie `prisma/schema.prisma`.

## Variables de entorno

Ejemplo base:

```txt
NODE_ENV=development
PORT=4000
API_PREFIX=/api
FRONTEND_URL=http://localhost:3000
PERSISTENCE_DRIVER=memory
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public
JWT_SECRET=change-me-in-local-env
JWT_EXPIRES_IN=1d
TOKEN_ENCRYPTION_KEY=change-me-token-encryption-key
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_GMAIL_WINDOW_MS=60000
RATE_LIMIT_GMAIL_MAX=120
RATE_LIMIT_SYNC_WINDOW_MS=300000
RATE_LIMIT_SYNC_MAX=5
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/gmail/oauth/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify
GMAIL_SYNC_MAX_MESSAGES=25
GMAIL_ATTACHMENT_MAX_BYTES=5242880
```

Reglas:

- No subir `.env`.
- Cambiar `JWT_SECRET` en cualquier ambiente que no sea demo local.
- Cambiar `TOKEN_ENCRYPTION_KEY` antes de conectar Gmail real.
- En `production`, `JWT_SECRET` y `TOKEN_ENCRYPTION_KEY` deben ser secretos reales de 32+ caracteres.
- En `production`, `PERSISTENCE_DRIVER=prisma`, `DATABASE_URL`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son obligatorios.

## Scripts

```bash
npm run dev              # servidor en modo watch
npm run build            # compila TypeScript en dist/
npm start                # ejecuta dist/main.js
npm test                 # tests HTTP/memoria y unitarios
npm run test:prisma      # tests repositorios + HTTP contra PostgreSQL real
npm run check            # build + tests base
npm run db:generate      # genera Prisma Client
npm run db:migrate       # migraciones en desarrollo
npm run db:deploy        # migraciones en produccion/staging
npm run db:seed          # crea usuario demo en PostgreSQL
npm run tokens:reencrypt # re-cifra tokens Gmail al rotar TOKEN_ENCRYPTION_KEY
```

## Ejecutar rapido en memoria

Este modo no necesita PostgreSQL y sirve para probar la API con datos demo.

En `.env`:

```txt
PERSISTENCE_DRIVER=memory
PORT=4000
```

Ejecuta:

```bash
npm run dev
```

URLs:

```txt
API: http://localhost:4000
Health: http://localhost:4000/api/health
Readiness: http://localhost:4000/api/health/ready
OpenAPI: http://localhost:4000/api/openapi.json
```

Usuario demo:

```txt
email: owner@autogmail.local
password: Password123!
```

Limitaciones:

- Los datos se pierden al reiniciar.
- Las cuentas Gmail reales no persisten.
- El flujo Gmail puede operar en modo demo si faltan credenciales Google.

## Ejecutar completo con PostgreSQL local

Levanta PostgreSQL:

```bash
docker compose up -d postgres
```

Aplica migraciones:

```bash
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run db:deploy
```

Crea usuario demo:

```bash
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run db:seed
```

Arranca backend con Prisma:

```bash
env NODE_ENV=development \
  PORT=4000 \
  API_PREFIX=/api \
  FRONTEND_URL=http://localhost:3000 \
  PERSISTENCE_DRIVER=prisma \
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public \
  JWT_SECRET=local-development-jwt-secret-with-enough-length \
  TOKEN_ENCRYPTION_KEY=local-development-token-key-with-enough-length \
  npm run dev
```

Si `4000` esta ocupado:

```bash
PORT=4001 npm run dev
```

## Ejecutar con Docker Compose

Para entorno local/staging completo:

```bash
docker compose up --build
```

El Compose usa `NODE_ENV=development` por defecto. Para produccion define variables reales en el ambiente antes de arrancar.

Comandos utiles:

```bash
docker compose exec api npm run db:deploy
docker compose exec api npm run db:seed
docker compose logs -f api
```

## Conectar Gmail real

1. En Google Cloud, habilita Gmail API.
2. Configura OAuth consent screen.
3. Crea un OAuth Client tipo Web Application.
4. Agrega redirect URI autorizado.

Local con puerto 4000:

```txt
http://localhost:4000/api/gmail/oauth/callback
```

Local con puerto 4001:

```txt
http://localhost:4001/api/gmail/oauth/callback
```

5. Arranca el backend con credenciales:

```bash
env NODE_ENV=development \
  PORT=4001 \
  API_PREFIX=/api \
  FRONTEND_URL=http://localhost:3000 \
  PERSISTENCE_DRIVER=prisma \
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public \
  JWT_SECRET=local-development-jwt-secret-with-enough-length \
  TOKEN_ENCRYPTION_KEY=local-development-token-key-with-enough-length \
  GOOGLE_CLIENT_ID=<oauth-client-id> \
  GOOGLE_CLIENT_SECRET=<oauth-client-secret> \
  GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4001/api/gmail/oauth/callback \
  npm run dev
```

6. Inicia sesion:

```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@autogmail.local","password":"Password123!"}'
```

7. Inicia OAuth:

```bash
curl -X POST http://localhost:4001/api/gmail/oauth/start \
  -H "Authorization: Bearer <accessToken>"
```

8. Abre `data.authUrl`.
9. Acepta permisos Gmail.
10. Google vuelve al callback.
11. El backend consume `state`, intercambia `code`, guarda tokens cifrados, crea/actualiza cuenta Gmail y sincroniza mensajes recientes.
12. Consulta correos:

```bash
curl "http://localhost:4001/api/emails?limit=25" \
  -H "Authorization: Bearer <accessToken>"
```

## Flujo recomendado para frontend

1. Login/register con `/api/auth/login` y `/api/auth/register`.
2. Guardar `accessToken`.
3. Enviar `Authorization: Bearer <accessToken>` en rutas privadas.
4. Cargar sesion con `/api/auth/me`.
5. Dashboard inicial:
   - `/api/gmail/accounts`
   - `/api/emails`
   - `/api/alerts`
   - `/api/analytics/summary`
6. Boton "Conectar Gmail":
   - `POST /api/gmail/oauth/start`
   - abrir `data.authUrl`.
7. Pantalla resultado OAuth:
   - leer query params `oauth`, `gmailAccountId`, `email`, `synced`.
8. Bandeja:
   - `GET /api/emails`
   - `GET /api/emails/:id`
9. Acciones:
   - corregir clasificacion,
   - marcar revisado,
   - marcar importante,
   - resolver/ignorar alertas,
   - crear reglas,
   - confiar/sospechar remitentes.

## Endpoints principales

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `PATCH /api/auth/password`
- `GET /api/auth/me`

Usuario/workspace:

- `PATCH /api/users/me`
- `GET /api/workspaces/current`
- `PATCH /api/workspaces/current`
- `GET /api/settings`
- `PATCH /api/settings`

Gmail:

- `GET /api/gmail/accounts`
- `POST /api/gmail/oauth/start`
- `GET /api/gmail/oauth/status`
- `GET /api/gmail/oauth/callback`
- `POST /api/gmail/accounts/:id/sync`
- `GET /api/gmail/accounts/:id/sync-logs`
- `GET /api/gmail/accounts/:id/sync-logs/:logId`
- `POST /api/gmail/accounts/:id/reconnect`
- `DELETE /api/gmail/accounts/:id`

Correos:

- `GET /api/emails`
- `GET /api/emails/:id`
- `GET /api/emails/:id/attachments/:attachmentId`
- `PATCH /api/emails/:id/classification`
- `POST /api/emails/:id/mark-reviewed`
- `POST /api/emails/:id/mark-important`

Operativo:

- `GET /api/alerts`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/ignore`
- `GET /api/senders`
- `POST /api/senders/:id/trust`
- `POST /api/senders/:id/suspicious`
- `GET /api/rules`
- `POST /api/rules`
- `PATCH /api/rules/:id`
- `DELETE /api/rules/:id`
- `GET /api/analytics/summary`
- `GET /api/audit`
- `GET /api/openapi.json`

Mas detalle en [docs/api.md](docs/api.md).

## Validar el proyecto

Validacion base:

```bash
npm run check
```

Validacion Prisma con PostgreSQL:

```bash
docker compose up -d postgres
docker compose exec -T postgres createdb -U postgres auto_gmail_code_test
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run db:deploy
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public \
  PRISMA_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public \
  npm run test:prisma
```

Si la base ya existe, `createdb` puede fallar con "already exists"; continua con `db:deploy`.

## Despliegue de produccion

Requisitos minimos:

```txt
NODE_ENV=production
PERSISTENCE_DRIVER=prisma
DATABASE_URL=postgresql://...
JWT_SECRET=<secreto-real-32+>
TOKEN_ENCRYPTION_KEY=<secreto-real-32+>
FRONTEND_URL=https://<frontend-host>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=https://<api-host>/api/gmail/oauth/callback
```

Build y arranque:

```bash
npm ci
npm run db:generate
npm run build
npm run db:deploy
npm start
```

Healthchecks:

```txt
GET /api/health
GET /api/health/ready
```

## Seguridad aplicada

- Gmail solo se conecta por OAuth.
- La API no acepta ni solicita contrasenas Gmail.
- Los tokens Gmail se cifran en backend y no se devuelven al frontend.
- Logout revoca la sesion activa.
- El `state` OAuth Gmail se firma, expira y se consume una sola vez.
- Los cuerpos HTML de correos se sanitizan antes de responder.
- Adjuntos se descargan bajo demanda y se validan por tamano/tipo.
- Logs HTTP redactan query params sensibles como `code`, `state` y tokens.
- Produccion no arranca sin secretos fuertes, Prisma y credenciales OAuth Google.

## Rotar TOKEN_ENCRYPTION_KEY

Antes de rotar, haz backup de PostgreSQL.

```bash
OLD_TOKEN_ENCRYPTION_KEY=<clave-anterior> \
TOKEN_ENCRYPTION_KEY=<clave-nueva> \
DATABASE_URL=<postgres-url> \
npm run tokens:reencrypt
```

Luego reinicia el backend usando la clave nueva.

## Documentacion adicional

- [Ejecucion detallada](README.execution.md)
- [Arquitectura](docs/architecture.md)
- [API](docs/api.md)
- [Base de datos](docs/database.md)
- [Seguridad](docs/security.md)
- [Google Cloud OAuth](docs/google-oauth.md)
- [Runbook de errores Gmail](docs/gmail-errors-runbook.md)
- [Rotacion de secretos](docs/secrets-rotation.md)
- [Despliegue](docs/deployment.md)
- [Estado y handoff](todo.md)
