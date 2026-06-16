# README de ejecucion del backend

Este documento define todo lo necesario para ejecutar el backend actual de Auto-Gmail-code. Incluye modo rapido en memoria, modo completo con PostgreSQL/Prisma y flujo de Gmail real.

## 1. Requisitos obligatorios

- Node.js `20` o superior.
- npm `10` o superior.
- Git.
- Puerto libre para API, por defecto `4000`.

Para modo completo:

- PostgreSQL disponible.
- Base de datos creada, por ejemplo `auto_gmail_code`.
- Credenciales OAuth de Google si quieres conectar Gmail real.

## 2. Instalacion inicial

Desde la raiz del proyecto:

```bash
npm install
cp .env.example .env
npm run db:generate
```

`npm run db:generate` genera Prisma Client. Debe ejecutarse despues de instalar dependencias y cada vez que cambie `prisma/schema.prisma`.

## 3. Variables de entorno

Archivo requerido:

```txt
.env
```

Variables actuales:

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

- No subir `.env` al repositorio.
- Cambiar `JWT_SECRET` en cualquier ambiente que no sea demo local.
- Cambiar `TOKEN_ENCRYPTION_KEY` antes de conectar cuentas Gmail reales.
- En `production`, `JWT_SECRET` y `TOKEN_ENCRYPTION_KEY` no pueden ser placeholders y deben tener al menos 32 caracteres.
- En `production`, `PERSISTENCE_DRIVER` debe ser `prisma` y `DATABASE_URL` es obligatorio.
- En `production`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son obligatorios para conectar Gmail real.
- Usar `PERSISTENCE_DRIVER=prisma` si necesitas persistencia real.
- Usar `PERSISTENCE_DRIVER=memory` solo para pruebas rapidas o tests.
- Ajustar rate limits segun ambiente:
  - `RATE_LIMIT_AUTH_*` protege login.
  - `RATE_LIMIT_GMAIL_*` protege endpoints Gmail generales.
  - `RATE_LIMIT_SYNC_*` protege sincronizaciones manuales.

## 4. Modo rapido en memoria

Este modo no necesita PostgreSQL.

Configura:

```txt
PERSISTENCE_DRIVER=memory
```

Ejecuta:

```bash
npm run dev
```

Usuario demo:

```txt
email: owner@autogmail.local
password: Password123!
```

Limitaciones:

- Los datos se pierden al reiniciar el servidor.
- Las cuentas Gmail conectadas no persisten.
- Sirve para probar endpoints, front inicial y tests.

## 5. Modo completo con PostgreSQL

Configura `.env`:

```txt
PERSISTENCE_DRIVER=prisma
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public
```

Ejecuta migraciones:

```bash
npm run db:migrate
```

Crea usuario demo:

```bash
npm run db:seed
```

Arranca backend:

```bash
npm run dev
```

En produccion o servidor:

```bash
npm run build
npm run db:deploy
npm start
```

Tambien existe una guia de despliegue con Docker y backups en:

```txt
docs/deployment.md
```

## 6. Google Cloud OAuth para Gmail real

Para conectar Gmail real necesitas:

- Proyecto en Google Cloud.
- Gmail API habilitada.
- OAuth consent screen configurado.
- OAuth Client tipo Web Application.
- Redirect URI autorizado.

Redirect URI local:

```txt
http://localhost:4000/api/gmail/oauth/callback
```

Variables:

```txt
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/gmail/oauth/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify
```

Reglas de seguridad:

- El backend nunca pide contrasena Gmail.
- El frontend debe abrir `authUrl` recibido desde `/api/gmail/oauth/start`.
- Los tokens Gmail se guardan cifrados solo en backend.
- Los tokens Gmail no se devuelven al frontend.

## 7. Flujo para conectar Gmail real

1. Arranca backend con `PERSISTENCE_DRIVER=prisma`.
2. Haz login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@autogmail.local","password":"Password123!"}'
```

3. Copia `accessToken`.
4. Inicia OAuth:

```bash
curl -X POST http://localhost:4000/api/gmail/oauth/start \
  -H "Authorization: Bearer <accessToken>"
```

5. Abre `data.authUrl` en el navegador.
6. Acepta permisos Gmail.
7. Google vuelve a `/api/gmail/oauth/callback`.
8. El backend:
   - valida `state` firmado y lo consume una sola vez,
   - intercambia `code`,
   - obtiene perfil Gmail,
   - guarda tokens cifrados,
   - crea/actualiza cuenta Gmail,
   - sincroniza mensajes recientes.
9. Consulta cuentas:

```bash
curl http://localhost:4000/api/gmail/accounts \
  -H "Authorization: Bearer <accessToken>"
```

10. Consulta correos:

```bash
curl "http://localhost:4000/api/emails?limit=25" \
  -H "Authorization: Bearer <accessToken>"
