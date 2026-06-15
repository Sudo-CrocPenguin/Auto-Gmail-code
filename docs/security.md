# Seguridad

## Que protege

El backend evita exponer credenciales o datos sensibles de Gmail al frontend. Gmail se conecta mediante OAuth, la API usa JWT para sesion de usuario y las acciones relevantes quedan registradas en auditoria.

## Reglas aplicadas

- No se solicita contrasena Gmail.
- No se guardan ni exponen access tokens o refresh tokens Gmail en respuestas HTTP.
- Las rutas privadas requieren `Authorization: Bearer <accessToken>`.
- Los endpoints que modifican Gmail, workspace o reglas validan rol `OWNER` o `ADMIN`.
- El cuerpo HTML de correos se sanitiza con `sanitize-html` antes de responder.
- Los errores de validacion devuelven codigo `VALIDATION_ERROR` y detalles controlados.
- Las acciones sensibles generan logs de auditoria.
- Los datos se filtran por `workspaceId` para evitar acceso cruzado entre workspaces.

## OAuth Gmail

El endpoint `POST /api/gmail/oauth/start` construye la URL de Google cuando existen credenciales:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_OAUTH_SCOPES`

Si faltan credenciales, devuelve una URL demo para desarrollo. Esto permite probar el frontend y los flujos sin pedir contrasenas Gmail ni manejar tokens reales.

## Pendiente para produccion

- Persistir usuarios, workspaces y auditoria en base de datos real.
- Guardar tokens Gmail cifrados solo en backend.
- Implementar callback OAuth con intercambio de codigo por tokens.
- Configurar rotacion de secretos.
- Agregar rate limiting por IP y usuario.
- Configurar cookies httpOnly si se decide usar sesion basada en cookies.

