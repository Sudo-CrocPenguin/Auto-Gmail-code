# Estado Backend Auto-Gmail-code

Ultima actualizacion: 2026-06-16.

## Pendientes abiertos

No hay pendientes abiertos para la primera version backend dentro del alcance actual.

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
