# Arquitectura del frontend web

## Que es

El frontend web de Auto-Gmail-code es una aplicacion React + TypeScript creada con Vite. Funciona como consola operativa para consumir la API del backend y administrar el workspace desde navegador.

## Para que sirve

Sirve para que el usuario pueda iniciar sesion, revisar el estado del workspace, conectar o sincronizar cuentas Gmail, consultar correos, inspeccionar alertas, ver reglas automaticas y validar settings sin usar curl ni herramientas externas.

La consola ya no es solo lectura: permite filtrar la bandeja, abrir detalle de correos, marcar correos como revisados o importantes, resolver o ignorar alertas y crear/pausar/activar reglas automaticas.

## Como funciona

La aplicacion usa una arquitectura modular:

- `app`: compone servicios, estado global de la pantalla y shell visual.
- `features`: encapsula cada modulo del producto.
- `shared`: contiene utilidades transversales que no pertenecen a un modulo puntual.

Cada feature mantiene cuatro responsabilidades:

- `domain`: tipos de negocio que la UI entiende.
- `application`: contratos o casos de uso del modulo.
- `infrastructure`: implementaciones HTTP que hablan con el backend.
- `presentation`: componentes React especificos del modulo.

El flujo de datos es unidireccional:

1. Un componente dispara una accion de usuario.
2. `App` llama un caso de uso o repositorio expuesto por `AppServices`.
3. El repositorio usa `HttpClient`.
4. `HttpClient` agrega el JWT cuando existe y llama la API.
5. La respuesta se normaliza en el modulo cuando hace falta adaptar el contrato HTTP al modelo visual.
6. El estado vuelve a React para renderizar el panel.

Las operaciones con efectos laterales se coordinan en `App`:

- El componente recibe callbacks tipados.
- `App` ejecuta el repositorio del modulo.
- Si la operacion termina bien, `WorkspaceOverviewService` vuelve a cargar el estado compartido.
- Si falla, `ApiError` se convierte en un mensaje visible en el shell.

## Modulos actuales

- `auth`: login, lectura de sesion y logout.
- `gmail`: listado de cuentas, inicio OAuth y sync manual.
- `emails`: bandeja reciente con filtros, detalle, categoria, scores, adjuntos y acciones de revision/importancia.
- `alerts`: alertas abiertas por severidad con acciones de resolver o ignorar.
- `analytics`: resumen, categorias, trafico por dia y remitentes top.
- `rules`: reglas automaticas, formulario de creacion rapida, activacion/pausa y conteo de aplicaciones.
- `settings`: tema, idioma, URL de API activa, notificaciones, clasificacion y retencion.

## Normalizacion de contratos

El backend entrega correos con `classification` anidado. El modulo `emails` normaliza esa forma en `EmailApiRepository` para que los paneles reciban `primaryCategory`, `riskScore`, `importanceScore`, `securityScore`, `spamScore` y `actionRequired` como campos directos, manteniendo tambien el objeto `classification` para mostrar explicaciones.

Esta decision deja la presentacion simple y evita duplicar conocimiento del contrato HTTP en componentes React.

## Infraestructura compartida

- `HttpClient`: wrapper POO sobre `fetch`, maneja query params, JSON, errores y token Bearer.
- `BrowserTokenStorage`: guarda y limpia el JWT en `localStorage`.
- `runtimeConfig`: lee `VITE_API_BASE_URL` y define `http://localhost:4000/api` por defecto.
- Componentes base: `NeonButton`, `StatusPill`, `MetricCard` y `SectionPanel`.

## Estilo visual

La UI usa una direccion cyberpunk tipo Tron/gamer:

- Fondo negro con grilla neon.
- Acentos cyan, magenta, verde acido, amber y rojo.
- Paneles densos, orientados a escaneo operativo.
- Botones con iconografia Lucide.
- Layout responsive con sidebar en desktop y navegacion compacta en mobile.

## Reglas de desarrollo

- Todo cambio nace desde `develop` en una rama GitFlow.
- El frontend vive en `frontend/` mientras no exista un repositorio separado.
- No se acopla `fetch` directamente a componentes React.
- Los endpoints nuevos deben agregarse en un repositorio de infraestructura del modulo correspondiente.
- Los cambios visuales se validan con `npm run build` y `npm run lint`.
