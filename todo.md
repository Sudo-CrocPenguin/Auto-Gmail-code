# TODO y contexto Backend Auto-Gmail-code

Ultima actualizacion: 2026-06-16.

Este archivo es la memoria operativa del backend. Debe servir para retomar el proyecto aunque se cierre el chat: explica que es la app, como funciona, que se hizo, que falta y donde mirar.

## Contexto del aplicativo

Auto-Gmail-code es una aplicacion para administrar una o mas cuentas Gmail desde un panel propio. El usuario conecta Gmail mediante OAuth, nunca entregando su contrasena Gmail. Desde el backend se sincronizan correos, se clasifican, se generan alertas, se gestionan reglas automaticas, remitentes, auditoria, settings y analitica.

Por ahora solo se esta desarrollando backend. El frontend vendra despues y deberia consumir el contrato OpenAPI expuesto por la API.

## Reglas de trabajo vigentes

- Rama actual de trabajo: `feature/backend-v1-readiness`.
- Base GitFlow: las features nacen desde `develop`.
- No hacer `git push`; queda reservado para el usuario.
- Commits progresivos y descriptivos en espanol, manteniendo prefijos convencionales: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, etc.
- Cada vez que se complete algo del backlog, quitarlo o actualizarlo aqui.
- Si aparece trabajo nuevo, agregarlo aqui con contexto.
- Mantener arquitectura modular, DDD y POO.
- Documentar con claridad: que es, para que sirve y como funciona.

## Stack y arquitectura actual

- Runtime: Node.js 20+.
- Lenguaje: TypeScript.
- HTTP: Express.
- Validacion: Zod.
- Persistencia: driver seleccionable.
  - `memory`: seed demo en memoria para desarrollo rapido y tests.
  - `prisma`: PostgreSQL mediante Prisma Client y migraciones.
- Seguridad:
  - JWT Bearer para sesion propia.
  - OAuth Gmail para cuentas Google.
  - Tokens Gmail cifrados con AES-256-GCM.
  - Rate limiting en login y rutas Gmail.
- Arquitectura por feature:
  - `domain`: entidades y contratos.
  - `application`: casos de uso.
  - `presentation/http`: rutas, DTOs y controladores.
  - `shared/infrastructure`: Prisma, memoria, JWT, cifrado, logger.

## Como correr el backend

Modo memoria:

```bash
npm run dev
```

Modo Prisma local:

```bash
docker compose up -d postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run db:deploy
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run db:seed
PERSISTENCE_DRIVER=prisma DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public npm run dev
```

URLs utiles:

- API: `http://localhost:4000`
- Health: `http://localhost:4000/api/health`
- Readiness: `http://localhost:4000/api/health/ready`
- OpenAPI: `http://localhost:4000/api/openapi.json`

Usuario demo en memoria o seed Prisma:

```txt
email: owner@autogmail.local
password: Password123!
```

## Validacion ejecutada

Ultima validacion conocida en esta rama:

```bash
npm run check
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run db:deploy
PRISMA_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run test:prisma
```

Resultado conocido:

- Build TypeScript pasando.
- Tests HTTP/memoria pasando.
- Test unitario de motor de reglas pasando.
- Test Prisma contra PostgreSQL real pasando.
- Migraciones aplicadas en PostgreSQL real.
- API respondiendo en `http://localhost:4000`.

## Documentacion existente

- `README.md`: vision general del backend.
- `README.execution.md`: ejecucion local, endpoints de verificacion y variables.
- `docs/architecture.md`: arquitectura modular y flujo de requests.
- `docs/api.md`: resumen de API para frontend.
- `docs/database.md`: Prisma, migraciones y DB real.
- `docs/deployment.md`: Docker, deploy, healthchecks, backups.
- `docs/security.md`: seguridad aplicada y pendientes.
- `docs/backend-development-plan.md`: plan de desarrollo backend.
- `docs/google-oauth.md`: configuracion Google Cloud OAuth.
- `docs/gmail-errors-runbook.md`: errores Gmail y reconexion.
- `docs/secrets-rotation.md`: rotacion de `JWT_SECRET` y `TOKEN_ENCRYPTION_KEY`.

