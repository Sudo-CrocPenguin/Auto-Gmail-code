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

## Persistencia actual

La implementacion actual usa repositorios en memoria con datos seed. Esto hace que la API sea funcional sin infraestructura externa. Para produccion se debe reemplazar `InMemory*Repository` por adaptadores de base de datos manteniendo los mismos contratos de dominio.

