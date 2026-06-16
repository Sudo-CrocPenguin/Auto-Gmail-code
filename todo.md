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
- Request ID en respuestas y logs.
- Logger estructurado JSON para requests y errores.
- Readiness check en `/api/health/ready` con validacion de Prisma y configuracion OAuth Gmail.
- CI backend en GitHub Actions con build, tests, migraciones, seed y prueba Prisma sobre PostgreSQL.
- Sync Gmail usa `nextPageToken` en mensajes recientes e historial incremental.
- Motor inicial de reglas automaticas durante Gmail Sync para correos nuevos.
- Perfil de usuario y cambio de password autenticado.
- Desconexion Gmail intenta revocar token OAuth remoto y registra resultado.

## P0 - Pendiente critico antes de produccion

### 1. Persistencia Prisma validada contra una base real

Ya se valido PostgreSQL real con Docker: migraciones `db:deploy`, seed demo y `npm run test:prisma` contra `auto_gmail_code_test`. Falta la verificacion manual completa con la API corriendo en modo Prisma:

- Arrancar con `PERSISTENCE_DRIVER=prisma`.
- Validar login con usuario demo.
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

- Definir estrategia fina para limpiar access token vencido sin perder informacion recuperable.
- Documentar el flujo operativo de reconexion para soporte.

### 4. Hardening de secretos

Actualmente `JWT_SECRET` y `TOKEN_ENCRYPTION_KEY` vienen de `.env`. Falta:

- Documentar rotacion de `TOKEN_ENCRYPTION_KEY`.
- Definir estrategia de re-cifrado de tokens si cambia la clave.
- Evitar logs accidentales de variables sensibles.

## P1 - Backend recomendado antes o durante el frontend MVP

### 5. OpenAPI operativo para generacion de clientes

El contrato ya incluye schemas principales, errores estandar, paginacion, request bodies base y responses para los endpoints MVP. Falta pulirlo para automatizacion del frontend:

- Completar ejemplos de payload reales en todos los endpoints.
- Revisar request bodies de reglas, settings y acciones puntuales antes de generar cliente.
- Exportar el contrato para que el frontend genere tipos si se desea.

### 6. Tests con PostgreSQL real

Ya existe `npm run test:prisma` y se valido contra PostgreSQL de Docker. Falta ampliar cobertura:

- Automatizar creacion y limpieza de DB de test.
- Agregar casos HTTP completos ejecutando `PERSISTENCE_DRIVER=prisma`.
- Probar desconexion Gmail eliminando tokens desde endpoint HTTP.

### 7. Gmail sync mas completo

El sync actual cubre mensajes recientes e incremental con paginacion `nextPageToken` hasta el limite configurado. Falta:

- Persistir cursor incremental con mas control.
- Evitar duplicados de alertas derivadas.
- Permitir sync por rango de fechas.
- Permitir sync inicial profundo por lotes.

### 8. Clasificacion mas precisa

El clasificador actual es heuristico. Falta:

- Separar reglas internas del clasificador base.
- Guardar explicacion mas estructurada:
  - senales detectadas,
  - reglas aplicadas,
  - scores previos,
  - scores finales.
- Permitir feedback de usuario para mejorar reglas futuras.
- Definir si se usara IA despues y bajo que permisos.

### 9. Aplicacion real de reglas automaticas

El CRUD de reglas ya tiene motor inicial durante sync para correos nuevos: evalua condiciones, aplica categoria/importancia/revision/spam/etiqueta interna, registra `actionHistory`, incrementa `timesApplied` y genera alertas cuando la regla lo solicita. Falta ampliar:

- Aplicar etiqueta Gmail real con `users.messages.modify` si esta habilitado.
- Registrar auditoria agregada por regla aplicada.
- Exponer reglas coincidentes como campo estructurado en detalle de correo, no solo en `actionHistory`.
- Evitar re-aplicacion manual sobre correos existentes salvo que el usuario lo solicite.

### 10. Adjuntos

Actualmente se guarda metadata de adjuntos, no contenido. Falta decidir e implementar:

- Descargar adjunto bajo demanda.
- Nunca descargar masivamente por defecto.
- Validar MIME type.
- Validar tamaño maximo.
- Escanear riesgo si aplica.
- Endpoint sugerido:
  - `GET /api/emails/:id/attachments/:attachmentId`
- Evitar guardar adjuntos completos en DB salvo decision explicita.

### 11. HTML de correos mas seguro

