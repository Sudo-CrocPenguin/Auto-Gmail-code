# Google Cloud OAuth

## Que es

Google Cloud OAuth es la configuracion que permite conectar cuentas Gmail reales sin pedir contrasenas. Auto-Gmail-code redirige al usuario a Google, recibe un `code` temporal, lo intercambia por tokens OAuth y guarda esos tokens cifrados en backend.

## Para que sirve

Sirve para que el backend pueda leer mensajes, historial y adjuntos de Gmail con permisos autorizados por el usuario. Tambien permite reconectar cuentas cuando Google revoca credenciales o cuando el usuario cambia permisos.

## Como funciona

1. Crear un proyecto en Google Cloud.
2. Habilitar Gmail API.
3. Configurar la pantalla de consentimiento OAuth.
4. Crear un OAuth Client de tipo Web Application.
5. Registrar el redirect URI del backend:

```txt
http://localhost:4000/api/gmail/oauth/callback
```

En staging o produccion debe usar HTTPS:

```txt
https://<api-host>/api/gmail/oauth/callback
```

6. Configurar variables:

```txt
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/api/gmail/oauth/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify
```

En staging o produccion, `FRONTEND_URL` y `GOOGLE_OAUTH_REDIRECT_URI` deben usar los dominios reales y HTTPS.

7. Ejecutar:

```txt
POST /api/gmail/oauth/start
```

8. Abrir `data.authUrl`, aceptar permisos y volver al callback.

9. El backend redirige al frontend:

```txt
http://localhost:5173/gmail-accounts?oauth=success&gmailAccountId=<id>&email=<gmail>&synced=<n>
```

10. Validar en API:

```txt
GET /api/gmail/accounts
GET /api/emails
POST /api/gmail/accounts/:id/sync
```

## Checklist De Validacion

- La cuenta queda en `CONNECTED`.
- `gmail_oauth_tokens` contiene tokens cifrados, nunca texto plano.
- `/api/emails` muestra mensajes reales.
- `/api/gmail/accounts/:id/sync-logs` registra el resultado.
- Al reiniciar el backend con Prisma, la cuenta y los correos persisten.

## Registro Desde El Frontend

1. Abrir `http://localhost:5173`.
2. Seleccionar `Crear cuenta`.
3. Crear usuario propietario y workspace.
4. Entrar al modulo Gmail que se abre despues del registro.
5. Usar `Registrar Gmail`.

Si el backend responde `configured: false`, no hay OAuth real configurado. En ese caso faltan `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, o el redirect URI no coincide con el registrado en Google Cloud.
