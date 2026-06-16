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
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=https://<api-host>/api/gmail/oauth/callback
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify
```

7. Ejecutar:

```txt
POST /api/gmail/oauth/start
```

8. Abrir `data.authUrl`, aceptar permisos y volver al callback.

9. Validar en API:

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
