# Estado Backend Auto-Gmail-code

Ultima actualizacion: 2026-06-16.

## Pendientes abiertos

No hay pendientes abiertos para la primera version backend dentro del alcance actual.

## Contexto del producto

Auto-Gmail-code es un backend para administrar una o mas cuentas Gmail desde una API propia. El usuario no entrega contrasena Gmail: conecta sus cuentas con OAuth de Google, el backend guarda los tokens cifrados, sincroniza correos, clasifica mensajes, genera alertas, gestiona remitentes, aplica reglas automaticas y deja auditoria de acciones sensibles.

El frontend debe tratar al backend como fuente de verdad para:

- autenticacion y sesion propia,
- cuentas Gmail conectadas,
- bandeja unificada,
- detalle de correos y adjuntos,
- alertas operativas,
- remitentes,
- reglas automaticas,
- analitica,
- auditoria,
- settings del workspace.

## Que queda listo para v1

- Auth con registro, login, `GET /api/auth/me`, logout con revocacion real de sesion y cambio de password.
- Sesiones persistidas en `app_sessions`; cada JWT incluye `sessionId` y el middleware rechaza sesiones revocadas o expiradas.
- Workspace, perfil de usuario y settings persistidos.
- OAuth Gmail con `state` firmado, expiracion de 10 minutos y consumo unico en `gmail_oauth_states`.
- Produccion bloqueada si faltan `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, secretos fuertes o `PERSISTENCE_DRIVER=prisma`.
- Tokens Gmail cifrados en `gmail_oauth_tokens`.
- Script `npm run tokens:reencrypt` para rotar `TOKEN_ENCRYPTION_KEY` con `OLD_TOKEN_ENCRYPTION_KEY`.
- Sync Gmail reciente e incremental con `historyId`, paginacion Gmail y logs en `gmail_sync_logs`.
- Manejo de tokens revocados: cuenta en `RECONNECT_REQUIRED`, alerta operativa y borrado de credenciales locales.
- Sync manual sin credenciales reales en Prisma devuelve `GMAIL_RECONNECT_REQUIRED`; el modo demo queda limitado a memoria.
- Bandeja unificada, detalle de correo, filtros, ordenamientos por scores y busqueda ejecutados desde PostgreSQL para campos productivos.
- Clasificacion desnormalizada en columnas `classification*` para evitar filtrar bandejas grandes en memoria.
- Alertas, remitentes, reglas automaticas, analitica, auditoria y settings.
- Adjuntos bajo demanda desde Gmail con limite de tamano y bloqueo basico de tipos ejecutables.
- Logs HTTP con redaccion de query params sensibles como `code`, `state` y tokens.
- OpenAPI disponible en `/api/openapi.json`.
- Dockerfile, Docker Compose local/staging y CI con PostgreSQL.

## Como funciona la logica backend

### Auth y sesiones

- `POST /api/auth/register` crea usuario propietario y workspace.
- `POST /api/auth/login` valida email/password y devuelve `accessToken`.
- Cada JWT contiene `sessionId`, `userId`, `workspaceId` y `role`.
- El middleware de auth valida firma JWT y comprueba `app_sessions` para rechazar sesiones revocadas o expiradas.
- `POST /api/auth/logout` revoca la sesion activa.
- `PATCH /api/auth/password` cambia password y revoca otras sesiones activas del usuario.

### Gmail OAuth

- `POST /api/gmail/oauth/start` genera un `state` firmado y persistido en `gmail_oauth_states`.
- El front abre `data.authUrl`.
- Google vuelve a `GET /api/gmail/oauth/callback`.
- El callback verifica firma, consume el `state` una sola vez, intercambia `code`, obtiene perfil Gmail, crea/actualiza cuenta y guarda tokens cifrados.
- Si faltan credenciales Google en desarrollo, existe flujo demo. En `production`, el backend no arranca sin `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

### Sincronizacion Gmail

- `POST /api/gmail/accounts/:id/sync` ejecuta sync manual.
- Usa Gmail API real si hay tokens OAuth guardados.
- Usa `historyId` para sync incremental cuando existe.
- Si Gmail invalida tokens, la cuenta pasa a `RECONNECT_REQUIRED`, se eliminan credenciales locales y se registra alerta/log.
- Cada sync genera registro en `gmail_sync_logs`.

### Correos

- `GET /api/emails` lista bandeja unificada con filtros por cuenta, remitente, dominio, categoria, adjuntos, lectura, importancia, spam, accion requerida, fechas y scores.
- `GET /api/emails/:id` entrega detalle con HTML sanitizado y texto plano.
- `PATCH /api/emails/:id/classification` corrige clasificacion manualmente.
- `POST /api/emails/:id/mark-reviewed` marca revisado.
- `POST /api/emails/:id/mark-important` marca importante.
- `GET /api/emails/:id/attachments/:attachmentId` descarga adjunto bajo demanda desde Gmail.