Ya se sanitiza HTML, pero falta reforzar:

- Validar enlaces externos.
- Marcar dominios sospechosos.
- Bloquear tracking pixels si se renderiza contenido remoto.
- Reescribir links para abrir con advertencia si el risk score es alto.
- Guardar `bodyText` separado de `bodyHtml` para busqueda y fallback.

### 12. Busqueda avanzada

La busqueda actual funciona para MVP. Falta:

- Full-text search PostgreSQL.
- Indices por subject/snippet/from/domain.
- Filtros combinados optimizados.
- Ordenamiento por scores desde JSONB o columnas materializadas.
- Paginacion estable por cursor para bandejas grandes.

### 13. RBAC y colaboradores

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

### 14. Gestion de perfil y password

Ya existen:

- `PATCH /api/users/me`
- `PATCH /api/auth/password`

Falta:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- invalidacion de tokens tras cambio de password.

### 15. Sesiones

El JWT actual es stateless. Falta definir:

- Tabla de sesiones.
- Revocacion de sesion.
- Logout real invalidando token.
- Refresh tokens de sesion propia, no Gmail.
- Lista de dispositivos activos.
- Expiracion configurable.

### 16. Auditoria mas fuerte

La auditoria existe. Falta mejorar:

- Guardar IP real considerando proxy.
- Guardar user agent.
- Guardar diff resumido de cambios sensibles.
- Filtrar metadata sensible.
- Retencion automatica segun settings.
- Endpoint de exportacion.

### 17. Observabilidad

Ya existe request ID, logger estructurado JSON y readiness check operativo. Falta:

- Correlation ID por sync.
- Metricas:
  - tiempo de respuesta,
  - errores por endpoint,
  - mensajes sincronizados,
  - fallos OAuth,
  - cuentas que requieren reconexion.
- Exportar metricas para Prometheus/OpenTelemetry o proveedor equivalente.

### 18. Manejo centralizado de errores Gmail API

Ya existe traduccion base para tokens revocados, rate limit, quota exceeded e historyId no recuperable. Falta completar comportamiento operativo:

- Backoff real por cuenta ante `rateLimitExceeded` y `userRateLimitExceeded`.
- Politica de reintentos automatica.
- Exponer `retryAfter` recomendado en logs de sync cuando aplique.

## P2 - Mejoras importantes despues del front MVP

### 19. Gmail Pub/Sub Watch

Para tiempo real real:

- Configurar Google Cloud Pub/Sub.
- Crear topic y subscription.
- Implementar endpoint webhook.
- Verificar mensajes de Pub/Sub.
- Guardar `watchExpiration`.
- Renovar watch antes de expirar.
- Usar Gmail history API desde `historyId`.

### 20. Cola de trabajos

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

### 21. Notificaciones

Definir:

- Email interno.
- Web push.
- SSE/WebSocket para front.
- Notificaciones por alerta critica.
- Preferencias por usuario/workspace.

### 22. Exportacion de datos

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

### 23. Eliminacion y retencion de datos

Falta:

- Jobs de limpieza por settings.
- Eliminacion de cuerpos antiguos.
- Mantener metadata sin cuerpo.
- Borrado de workspace.
- Borrado de cuenta de usuario.

### 24. Seguridad avanzada

- MFA.
- Deteccion de login sospechoso.
- Bloqueo temporal por intentos fallidos.
- Politica de password.
- Cookies httpOnly si se decide migrar desde Bearer local.
- CSRF si se usan cookies.
- CSP para frontend futuro.

### 25. Versionado de API

Antes de produccion publica:

- Definir `/api/v1`.
- Versionar OpenAPI.
- Politica de deprecacion.
- Compatibilidad frontend/back.

### 26. Docker y despliegue

Base creada con Dockerfile, Docker Compose, healthcheck container, variables de entorno y guia de deploy. Falta:

- Separar compose local/staging de una configuracion productiva real.
- Definir proveedor de despliegue final.
- Automatizar migraciones en pipeline de release.

### 27. Calidad y CI

Ya existe GitHub Actions para `npm run check`, migraciones, seed y `npm run test:prisma` con PostgreSQL. Falta:

- Linter.
- Formatter.
- Escaneo de dependencias.
- Validacion de migraciones.

### 28. Documentacion operativa avanzada

Crear o ampliar:

- Guia de Google Cloud OAuth.
- Guia de recuperacion de tokens revocados.
- Runbook de errores Gmail.
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