```

## 8. Comandos disponibles

```bash
npm run dev
npm run build
npm start
npm test
npm run test:prisma
npm run check
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
```

Uso recomendado:

- Desarrollo sin DB: `npm run dev`.
- Desarrollo con DB: `npm run db:migrate`, `npm run db:seed`, `npm run dev`.
- Validacion antes de commit: `npm run check`.
- Validacion Prisma con DB real: definir `PRISMA_TEST_DATABASE_URL` y ejecutar `npm run test:prisma`. Incluye repositorios y endpoints HTTP con `PERSISTENCE_DRIVER=prisma`.
- CI: `.github/workflows/backend-check.yml` ejecuta `npm ci`, `db:generate`, `npm run check`, migraciones, seed y `npm run test:prisma` con PostgreSQL.
- Produccion: `npm run build`, `npm run db:deploy`, `npm start`.

## 9. Endpoints de verificacion

Healthcheck:

```txt
GET /api/health
```

Readiness operativo:

```txt
GET /api/health/ready
```

## 10. Frontend web

El frontend vive en:

```txt
frontend/
```

Que es:

- Una consola web React + TypeScript para operar el backend desde navegador.
- Usa Vite para desarrollo local y build productivo.
- Consume la API desde `VITE_API_BASE_URL`, por defecto `http://localhost:4000/api`.

Instalacion:

```bash
cd frontend
npm install
cp .env.example .env
```

Ejecucion:

```bash
npm run dev -- --host 0.0.0.0
```

URL habitual:

```txt
http://localhost:5173
```

Validacion:

```bash
npm run build
npm run lint
```

`/api/health` indica que el proceso HTTP esta vivo. `/api/health/ready` valida dependencias operativas: consulta PostgreSQL cuando `PERSISTENCE_DRIVER=prisma` y reporta si la configuracion OAuth Gmail esta completa. Todas las respuestas incluyen header `x-request-id`; si el cliente envia ese header, el backend lo respeta para correlacionar logs.

Contrato OpenAPI:

```txt
GET /api/openapi.json
```

Usuario actual:

```txt
GET /api/auth/me
PATCH /api/users/me
PATCH /api/auth/password
```

Adjuntos:

```txt
GET /api/emails/:id/attachments/:attachmentId
```

La descarga de adjuntos es bajo demanda. El backend valida metadata, tamano maximo (`GMAIL_ATTACHMENT_MAX_BYTES`) y tipos ejecutables basicos antes de pedir el contenido a Gmail.

Settings:

```txt
GET /api/settings
PATCH /api/settings
```

Bandeja:

```txt
GET /api/emails
```

## 10. Reglas de ejecucion local

- Ejecutar desde la raiz del repositorio.
- Ejecutar `npm install` antes de cualquier script.
- Ejecutar `npm run db:generate` si `node_modules` se reinstala.
- No ejecutar `npm start` sin antes ejecutar `npm run build`.
- No usar `PERSISTENCE_DRIVER=prisma` sin `DATABASE_URL`.
- No conectar Gmail real con `TOKEN_ENCRYPTION_KEY` de ejemplo.
- No subir `.env`.
- No imprimir tokens en consola.

## 11. Troubleshooting

### Error: `DATABASE_URL_REQUIRED`

Ocurre si:

```txt
PERSISTENCE_DRIVER=prisma
```

pero falta `DATABASE_URL`.

Solucion:

```txt
DATABASE_URL=postgresql://usuario:password@host:puerto/base?schema=public
```

### Error OAuth: redirect URI mismatch

La URI configurada en Google Cloud no coincide con:

```txt
GOOGLE_OAUTH_REDIRECT_URI
```

Solucion: agregar exactamente esta URI en Google Cloud.

### Gmail no devuelve refresh token

Google puede no devolver refresh token si ya diste permisos antes.

Soluciones:

- mantener `prompt=consent` como esta implementado,
- revocar permisos de la app desde la cuenta Google,
- repetir OAuth.

### Correos no persisten

Revisa:

```txt
PERSISTENCE_DRIVER=prisma
```

Si esta en `memory`, los datos desaparecen al reiniciar.

### Tests fallan por `listen EPERM`

En entornos sandbox, Supertest puede necesitar permisos para abrir puerto efimero local. En una terminal normal:

```bash
npm test
```

debe funcionar.

## 12. Checklist para backend completo funcionando

- `.env` existe.
- `npm install` ejecutado.
- `npm run db:generate` ejecutado.
- Si usas PostgreSQL:
  - PostgreSQL esta arriba.
  - `DATABASE_URL` correcto.
  - `npm run db:migrate` ejecutado.
  - `npm run db:seed` ejecutado.
- `JWT_SECRET` cambiado.
- `TOKEN_ENCRYPTION_KEY` cambiado.
- Google OAuth configurado si se usara Gmail real.
- `npm run dev` levanta API.
- `GET /api/health` responde `ok`.
- Login demo funciona.
- `POST /api/gmail/oauth/start` devuelve `authUrl`.
- Despues de OAuth, `/api/gmail/accounts` muestra cuenta.
- `/api/emails` muestra correos sincronizados.
