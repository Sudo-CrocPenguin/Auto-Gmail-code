# Seguridad

## Que protege

El backend evita exponer credenciales o datos sensibles de Gmail al frontend. Gmail se conecta mediante OAuth, la API usa JWT para sesion de usuario y las acciones relevantes quedan registradas en auditoria.

## Reglas aplicadas

- No se solicita contrasena Gmail.
- No se exponen access tokens o refresh tokens Gmail en respuestas HTTP.
- Los tokens Gmail se cifran con AES-256-GCM mediante `TOKEN_ENCRYPTION_KEY`.
- Las rutas privadas requieren `Authorization: Bearer <accessToken>`.
- Los endpoints que modifican Gmail, workspace o reglas validan rol `OWNER` o `ADMIN`.
- `/api/auth/login` y las rutas Gmail tienen rate limiting en memoria configurable por ambiente.
- El cuerpo HTML de correos se sanitiza con `sanitize-html` antes de responder.
- Los adjuntos se descargan bajo demanda, con validacion de tamano maximo y bloqueo basico de tipos ejecutables.
- Los errores de validacion devuelven codigo `VALIDATION_ERROR` y detalles controlados.
- Las acciones sensibles generan logs de auditoria.
- Los datos se filtran por `workspaceId` para evitar acceso cruzado entre workspaces.
- `state` OAuth de Gmail esta firmado con JWT, tiene audience/issuer dedicados y expira en 10 minutos.
- Con PostgreSQL activo, tokens Gmail cifrados se persisten en `gmail_oauth_tokens`.
- Al desconectar una cuenta Gmail, el backend intenta revocar el token OAuth en Google, registra el resultado en auditoria y elimina credenciales locales aunque la revocacion remota falle.
- En `production`, el backend bloquea el arranque si `JWT_SECRET` o `TOKEN_ENCRYPTION_KEY` usan valores por defecto, si falta `DATABASE_URL` o si `PERSISTENCE_DRIVER` no es `prisma`.

## OAuth Gmail

El endpoint `POST /api/gmail/oauth/start` construye la URL de Google cuando existen credenciales:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_SCOPES`

Si faltan credenciales, devuelve una URL demo para desarrollo. Esto permite probar el frontend y los flujos sin pedir contrasenas Gmail ni manejar tokens reales.

Con credenciales configuradas, el callback OAuth intercambia el codigo por tokens, consulta el perfil Gmail, guarda credenciales cifradas y ejecuta una sincronizacion inicial de mensajes recientes.

## Pendiente para produccion

- Configurar rotacion de secretos.
- Configurar cookies httpOnly si se decide usar sesion basada en cookies.
- Activar Gmail Pub/Sub watch para sincronizacion push en vez de solo sync manual/incremental.
