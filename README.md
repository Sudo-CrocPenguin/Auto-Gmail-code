# Auto-Gmail-code

Auto-Gmail-code es una plataforma cliente-servidor para conectar multiples cuentas Gmail via OAuth y Gmail API, sincronizar correos, clasificarlos por remitente, importancia, spam y alertas de seguridad, y gestionarlos desde web, movil y escritorio.

Este repositorio contiene el backend API inicial. La implementacion actual usa TypeScript, Express, DTOs con Zod, casos de uso por modulo y repositorios en memoria con datos seed. La capa de persistencia esta aislada para poder cambiar memoria por base de datos real sin rehacer controladores ni reglas de negocio.

## Para que sirve

- Registrar e iniciar sesion de usuarios.
- Administrar el workspace actual.
- Iniciar flujo OAuth para conectar Gmail sin pedir contrasena Gmail.
- Listar, sincronizar, reconectar y desconectar cuentas Gmail.
- Consultar bandeja unificada con filtros.
- Ver detalle de correos con cuerpo HTML sanitizado.
- Corregir clasificaciones y registrar auditoria.
- Gestionar alertas, remitentes, reglas automaticas, analitica y auditoria.

## Como funciona

La API esta organizada por features. Cada feature separa dominio, casos de uso y capa HTTP:

```txt
src/
  features/
    auth/
    workspace/
    gmail-accounts/
    emails/
    alerts/
    senders/
    rules/
    analytics/
    audit/
  shared/
    application/
    config/
    domain/
    http/
    infrastructure/
```

Los controladores solo validan DTOs, extraen contexto autenticado y llaman casos de uso. Los casos de uso dependen de interfaces de repositorio, no de Express ni de una base de datos concreta.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Configuracion

```bash
cp .env.example .env
npm install
```

Variables principales:

- `PORT`: puerto HTTP. Por defecto `4000`.
- `API_PREFIX`: prefijo de API. Por defecto `/api`.
- `FRONTEND_URL`: URL del frontend para CORS y redirecciones OAuth demo.
- `JWT_SECRET`: secreto para firmar JWT. Cambiar en local/produccion.
- `TOKEN_ENCRYPTION_KEY`: clave usada para cifrar tokens Gmail en backend.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`: credenciales OAuth de Google.
- `GMAIL_SYNC_MAX_MESSAGES`: cantidad maxima de mensajes recientes a traer por sincronizacion.

Si no hay credenciales Google, el endpoint OAuth devuelve una URL demo funcional para desarrollo. Si las credenciales existen, el callback intercambia el `code` por tokens, guarda los tokens cifrados en backend, crea o actualiza la cuenta Gmail y sincroniza mensajes reales.

## Scripts

```bash
npm run dev      # servidor en modo watch
npm run build    # compila TypeScript
npm start        # ejecuta dist/main.js
npm test         # pruebas de integracion
npm run check    # build + tests
```

## Usuario demo

```txt
email: owner@autogmail.local
password: Password123!
```

## Conectar Gmail real

1. Crea un OAuth Client en Google Cloud Console.
2. Configura como redirect URI autorizado:

```txt
http://localhost:4000/api/gmail/oauth/callback
```

3. Copia `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y define un `TOKEN_ENCRYPTION_KEY` propio en `.env`.
4. Arranca el backend:

```bash
npm run dev
```

5. Inicia sesion:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@autogmail.local","password":"Password123!"}'
```

6. Usa el `accessToken` para iniciar OAuth:

```bash
curl -X POST http://localhost:4000/api/gmail/oauth/start \
  -H "Authorization: Bearer <accessToken>"
```

7. Abre `data.authUrl` en el navegador y acepta permisos de Gmail.
8. Al volver al callback, el backend sincroniza mensajes recientes.
9. Consulta correos reales:

```bash
curl "http://localhost:4000/api/emails?limit=25" \
  -H "Authorization: Bearer <accessToken>"
```

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/workspaces/current`
- `PATCH /api/workspaces/current`
- `GET /api/gmail/accounts`
- `POST /api/gmail/oauth/start`
- `GET /api/gmail/oauth/status`
- `POST /api/gmail/accounts/:id/sync`
- `POST /api/gmail/accounts/:id/reconnect`
- `DELETE /api/gmail/accounts/:id`
- `GET /api/emails`
- `GET /api/emails/:id`
- `PATCH /api/emails/:id/classification`
- `POST /api/emails/:id/mark-reviewed`
- `POST /api/emails/:id/mark-important`
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

Mas detalle en [docs/api.md](docs/api.md).

## Seguridad aplicada

- Gmail solo se conecta por OAuth.
- La API no acepta ni solicita contrasenas Gmail.
- Los tokens Gmail se cifran en backend y no se devuelven al frontend.
- Las rutas privadas usan JWT Bearer.
- Los cuerpos HTML de correos se sanitizan antes de responder.
- Acciones sensibles quedan registradas en auditoria.

Ver [docs/security.md](docs/security.md).
