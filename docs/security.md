# Seguridad

## Que protege

El backend evita exponer credenciales o datos sensibles de Gmail al frontend. Gmail se conecta mediante OAuth, la API usa JWT para sesion de usuario y las acciones relevantes quedan registradas en auditoria.

## Reglas aplicadas

- No se solicita contrasena Gmail.
- No se exponen access tokens o refresh tokens Gmail en respuestas HTTP.
- Los tokens Gmail se cifran con AES-256-GCM mediante `TOKEN_ENCRYPTION_KEY`.
- Las rutas privadas requieren `Authorization: Bearer <accessToken>`.
- Cada JWT contiene `sessionId`; logout revoca la sesion en `app_sessions` y el middleware rechaza tokens revocados o expirados.
- Los endpoints que modifican Gmail, workspace o reglas validan rol `OWNER` o `ADMIN`.
- `/api/auth/login` y las rutas Gmail tienen rate limiting en memoria configurable por ambiente.
- El cuerpo HTML de correos se sanitiza con `sanitize-html` antes de responder.
- Los adjuntos se descargan bajo demanda, con validacion de tamano maximo y bloqueo basico de tipos ejecutables.
- Los errores de validacion devuelven codigo `VALIDATION_ERROR` y detalles controlados.
- Las acciones sensibles generan logs de auditoria.
- Los datos se filtran por `workspaceId` para evitar acceso cruzado entre workspaces.
- `state` OAuth de Gmail esta firmado con JWT, tiene audience/issuer dedicados, expira en 10 minutos, se persiste en `gmail_oauth_states` y se consume una sola vez.
- Con PostgreSQL activo, tokens Gmail cifrados se persisten en `gmail_oauth_tokens`.
- Si Google devuelve token revocado, la cuenta pasa a `RECONNECT_REQUIRED` y se eliminan credenciales OAuth locales.
- Al desconectar una cuenta Gmail, el backend intenta revocar el token OAuth en Google, registra el resultado en auditoria y elimina credenciales locales aunque la revocacion remota falle.
- Los logs HTTP redactan query params sensibles como `code`, `state` y tokens.
- En `production`, el backend bloquea el arranque si `JWT_SECRET` o `TOKEN_ENCRYPTION_KEY` son placeholders o tienen menos de 32 caracteres, si falta `DATABASE_URL`, si `PERSISTENCE_DRIVER` no es `prisma` o si faltan credenciales OAuth Google.

## OAuth Gmail

El endpoint `POST /api/gmail/oauth/start` construye la URL de Google cuando existen credenciales:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_SCOPES`

Si faltan credenciales, devuelve una URL demo solo fuera de `production`. En `production`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son obligatorios para arrancar.

Con credenciales configuradas, el callback OAuth intercambia el codigo por tokens, consulta el perfil Gmail, guarda credenciales cifradas y ejecuta una sincronizacion inicial de mensajes recientes.

## Operacion segura

- Rotar `JWT_SECRET` invalida sesiones activas.
- Rotar `TOKEN_ENCRYPTION_KEY` requiere ejecutar `npm run tokens:reencrypt` con `OLD_TOKEN_ENCRYPTION_KEY` y backup previo.
- Gmail Pub/Sub watch queda como mejora futura para sincronizacion push; v1 usa sync manual/incremental con `historyId`.
