# TODO Backend Auto-Gmail-code

Este documento lista lo que falta o conviene reforzar en el backend despues de la primera version robusta. El backend actual ya tiene API modular, OAuth Gmail real, sincronizacion inicial/incremental, PostgreSQL con Prisma, settings, auditoria y contrato OpenAPI base. Lo pendiente se organiza por prioridad para continuar sin bloquear el inicio del frontend.

## Estado actual resumido

- API Express + TypeScript con arquitectura modular por feature.
- Autenticacion JWT Bearer.
- Registro, login, logout y `/api/auth/me`.
- Workspace actual.
- Persistencia seleccionable con `PERSISTENCE_DRIVER=memory` o `PERSISTENCE_DRIVER=prisma`.
- PostgreSQL mediante Prisma.
- Migracion inicial y seed demo.
- OAuth Gmail real con `state` firmado y expiracion de 10 minutos.
- Tokens Gmail cifrados con AES-256-GCM.
- Sync Gmail inicial y sync incremental con `historyId` cuando Gmail lo permite.
- Bandeja unificada, detalle de correo, filtros, clasificacion visible y correccion manual.
- Alertas, remitentes, reglas, analitica, auditoria y settings.
- OpenAPI base en `/api/openapi.json`.
- Tests de integracion principales.

## P0 - Pendiente critico antes de produccion

### 1. Persistencia Prisma validada contra una base real

Aunque el codigo Prisma compila, falta ejecutar y validar en una instancia PostgreSQL real:

- Levantar PostgreSQL local o de desarrollo.
- Ejecutar `npm run db:migrate`.
- Ejecutar `npm run db:seed`.
- Arrancar con `PERSISTENCE_DRIVER=prisma`.
- Validar manualmente login con usuario demo.
- Conectar Gmail real.
- Verificar que al reiniciar el servidor se conservan:
  - usuario demo,
  - workspace,
  - settings,
  - cuenta Gmail conectada,
  - tokens cifrados,
  - correos sincronizados,
  - alertas,
  - remitentes,
  - reglas,
  - auditoria.

### 2. Verificacion end-to-end de Gmail real

Falta una prueba manual completa con Google Cloud:

- Crear OAuth Client real.
- Configurar redirect URI autorizado.
- Configurar scopes.
- Ejecutar `/api/gmail/oauth/start`.
- Abrir `authUrl`.
- Aceptar permisos.
- Volver a `/api/gmail/oauth/callback`.
- Confirmar que se crea la cuenta en `gmail_accounts`.
- Confirmar que se guarda token cifrado en `gmail_oauth_tokens`.
- Confirmar que `/api/emails` muestra mensajes reales.
- Confirmar que `/api/gmail/accounts/:id/sync` actualiza datos despues de nuevos correos.

### 3. Manejo formal de refresh tokens revocados

Cuando Gmail API rechace credenciales:

- Detectar errores OAuth como `invalid_grant`.
- Marcar cuenta como `RECONNECT_REQUIRED`.
- Borrar access token vencido si aplica.
- Mantener refresh token cifrado solo si sigue siendo recuperable.
- Crear alerta `ACCOUNT_RECONNECT_REQUIRED`.
- Registrar auditoria `GMAIL_TOKEN_REVOKED` o `GMAIL_RECONNECT_REQUIRED`.

### 4. Hardening de secretos

Actualmente `JWT_SECRET` y `TOKEN_ENCRYPTION_KEY` vienen de `.env`. Falta:

- Documentar rotacion de `TOKEN_ENCRYPTION_KEY`.
- Definir estrategia de re-cifrado de tokens si cambia la clave.
- Evitar logs accidentales de variables sensibles.

## P1 - Backend recomendado antes o durante el frontend MVP

### 5. OpenAPI completo con schemas

El contrato actual enumera endpoints y parametros principales, pero falta enriquecerlo:

- Schemas completos para:
  - `User`,
  - `Workspace`,
  - `GmailAccount`,
  - `EmailMessage`,
  - `EmailClassification`,
  - `Alert`,
  - `SenderProfile`,
  - `AutomationRule`,
  - `AuditLog`,
  - `WorkspaceSettings`,
  - errores,
  - paginacion.