## Commits relevantes ya hechos en la rama

- `docs: crear plan de desarrollo backend`
- `feat: proteger login y sincronizacion con rate limiting`
- `feat: registrar logs de sincronizacion gmail`
- `docs: ampliar contrato openapi del backend`
- `fix: manejar errores operativos de gmail`
- `chore: preparar despliegue docker del backend`
- `test: agregar validacion prisma con base real`
- `feat: agregar readiness y trazabilidad de requests`
- `ci: validar backend con postgres en pull requests`
- `feat: paginar sincronizacion gmail con nextpagetoken`
- `feat: aplicar reglas automaticas en sincronizacion`
- `feat: gestionar perfil y password de usuario`
- `fix: revocar oauth gmail al desconectar cuenta`
- `feat: guardar texto plano de correos`
- `feat: descargar adjuntos gmail bajo demanda`
- `docs: documentar oauth errores gmail y secretos`

## Lo que ya esta hecho

### Base backend

- API Express + TypeScript modular.
- Contenedor manual de dependencias en `src/shared/container.ts`.
- Rutas agrupadas por feature.
- Manejo centralizado de errores.
- Validacion con Zod.
- OpenAPI en `/api/openapi.json`.
- CORS, Helmet y JSON body limit.

### Auth y usuarios

- Registro de usuario propietario.
- Login con JWT.
- Logout auditado.
- `/api/auth/me`.
- `PATCH /api/users/me` para actualizar perfil.
- `PATCH /api/auth/password` para cambiar password con password actual.
- Rate limiting en login y cambio de password.

### Workspace y settings

- Workspace actual.
- Actualizacion de workspace para owner/admin.
- Settings de workspace.
- Settings persistidos en memoria o Prisma.

### Gmail OAuth y cuentas

- Inicio OAuth Gmail con `state` firmado y expiracion.
- Callback OAuth.
- Guardado de tokens Gmail cifrados.
- Listado de cuentas Gmail.
- Reconnect Gmail.
- Disconnect Gmail.
- Disconnect intenta revocar token OAuth remoto y siempre elimina credenciales locales.
- Guia Google OAuth documentada.

### Sincronizacion Gmail

- Sync inicial de mensajes recientes.
- Sync incremental con `historyId` cuando Gmail lo permite.
- Paginacion con `nextPageToken` en `users.messages.list`.
- Paginacion con `nextPageToken` en `users.history.list`.
- Logs de sync en `gmail_sync_logs`.
- Endpoints:
  - `GET /api/gmail/accounts/:id/sync-logs`
  - `GET /api/gmail/accounts/:id/sync-logs/:logId`
- Manejo base de errores Gmail:
  - token revocado,
  - rate limit,
  - quota exceeded,
  - historyId no recuperable,
  - errores desconocidos.

### Correos

- Bandeja unificada.
- Detalle de correo.
- Filtros por cuenta, remitente, dominio, categoria, scores, fechas, adjuntos, lectura.
- Correccion manual de clasificacion.
- Marcar revisado.
- Marcar importante.
- `bodyHtml` y `bodyText` separados.
- HTML sanitizado antes de responder detalle.

### Adjuntos

- Metadata de adjuntos guardada.
- `GET /api/emails/:id/attachments/:attachmentId`.
- Descarga bajo demanda desde Gmail.
- No hay descarga masiva por defecto.
- Limite por `GMAIL_ATTACHMENT_MAX_BYTES`.
- Bloqueo basico de MIME/extensiones ejecutables.
- El contenido no se guarda completo en DB.

### Clasificacion, alertas y reglas

- Clasificador heuristico inicial.
- Alertas derivadas por seguridad, riesgo, importancia y spam probable.
- CRUD de reglas automaticas.
- Motor inicial de reglas durante sync para correos nuevos:
  - evalua condiciones,
  - asigna categoria,
  - marca importante,
  - genera alerta,
  - marca revisar,
  - ignora spam,
  - aplica etiqueta interna,
  - registra `actionHistory`,
  - incrementa `timesApplied`.