### Reglas, alertas y remitentes

- Las reglas se administran en `/api/rules`.
- El motor de reglas se aplica durante sync a correos nuevos.
- Las reglas pueden asignar categoria, marcar importante, marcar revisar, ignorar spam, aplicar etiqueta interna o generar alerta.
- Alertas se consultan y resuelven en `/api/alerts`.
- Remitentes se consultan y marcan confiables/sospechosos en `/api/senders`.

### Analitica, auditoria y settings

- `/api/analytics/*` entrega resumen, categorias, top remitentes, emails por dia y cuentas.
- `/api/audit` lista acciones sensibles.
- `/api/settings` lee/actualiza preferencias del workspace.

## Como ejecutarlo

### Modo rapido en memoria

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

URL por defecto:

```txt
http://localhost:4000
```

### Modo Prisma local

```bash
docker compose up -d postgres
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run db:deploy
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run db:seed
env NODE_ENV=development \
  PORT=4001 \
  API_PREFIX=/api \
  FRONTEND_URL=http://localhost:3000 \
  PERSISTENCE_DRIVER=prisma \
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public \
  JWT_SECRET=local-development-jwt-secret-with-enough-length \
  TOKEN_ENCRYPTION_KEY=local-development-token-key-with-enough-length \
  npm run dev
```

URLs utiles si se usa puerto 4001:

```txt
API: http://localhost:4001
Health: http://localhost:4001/api/health
Readiness: http://localhost:4001/api/health/ready
OpenAPI: http://localhost:4001/api/openapi.json
```

Usuario seed local:

```txt
email: owner@autogmail.local
password: Password123!
```

### Gmail real

Configurar Google Cloud:

- Habilitar Gmail API.
- Configurar OAuth consent screen.
- Crear OAuth Client tipo Web Application.
- Registrar redirect URI exacto, por ejemplo `http://localhost:4001/api/gmail/oauth/callback`.

Arrancar backend con:

```bash
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4001/api/gmail/oauth/callback
```

En produccion tambien son obligatorios:

```txt
NODE_ENV=production
PERSISTENCE_DRIVER=prisma
DATABASE_URL=postgresql://...
JWT_SECRET=<secreto-real-32+>
TOKEN_ENCRYPTION_KEY=<secreto-real-32+>
FRONTEND_URL=https://<frontend-host>
```

## Handoff para empezar front

API local validada:

```txt
http://localhost:4001
```

OpenAPI:

```txt
http://localhost:4001/api/openapi.json
```

Primer flujo recomendado:

1. Pantalla login/register con `/api/auth/login` y `/api/auth/register`.
2. Guardar `accessToken` y enviarlo como `Authorization: Bearer <token>`.
3. Cargar sesion con `/api/auth/me`.
4. Dashboard base con `/api/gmail/accounts`, `/api/emails`, `/api/alerts` y `/api/analytics/summary`.
5. Boton "Conectar Gmail" usando `POST /api/gmail/oauth/start`; abrir `data.authUrl`.
6. Pantalla de resultado OAuth leyendo query params `oauth`, `gmailAccountId`, `email` y `synced`.
7. Bandeja unificada usando `/api/emails` y detalle con `/api/emails/:id`.
8. Acciones de usuario: marcar revisado, marcar importante, corregir clasificacion, resolver alertas, crear reglas y confiar/sospechar remitentes.

## Validacion ejecutada

```bash
npm run build
npm test
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run db:deploy
env DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public PRISMA_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run test:prisma
```

Resultados:

- Build TypeScript pasando.
- Tests HTTP/memoria pasando.
- Tests de repositorios Prisma pasando contra PostgreSQL real.
- Tests HTTP Prisma pasando contra PostgreSQL real.
- Migraciones nuevas aplicadas correctamente en `auto_gmail_code_test`.

## Para conectar Gmail real

Configurar en el ambiente backend:

```txt
PERSISTENCE_DRIVER=prisma
DATABASE_URL=postgresql://...
JWT_SECRET=<secreto-real-32+>
TOKEN_ENCRYPTION_KEY=<secreto-real-32+>
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=https://<api-host>/api/gmail/oauth/callback
FRONTEND_URL=https://<frontend-host>
```

En Google Cloud:

- Habilitar Gmail API.
- Configurar OAuth consent screen.
- Crear OAuth Client tipo Web Application.
- Registrar el redirect URI exacto del backend.

El backend no puede probar una cuenta Gmail real sin esas credenciales externas, pero el flujo queda implementado para intercambiar `code`, guardar tokens cifrados, crear/actualizar cuenta Gmail y sincronizar correos reales.
