# Plan de desarrollo backend

## Que es

Este documento define el plan de desarrollo del backend de Auto-Gmail-code. La aplicacion sera un administrador de una o mas cuentas Gmail conectadas por OAuth, desde donde el usuario podra sincronizar correos, revisarlos, clasificarlos, gestionar alertas, controlar remitentes, crear reglas automaticas y auditar acciones del workspace.

Por ahora el desarrollo se concentra solo en backend. El objetivo es dejar una API solida, documentada, probada y preparada para que despues el frontend web, movil o escritorio consuma contratos estables.

## Para que sirve

El plan sirve para ordenar el trabajo en fases, evitar mezclar prioridades y mantener claro que falta para pasar de MVP a backend productivo. Cada fase debe cerrar con pruebas, documentacion y actualizacion del backlog vivo en `todo.md`.

## Como funciona el flujo de trabajo

- Todo desarrollo nace desde `develop`.
- Cada trabajo usa una rama GitFlow segun su tipo: `feature/*`, `bugfix/*`, `refactor/*`, `chore/*`, `docs/*` o `test/*` cuando aplique.
- Los commits son progresivos, especificos y en espanol despues del tipo convencional.
- `git push` queda reservado para el propietario del proyecto.
- `todo.md` es el backlog vivo: si aparece algo pendiente se agrega; si se termina, se elimina o se ajusta.
- Cada entrega debe ejecutar `npm run check` como minimo.
- Si el cambio toca Prisma, OAuth real, seguridad o persistencia, tambien debe tener prueba manual documentada.

## Principios tecnicos

- Mantener arquitectura modular por feature con separacion `domain`, `application`, `presentation/http` e `infrastructure`.
- Tratar los casos de uso como centro de la logica de negocio.
- Evitar que Express, Prisma o Gmail API entren directamente en reglas de dominio.
- Preferir contratos claros de repositorio y servicios de aplicacion antes que acoplar implementaciones.
- Mantener compatibilidad entre persistencia en memoria y Prisma cuando sea razonable.
- Proteger datos Gmail: nunca pedir contrasenas Gmail, nunca devolver tokens OAuth al cliente y cifrar credenciales en backend.
- Documentar que es cada modulo, para que sirve y como funciona.

## Fase 0 - Estabilizacion de base

Objetivo: confirmar que el backend actual funciona fuera del modo demo y puede sostener desarrollo real.

Entregables:

- Validar PostgreSQL real con `PERSISTENCE_DRIVER=prisma`.
- Ejecutar migraciones y seed en una base local o de desarrollo.
- Confirmar persistencia de usuario, workspace, settings, cuentas Gmail, tokens cifrados, correos, alertas, remitentes, reglas y auditoria.
- Crear suite de tests con Prisma o documentar un entorno reproducible de pruebas de base de datos.
- Corregir cualquier diferencia entre memoria y Prisma.

Criterio de terminado:

- `npm run check` pasa.
- Pruebas contra PostgreSQL pasan o quedan documentadas con comandos claros.
- `todo.md` ya no contiene pendientes de validacion basica de Prisma.

## Fase 1 - Gmail real y sincronizacion confiable

Objetivo: que conectar y sincronizar una o varias cuentas Gmail sea estable, observable y recuperable.

Entregables:

- Verificacion end-to-end con Google Cloud OAuth real.
- Manejo formal de refresh tokens revocados y errores `invalid_grant`.
- Estado `RECONNECT_REQUIRED` confiable con alerta y auditoria.
- Sincronizacion inicial e incremental con `nextPageToken` en Gmail API.
- Logs de sincronizacion por cuenta Gmail.
- Endpoint para consultar historial de sincronizaciones.
- Evitar duplicados de alertas y conteos incorrectos de remitentes.

Criterio de terminado:

- Se puede conectar mas de una cuenta Gmail por workspace.
- Un reinicio del backend no pierde credenciales ni estado de sync.
- Cada sync deja resultado auditable.
- Errores de Gmail se traducen a estados accionables para UI.

## Fase 2 - Bandeja administrable

Objetivo: convertir la bandeja unificada en una base solida para gestion diaria de correos.

Entregables:

- Busqueda avanzada optimizada en PostgreSQL.
- Filtros combinados estables por cuenta, remitente, dominio, categoria, riesgo, importancia, lectura, adjuntos y fechas.
- Paginacion estable para grandes volumenes.
- Persistir `bodyText` separado de `bodyHtml`.
- Reforzar seguridad de HTML, enlaces externos y tracking pixels.
- Endpoint de descarga segura de adjuntos bajo demanda.
- Validacion de MIME type y tamano maximo de adjuntos.

Criterio de terminado:

- La API responde de forma consistente con bandejas grandes.
- El detalle de correo expone HTML sanitizado y texto de respaldo.
- Los adjuntos no se descargan masivamente por defecto.

## Fase 3 - Clasificacion y reglas automaticas

Objetivo: pasar de clasificacion heuristica basica a automatizacion configurable por workspace.

Entregables:

- Separar reglas internas del clasificador base.
- Guardar explicacion estructurada: senales, reglas aplicadas, scores previos y finales.
- Motor real de reglas automaticas sobre correos sincronizados.
- Acciones de reglas: asignar categoria, marcar importante, generar alerta, marcar revisar, ignorar spam y aplicar etiquetas internas.
- Incrementar `timesApplied`.
- Registrar auditoria por regla aplicada.
- Exponer reglas coincidentes en el detalle del correo.
- Definir si se usara IA despues y bajo que permisos.

Criterio de terminado:

- Crear una regla produce efecto real sobre correos nuevos o reprocesados.
- Cada efecto automatico queda rastreable en auditoria e historial del correo.
- El usuario puede entender por que un correo fue clasificado o marcado.

## Fase 4 - Seguridad, permisos y cuentas de usuario

Objetivo: endurecer el backend para uso real por equipos.

Entregables:

- Rate limiting para login, endpoints Gmail y sync manual.
- Validar que en `production` no se usen secretos por defecto.
- Documentar rotacion de `TOKEN_ENCRYPTION_KEY`.
- Modelo de miembros o membresias si un usuario puede pertenecer a varios workspaces.
- Permisos granulares para ver correos, corregir clasificacion, crear reglas, resolver alertas, conectar Gmail, desconectar Gmail y ver auditoria.
- Gestion de perfil y password.
- Recuperacion de password e invalidacion de tokens tras cambio de credenciales.

Criterio de terminado:

- Las operaciones sensibles tienen permisos explicitos.
- Los secretos inseguros bloquean arranque en produccion.
- El login y sync tienen proteccion contra abuso.

## Fase 5 - Analitica, alertas y auditoria operativa

Objetivo: dar visibilidad real sobre el estado del workspace y sus cuentas Gmail.

Entregables:

- Mejorar KPIs de analytics con datos persistidos y agregaciones eficientes.
- Alertas por riesgo, seguridad, spam probable, reconexion requerida y fallos de sync.
- Estados claros para alertas: nueva, ignorada, resuelta y vencida si aplica.
- Auditoria filtrable por actor, entidad, accion y rango de fechas.
- Resumen por cuenta Gmail: volumen, ultimo sync, errores, alertas abiertas y remitentes relevantes.

Criterio de terminado:

- La UI futura puede construir dashboards sin logica pesada del lado cliente.
- Toda accion sensible tiene rastro consultable.

## Fase 6 - Contrato API y experiencia de integracion

Objetivo: dejar la API lista para que un frontend la consuma con bajo riesgo.

Entregables:

- OpenAPI completo con schemas, request bodies, responses y ejemplos.
- Estandarizar errores con codigos, mensajes y detalles.
- Documentar flujos completos: autenticacion, OAuth Gmail, sync, reglas, alertas, adjuntos y settings.
- Exportar contrato para generacion de tipos si se decide.
- Mantener ejemplos curl para pruebas manuales.

Criterio de terminado:

- Un desarrollador frontend puede integrar sin leer el codigo fuente.
- Cada endpoint importante tiene contrato y ejemplo.

## Fase 7 - Operacion y preparacion para despliegue

Objetivo: preparar el backend para ejecutar de forma mantenible fuera del entorno local.

Entregables:

- Scripts de despliegue o instrucciones productivas.
- Configuracion de variables por ambiente.
- Migraciones con `db:deploy`.
- Healthchecks y endpoints de diagnostico seguros.
- Politica de logs sin secretos.
- Estrategia de backups para PostgreSQL.
- CI para build, tests y chequeos de calidad.

Criterio de terminado:

- El backend puede levantarse en un servidor con pasos reproducibles.
- El pipeline detecta fallos antes de fusionar a `develop` o preparar release.

## Orden recomendado de ramas iniciales

1. `feature/prisma-real-validation`: validar y reforzar persistencia real.
2. `feature/gmail-sync-logs`: agregar entidad y endpoints de logs de sincronizacion.
3. `bugfix/gmail-revoked-tokens`: manejar tokens revocados y reconexion requerida.
4. `feature/gmail-sync-pagination`: soportar paginacion Gmail completa.
5. `feature/rate-limiting`: proteger login y sincronizaciones.
6. `feature/openapi-schemas`: completar contrato OpenAPI.
7. `feature/rules-engine`: aplicar reglas automaticas reales.
8. `feature/email-advanced-search`: optimizar busqueda y filtros.
9. `feature/attachments-download`: descargar adjuntos bajo demanda.
10. `feature/workspace-members-rbac`: permisos y colaboradores.

## Criterios globales de calidad

- Cada cambio funcional tiene pruebas proporcionales al riesgo.
- Cada endpoint nuevo actualiza documentacion y OpenAPI.
- Cada cambio de base de datos incluye migracion Prisma y notas en `docs/database.md` si afecta ejecucion.
- Cada cambio de seguridad actualiza `docs/security.md`.
- Cada cierre actualiza `todo.md` quitando lo terminado o ajustando lo que quede.
- Antes de entregar se levanta el backend y se informa la URL HTTP local.