### Remitentes, analitica y auditoria

- Perfiles de remitentes.
- Marcar remitente confiable o sospechoso.
- Listar correos por remitente.
- Analitica resumen, categorias, top remitentes, emails por dia y cuentas.
- Auditoria paginada.
- Acciones sensibles registradas.

### Persistencia y despliegue

- Prisma schema.
- Migraciones:
  - `20260615190000_initial_schema`
  - `20260616153000_add_gmail_sync_logs`
  - `20260616172000_add_email_body_text`
- Seed demo Prisma.
- Dockerfile.
- Docker Compose con PostgreSQL y API.
- `.dockerignore`.
- Healthcheck de contenedor.
- Readiness `/api/health/ready`.
- CI GitHub Actions con PostgreSQL:
  - `npm ci`,
  - Prisma generate,
  - `npm run check`,
  - migraciones,
  - seed,
  - `npm run test:prisma`.

### Observabilidad

- `x-request-id` por request.
- Logger JSON para requests y errores.
- Readiness con checks de DB y config OAuth Gmail.

## Pendiente P0 - critico antes de produccion real

### P0.1 Verificacion manual Prisma end-to-end

Ya se valido Prisma contra PostgreSQL real con migraciones, seed y test de repositorios. Falta validar manualmente con la API corriendo en modo Prisma:

- Arrancar API con `PERSISTENCE_DRIVER=prisma`.
- Login con usuario demo.
- Crear/editar settings.
- Conectar Gmail real.
- Sincronizar Gmail real.
- Reiniciar API.
- Confirmar persistencia de:
  - usuario,
  - workspace,
  - settings,
  - cuentas Gmail,
  - tokens cifrados,
  - correos,
  - alertas,
  - remitentes,
  - reglas,
  - auditoria,
  - logs de sync.

### P0.2 Verificacion Gmail real con Google Cloud

Bloqueado hasta tener credenciales Google reales.

Checklist:

