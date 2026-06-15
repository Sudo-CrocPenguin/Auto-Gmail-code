# API backend

## Autenticacion

Todas las rutas privadas usan:

```txt
Authorization: Bearer <accessToken>
```

### POST /api/auth/register

Crea usuario propietario y workspace.

Body:

```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "Password123!",
  "workspaceName": "Empresa Demo",
  "acceptTerms": true
}
```

### POST /api/auth/login

Body:

```json
{
  "email": "owner@autogmail.local",
  "password": "Password123!"
}
```

Respuesta:

```json
{
  "accessToken": "...",
  "user": {},
  "workspace": {}
}
```

### GET /api/auth/me

Devuelve usuario y workspace autenticados.

### POST /api/auth/logout

Registra auditoria de cierre de sesion.

## Workspace

### GET /api/workspaces/current

Devuelve el workspace activo.

### PATCH /api/workspaces/current

Actualiza `name` o `plan`. Requiere rol `OWNER` o `ADMIN`.

## Gmail

### GET /api/gmail/accounts

Lista cuentas Gmail del workspace.

### POST /api/gmail/oauth/start

Inicia OAuth. Si `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estan configurados, devuelve URL de Google. Si no, devuelve URL demo para desarrollo.

### GET /api/gmail/oauth/status

Consulta estado final conocido del flujo OAuth.

### GET /api/gmail/oauth/callback

Callback configurado para Google OAuth. Recibe `code`, `state` o `error`, registra auditoria si el `state` identifica workspace y redirige al frontend con `oauth=success` u `oauth=error`.

Cuando Google OAuth esta configurado, este endpoint:

1. Intercambia `code` por credenciales OAuth.
2. Obtiene el perfil Gmail autorizado.
3. Crea o actualiza la cuenta Gmail del workspace.
4. Guarda tokens cifrados en backend.
5. Sincroniza mensajes recientes con Gmail API.
6. Redirige al frontend con `gmailAccountId`, `email` y `synced`.

### POST /api/gmail/accounts/:id/sync

Solicita sincronizacion manual. Si la cuenta tiene credenciales OAuth guardadas, usa Gmail API real. Si la cuenta pertenece a los datos demo y no tiene tokens, ejecuta el comportamiento demo.

### POST /api/gmail/accounts/:id/reconnect

Inicia reconexion OAuth o recupera estado demo si no hay credenciales.

### DELETE /api/gmail/accounts/:id

Marca cuenta como desconectada. No elimina correos historicos.

## Emails

### GET /api/emails

Query params soportados:

- `page`
- `limit`
- `search`
- `gmailAccountId`
- `fromEmail`
- `fromDomain`
- `category`
- `isImportant`
- `isSpam`
- `actionRequired`
- `hasAttachments`
- `isRead`
- `minImportanceScore`
- `minRiskScore`
- `minSecurityScore`
- `dateFrom`
- `dateTo`
- `sortBy`
- `sortOrder`

### GET /api/emails/:id

Devuelve detalle del correo. `bodyHtml` se devuelve sanitizado.

### PATCH /api/emails/:id/classification

Corrige clasificacion manualmente.

Body minimo:

```json
{
  "primaryCategory": "REVIEW",
  "explanation": "Correccion manual."
}
```

### POST /api/emails/:id/mark-reviewed

Marca correo como revisado.

### POST /api/emails/:id/mark-important

Marca correo como importante.

## Alertas

- `GET /api/alerts`
- `GET /api/alerts/:id`
- `POST /api/alerts/:id/resolve`
- `POST /api/alerts/:id/ignore`

## Remitentes

- `GET /api/senders`
- `GET /api/senders/:id`
- `POST /api/senders/:id/trust`
- `POST /api/senders/:id/suspicious`
- `GET /api/senders/:id/emails`

## Reglas

- `GET /api/rules`
- `POST /api/rules`
- `GET /api/rules/:id`
- `PATCH /api/rules/:id`
- `DELETE /api/rules/:id`
- `POST /api/rules/:id/enable`
- `POST /api/rules/:id/disable`

## Analitica

- `GET /api/analytics/summary`
- `GET /api/analytics/emails-by-day`
- `GET /api/analytics/categories`
- `GET /api/analytics/top-senders`
- `GET /api/analytics/accounts`

## Auditoria

### GET /api/audit

Query params:

- `page`
- `limit`
- `action`
- `userId`
- `dateFrom`
- `dateTo`