- Request bodies completos.
- Responses `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `429`, `500`.
- Ejemplos de payload reales.
- Exportar el contrato para que el frontend genere tipos si se desea.

### 6. Tests con PostgreSQL real

Los tests actuales usan memoria. Falta suite con DB:

- Crear DB de test.
- Ejecutar migraciones en test.
- Limpiar datos entre pruebas.
- Probar registro/login contra Prisma.
- Probar settings contra Prisma.
- Probar reglas contra Prisma.
- Probar correccion de clasificacion persistida.
- Probar auditoria persistida.
- Probar desconexion Gmail eliminando tokens.

### 7. Gmail sync mas completo

El sync actual cubre mensajes recientes e incremental basico. Falta:

- Manejar `nextPageToken` en `users.messages.list`.
- Manejar `nextPageToken` en `users.history.list`.
- Persistir cursor incremental con mas control.
- Evitar duplicados de alertas derivadas.
- Evitar incrementar remitentes dos veces cuando un correo ya existe.
- Guardar resumen de cada sync en una tabla propia.
- Exponer logs resumidos para UI.
- Permitir sync por rango de fechas.
- Permitir sync inicial profundo por lotes.

### 8. Tabla de logs de sincronizacion

Crear entidad `SyncLog` o `GmailSyncJob`:

- `id`
- `workspaceId`
- `gmailAccountId`
- `status`
- `startedAt`
- `finishedAt`
- `fetchedMessages`
- `createdMessages`
- `updatedMessages`
- `errorMessage`
- `metadata`

Endpoints sugeridos:

- `GET /api/gmail/accounts/:id/sync-logs`
- `GET /api/gmail/accounts/:id/sync-logs/:logId`

### 9. Clasificacion mas precisa

El clasificador actual es heuristico. Falta:

- Separar reglas internas del clasificador base.
- Aplicar reglas automaticas reales sobre correos nuevos.
- Registrar reglas que hicieron match.
- Guardar explicacion mas estructurada:
  - senales detectadas,
  - reglas aplicadas,
  - scores previos,
  - scores finales.
- Permitir feedback de usuario para mejorar reglas futuras.
- Definir si se usara IA despues y bajo que permisos.

### 10. Aplicacion real de reglas automaticas

El CRUD de reglas existe, pero falta el motor:

- Evaluar condiciones sobre cada correo sincronizado.
- Ejecutar acciones:
  - asignar categoria,
  - marcar importante,
  - generar alerta,
  - marcar revisar,
  - ignorar spam,
  - aplicar etiqueta interna,
  - aplicar etiqueta Gmail si esta habilitado.
- Incrementar `timesApplied`.
- Registrar auditoria por regla aplicada.
- Exponer reglas coincidentes en detalle de correo.

### 11. Adjuntos

Actualmente se guarda metadata de adjuntos, no contenido. Falta decidir e implementar:

- Descargar adjunto bajo demanda.
- Nunca descargar masivamente por defecto.
- Validar MIME type.
- Validar tamaño maximo.
- Escanear riesgo si aplica.
- Endpoint sugerido:
  - `GET /api/emails/:id/attachments/:attachmentId`
- Evitar guardar adjuntos completos en DB salvo decision explicita.

### 12. HTML de correos mas seguro

Ya se sanitiza HTML, pero falta reforzar:

- Validar enlaces externos.
- Marcar dominios sospechosos.
- Bloquear tracking pixels si se renderiza contenido remoto.
- Reescribir links para abrir con advertencia si el risk score es alto.
- Guardar `bodyText` separado de `bodyHtml` para busqueda y fallback.

### 13. Busqueda avanzada

La busqueda actual funciona para MVP. Falta:

- Full-text search PostgreSQL.
- Indices por subject/snippet/from/domain.
- Filtros combinados optimizados.
- Ordenamiento por scores desde JSONB o columnas materializadas.
- Paginacion estable por cursor para bandejas grandes.

### 14. RBAC y colaboradores

Actualmente el rol viene en usuario, pero falta modelo completo:

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
- Endpoints de miembros:
  - `GET /api/workspaces/current/members`
  - `POST /api/workspaces/current/invitations`
  - `PATCH /api/workspaces/current/members/:id`
  - `DELETE /api/workspaces/current/members/:id`

### 15. Gestion de perfil y password

Faltan endpoints:

- `PATCH /api/users/me`
- `PATCH /api/auth/password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- invalidacion de tokens tras cambio de password.

### 16. Sesiones

El JWT actual es stateless. Falta definir:

- Tabla de sesiones.
- Revocacion de sesion.
- Logout real invalidando token.
- Refresh tokens de sesion propia, no Gmail.
- Lista de dispositivos activos.
- Expiracion configurable.

### 17. Auditoria mas fuerte

La auditoria existe. Falta mejorar:

- Guardar IP real considerando proxy.
- Guardar user agent.
- Guardar diff resumido de cambios sensibles.
- Filtrar metadata sensible.
- Retencion automatica segun settings.
- Endpoint de exportacion.

### 18. Observabilidad

Agregar:

- Logger estructurado.
- Request ID.
- Correlation ID por sync.
- Metricas:
  - tiempo de respuesta,
  - errores por endpoint,
  - mensajes sincronizados,
  - fallos OAuth,
  - cuentas que requieren reconexion.
- Healthcheck extendido:
  - DB disponible,
  - Prisma conectado,
  - config Gmail presente.

### 19. Manejo centralizado de errores Gmail API

Agregar traductor de errores:

- `invalid_grant` => reconectar.
- `rateLimitExceeded` => retry later.
- `userRateLimitExceeded` => backoff por cuenta.
- `quotaExceeded` => alerta operativa.
- `notFound` en historyId => sync inicial de recuperacion.

## P2 - Mejoras importantes despues del front MVP

### 20. Gmail Pub/Sub Watch

Para tiempo real real:

- Configurar Google Cloud Pub/Sub.
- Crear topic y subscription.
- Implementar endpoint webhook.
- Verificar mensajes de Pub/Sub.
- Guardar `watchExpiration`.
- Renovar watch antes de expirar.
- Usar Gmail history API desde `historyId`.

### 21. Cola de trabajos

La sincronizacion deberia salir del request HTTP:

- BullMQ, Cloud Tasks, RabbitMQ o equivalente.
- Jobs:
  - sync inicial,
  - sync incremental,
  - renovar watch,
  - clasificar lote,
  - recalcular remitentes.
- Reintentos con backoff.
- Idempotencia por job.

### 22. Notificaciones

Definir:

- Email interno.
- Web push.
- SSE/WebSocket para front.
- Notificaciones por alerta critica.
- Preferencias por usuario/workspace.

### 23. Exportacion de datos

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

### 24. Eliminacion y retencion de datos

Falta:

- Jobs de limpieza por settings.
- Eliminacion de cuerpos antiguos.
- Mantener metadata sin cuerpo.
- Borrado de workspace.
- Borrado de cuenta de usuario.
- Revocacion OAuth al desconectar Gmail.

### 25. Seguridad avanzada

- MFA.
- Deteccion de login sospechoso.
- Bloqueo temporal por intentos fallidos.
- Politica de password.
- Cookies httpOnly si se decide migrar desde Bearer local.
- CSRF si se usan cookies.
- CSP para frontend futuro.

### 26. Versionado de API

Antes de produccion publica:

- Definir `/api/v1`.
- Versionar OpenAPI.
- Politica de deprecacion.
- Compatibilidad frontend/back.

### 27. Docker y despliegue

Falta:

- Dockerfile.
- docker-compose con PostgreSQL.
- variables de entorno por ambiente.
- script de migracion en deploy.
- healthcheck container.
- estrategia de backups y restauracion PostgreSQL.
- documentar despliegue.

### 28. Calidad y CI

Agregar:

- Linter.
- Formatter.
- GitHub Actions o CI equivalente.
- `npm run check` en PR.
- Tests Prisma con DB de test.
- Escaneo de dependencias.
- Validacion de migraciones.

### 29. Documentacion operativa avanzada

Crear o ampliar:

- Guia de deploy.
- Guia de Google Cloud OAuth.
- Guia de recuperacion de tokens revocados.
- Runbook de errores Gmail.
- Runbook de migraciones.
- Contrato OpenAPI completo.

## Criterio sugerido para declarar backend v1 listo

- PostgreSQL validado end-to-end.
- OAuth Gmail real probado con al menos dos cuentas.
- Sync manual e incremental probado.
- Correos persisten tras reinicio.
- Tokens no aparecen en responses ni logs.
- OpenAPI completo con schemas.
- Settings integrado con frontend.
- Tests memory y Prisma pasando.
- Rate limiting activo.
- Logs de sync disponibles.
- Documentacion de ejecucion completa.