- Crear proyecto Google Cloud.
- Habilitar Gmail API.
- Crear OAuth Client Web.
- Configurar redirect URI.
- Configurar scopes.
- Definir:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_OAUTH_REDIRECT_URI`
- Ejecutar `POST /api/gmail/oauth/start`.
- Abrir `authUrl`.
- Aceptar permisos.
- Volver al callback.
- Confirmar cuenta creada en `gmail_accounts`.
- Confirmar token cifrado en `gmail_oauth_tokens`.
- Confirmar correos reales en `/api/emails`.
- Confirmar sync incremental despues de recibir nuevos correos.
- Probar al menos dos cuentas Gmail.

### P0.3 Refresh tokens revocados

Ya se detecta token revocado y se marca cuenta como `RECONNECT_REQUIRED`. Falta:

- Definir estrategia fina para limpiar access token vencido sin perder refresh recuperable.
- Decidir si se borra access token local al detectar `invalid_grant`.
- Automatizar aviso de soporte o UI para reconexion.
- Probar con token revocado real.

### P0.4 Re-cifrado de tokens

Ya existe guia en `docs/secrets-rotation.md`. Falta implementar:

- Script de re-cifrado de `gmail_oauth_tokens`.
- Soporte temporal para clave vieja y clave nueva.
- Backup previo automatizado o documentado en script.
- Prueba en staging.

### P0.5 Logs sensibles

Falta auditoria especifica para asegurar que no se impriman:

- access tokens,
- refresh tokens,
- id tokens,
- `TOKEN_ENCRYPTION_KEY`,
- `JWT_SECRET`,
- variables completas de entorno.

## Pendiente P1 - recomendado antes o durante frontend MVP

### P1.1 OpenAPI listo para generacion de cliente

El contrato ya cubre endpoints principales. Falta:

- Agregar ejemplos reales de payload a endpoints principales.
- Revisar request bodies de reglas, settings y acciones puntuales.
- Exportar o versionar archivo OpenAPI para el frontend.
- Validar si el frontend generara tipos con OpenAPI.

### P1.2 Tests con Prisma via HTTP

Ya existe test de repositorios Prisma. Falta:

- Automatizar creacion y limpieza de DB de test.
- Ejecutar casos HTTP completos con `PERSISTENCE_DRIVER=prisma`.
- Probar desconexion Gmail eliminando tokens desde endpoint HTTP.
- Probar migraciones desde DB vacia en CI con una base dedicada.

### P1.3 Sync Gmail mas completo

Ya hay sync reciente/incremental con paginacion. Falta:

- Persistir cursor incremental con mas control operativo.
- Evitar duplicados de alertas derivadas en escenarios de re-sync.
- Permitir sync por rango de fechas.
- Permitir sync inicial profundo por lotes.
- Registrar correlation ID por sync.

### P1.4 Clasificacion mas precisa

El clasificador actual es heuristico. Falta:

- Separar reglas internas del clasificador base.
- Guardar explicacion estructurada:
  - senales detectadas,
  - reglas aplicadas,
  - scores previos,
  - scores finales.
- Permitir feedback de usuario para mejorar reglas.
- Decidir si se usara IA despues y bajo que permisos.

### P1.5 Reglas automaticas avanzadas

Ya existe motor inicial durante sync. Falta:

- Aplicar etiqueta Gmail real con `users.messages.modify`.
- Registrar auditoria agregada por regla aplicada.
- Exponer reglas coincidentes como campo estructurado en detalle del correo.
- Re-aplicar reglas manualmente sobre correos existentes si el usuario lo solicita.

### P1.6 Adjuntos avanzados

Ya existe descarga bajo demanda. Falta:

- Escaneo de riesgo si aplica.
- Ampliar allowlist/denylist de MIME segun politica final.
- Decidir si algunos adjuntos pueden cachearse temporalmente.
- Definir expiracion de descargas si se agregan URLs firmadas en el futuro.

### P1.7 HTML y links de correos

Ya se sanitiza HTML. Falta:

- Validar enlaces externos.
- Marcar dominios sospechosos.
- Bloquear tracking pixels si se renderiza contenido remoto.
- Reescribir links para abrir con advertencia si risk score es alto.

### P1.8 Busqueda avanzada

La busqueda actual sirve para MVP. Falta:

- Full-text search PostgreSQL.
- Indices por `subject`, `snippet`, `bodyText`, `fromEmail`, `fromDomain`.
- Filtros combinados optimizados.
- Ordenamiento por scores desde JSONB o columnas materializadas.
- Paginacion estable por cursor para bandejas grandes.

### P1.9 RBAC y colaboradores

Actualmente el usuario tiene rol, pero no existe modelo completo de membresias. Falta:

- Invitar colaboradores al workspace.
- Tabla de membresias si un usuario puede estar en varios workspaces.
- Permisos granulares:
  - ver correos,
  - corregir clasificacion,
  - crear reglas,
  - resolver alertas,
  - conectar Gmail,
  - desconectar Gmail,
  - ver auditoria.
- Endpoints sugeridos:
  - `GET /api/workspaces/current/members`
  - `POST /api/workspaces/current/invitations`
  - `PATCH /api/workspaces/current/members/:id`
  - `DELETE /api/workspaces/current/members/:id`

### P1.10 Password reset y sesiones

Ya existe cambio de password autenticado. Falta:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- Tabla de sesiones.
- Revocacion de sesion.
- Logout real invalidando token.
- Refresh tokens propios de la app.
- Lista de dispositivos activos.
- Invalidar tokens tras cambio de password.

### P1.11 Auditoria fuerte

La auditoria existe. Falta:

- Guardar IP real considerando proxy.
- Guardar user agent.
- Guardar diff resumido de cambios sensibles.
- Filtrar metadata sensible.
- Retencion automatica segun settings.
- Endpoint de exportacion.

### P1.12 Observabilidad

Ya existe request ID, logger JSON y readiness. Falta:

- Correlation ID por sync.
- Metricas:
  - tiempo de respuesta,
  - errores por endpoint,
  - mensajes sincronizados,
  - fallos OAuth,
  - cuentas que requieren reconexion.
- Exportar metricas para Prometheus, OpenTelemetry o proveedor equivalente.

### P1.13 Errores Gmail operativos

Ya existe traduccion base. Falta:

- Backoff real por cuenta ante `rateLimitExceeded` y `userRateLimitExceeded`.
- Politica de reintentos automatica.
- Exponer `retryAfter` recomendado en logs de sync cuando aplique.

### P1.14 Calidad y CI

Ya existe workflow base. Falta:

- Linter.
- Formatter.
- Escaneo de dependencias.
- Validacion de migraciones mas estricta.
- Revisar advertencia Prisma: `package.json#prisma` sera removido en Prisma 7; migrar a `prisma.config.ts` antes de subir a Prisma 7.

