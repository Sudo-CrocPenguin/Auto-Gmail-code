# Arquitectura del backend

## Que es

El backend de Auto-Gmail-code es una API HTTP modular escrita en TypeScript. Su objetivo es exponer los casos de uso necesarios para autenticar usuarios, administrar workspaces, conectar cuentas Gmail via OAuth, consultar correos clasificados, gestionar alertas, reglas, remitentes, analitica y auditoria.

## Para que sirve

La arquitectura busca que la plataforma pueda crecer sin mezclar Express, reglas de negocio y persistencia. El frontend consumira endpoints estables, mientras que la implementacion interna podra evolucionar hacia una base de datos real, colas de sincronizacion y adaptadores de Gmail API.

## Como funciona

Cada feature sigue esta separacion:

- `domain`: entidades, tipos de negocio y contratos de repositorio.
- `application`: casos de uso. Aqui viven las reglas de negocio.
- `presentation/http`: DTOs, controladores y rutas Express.
- `shared/infrastructure`: implementaciones tecnicas intercambiables, como JWT y repositorios en memoria.

El flujo de una peticion privada es:

1. Express recibe la request.
2. `AuthMiddleware` valida el JWT Bearer.
3. El controlador valida `params`, `query` o `body` con Zod.
4. El controlador llama un caso de uso.
5. El caso de uso consulta repositorios por interfaz.
6. La respuesta se serializa desde el controlador.

## Modulos

- `auth`: registro, login, logout y usuario autenticado.
- `workspace`: consulta y actualizacion del workspace actual.
- `gmail-accounts`: cuentas Gmail, OAuth, sync, reconnect y disconnect.
- `emails`: bandeja unificada, detalle, clasificacion, revisado e importante.
- `alerts`: alertas de seguridad, riesgo, sync y cuenta.
- `senders`: perfiles de remitentes y reputacion.
- `rules`: reglas automaticas con condiciones y acciones.
- `analytics`: KPIs y agregaciones simples para dashboard.
- `audit`: trazabilidad de acciones de usuario y sistema.
- `settings`: preferencias del workspace para tema, idioma, notificaciones, clasificacion y retencion.

## Persistencia

La implementacion soporta dos drivers:

- `memory`: datos seed en memoria para tests y prototipado rapido.
- `prisma`: PostgreSQL mediante Prisma Client y migraciones versionadas.

El selector esta controlado por `PERSISTENCE_DRIVER`. Los casos de uso dependen de contratos de repositorio, por lo que pueden usar memoria o PostgreSQL sin cambiar controladores ni logica de negocio.

## Base de datos

La migracion inicial crea tablas para usuarios, workspaces, cuentas Gmail, tokens OAuth cifrados, correos, alertas, remitentes, reglas y auditoria. Las preferencias de settings viven en la columna `workspaces.settings`.

Los campos variables como reglas, adjuntos, metadata de auditoria, settings y clasificacion se almacenan como `JSONB` para preservar flexibilidad sin bloquear el contrato del frontend.