## Pendiente P2 - despues del frontend MVP

### P2.1 Gmail Pub/Sub Watch

Para tiempo real real:

- Configurar Google Cloud Pub/Sub.
- Crear topic y subscription.
- Implementar endpoint webhook.
- Verificar mensajes Pub/Sub.
- Guardar `watchExpiration`.
- Renovar watch antes de expirar.
- Usar Gmail history API desde `historyId`.

### P2.2 Cola de trabajos

La sincronizacion deberia salir del request HTTP:

- Evaluar BullMQ, Cloud Tasks, RabbitMQ o equivalente.
- Jobs:
  - sync inicial,
  - sync incremental,
  - renovar watch,
  - clasificar lote,
  - recalcular remitentes.
- Reintentos con backoff.
- Idempotencia por job.

### P2.3 Notificaciones

Definir:

- Email interno.
- Web push.
- SSE o WebSocket para frontend.
- Notificaciones por alerta critica.
- Preferencias por usuario/workspace.

### P2.4 Exportacion de datos

Endpoints posibles:

- `POST /api/exports/emails`
- `POST /api/exports/audit`
- `GET /api/exports/:id`

Considerar:

- CSV,
- JSON,
- rango de fechas,
- filtros,
- permisos,
- auditoria.

### P2.5 Eliminacion y retencion

Falta:

- Jobs de limpieza por settings.
- Eliminacion de cuerpos antiguos.
- Mantener metadata sin cuerpo.
- Borrado de workspace.
- Borrado de cuenta de usuario.

### P2.6 Seguridad avanzada

Falta:

- MFA.
- Deteccion de login sospechoso.
- Bloqueo temporal por intentos fallidos.
- Politica de password.
- Cookies httpOnly si se decide migrar desde Bearer local.
- CSRF si se usan cookies.
- CSP para frontend futuro.

### P2.7 Versionado de API

Antes de produccion publica:

- Definir `/api/v1`.
- Versionar OpenAPI.
- Politica de deprecacion.
- Compatibilidad frontend/back.

### P2.8 Despliegue productivo final

Base Docker ya existe. Falta:

- Separar compose local/staging de configuracion productiva real.
- Definir proveedor final.
- Automatizar migraciones en pipeline de release.
- Definir backups administrados segun proveedor.

## Criterio para declarar backend v1 listo

Minimo para empezar frontend MVP:

- `npm run check` pasando.
- `npm run test:prisma` pasando contra PostgreSQL real.
- OpenAPI usable por frontend.
- Endpoints principales estables:
  - auth,
  - users,
  - workspace,
  - gmail accounts,
  - emails,
  - attachments,
  - alerts,
  - senders,
  - rules,
  - analytics,
  - audit,
  - settings.
- Documentacion de ejecucion actualizada.

Minimo para produccion real:

- Gmail real probado con al menos dos cuentas.
- Sync manual e incremental probado con Gmail real.
- Correos persisten tras reinicio en Prisma.
- Tokens no aparecen en responses ni logs.
- Reconexion real probada.
- Rate limiting activo.
- Logs de sync disponibles.
- Backups y restore definidos.
- Secretos fuertes configurados.
- Plan de rotacion de tokens implementado o aceptado operacionalmente.
