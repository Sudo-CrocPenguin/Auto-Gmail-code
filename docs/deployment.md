# Despliegue backend

## Que es

Esta guia describe como ejecutar el backend de Auto-Gmail-code en un entorno preparado para la primera version desplegable. El backend corre con Node.js, Prisma y PostgreSQL, y expone la API HTTP para administrar una o mas cuentas Gmail conectadas por OAuth.

## Para que sirve

Sirve para levantar la API con persistencia real, aplicar migraciones, validar healthchecks y definir una base operativa de backups/restauracion. El objetivo es que el frontend consuma un backend estable y que el despliegue sea repetible.

## Variables obligatorias

En produccion deben existir:

```txt
NODE_ENV=production
PERSISTENCE_DRIVER=prisma
DATABASE_URL=postgresql://...
JWT_SECRET=<secreto-fuerte>
TOKEN_ENCRYPTION_KEY=<clave-fuerte>
FRONTEND_URL=https://...
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=https://<api-host>/api/gmail/oauth/callback
```

El backend no arranca en `production` si `JWT_SECRET` o `TOKEN_ENCRYPTION_KEY` usan valores por defecto, si falta `DATABASE_URL` o si `PERSISTENCE_DRIVER` no es `prisma`.

## Despliegue con Docker Compose

Para desarrollo o staging local con PostgreSQL:

```bash
docker compose up --build
```

Aplicar migraciones:

```bash
docker compose exec api npm run db:deploy
```

Crear datos demo si aplica:

```bash
docker compose exec api npm run db:seed
```

Verificar healthcheck:

```bash
curl http://localhost:4000/api/health
```

Verificar readiness:

```bash
curl http://localhost:4000/api/health/ready
```

`/api/health` solo confirma que el proceso HTTP responde. `/api/health/ready` valida PostgreSQL cuando se usa Prisma y confirma si las credenciales OAuth Gmail estan configuradas. En `production`, una configuracion Gmail incompleta aparece como error de readiness.

Ejecutar suite Prisma contra la base de Compose:

```bash
docker compose exec -T postgres createdb -U postgres auto_gmail_code_test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run db:deploy
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run db:seed
PRISMA_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run test:prisma
```

## Despliegue sin Docker

Instalar dependencias y generar cliente Prisma:

```bash
npm ci
npm run db:generate
```

Compilar:

```bash
npm run build
```

Aplicar migraciones:

```bash
npm run db:deploy
```

Arrancar:

```bash
npm start
```

## Migraciones

Las migraciones viven en `prisma/migrations`.

Reglas:

- En desarrollo se puede usar `npm run db:migrate`.
- En produccion usar `npm run db:deploy`.
- No modificar migraciones ya aplicadas en entornos compartidos.
- Crear una migracion nueva para cada cambio de schema.

## Backups PostgreSQL

Backup logico recomendado:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backup-auto-gmail-code.dump
```

Restauracion en una base vacia:

```bash
pg_restore --dbname "$DATABASE_URL" --clean --if-exists backup-auto-gmail-code.dump
```

Frecuencia recomendada para primera version:

- Diario para entornos con datos reales.
- Antes de aplicar migraciones.
- Antes de rotar `TOKEN_ENCRYPTION_KEY`.

## Rotacion de secretos

`JWT_SECRET` puede rotarse invalidando sesiones activas. `TOKEN_ENCRYPTION_KEY` requiere estrategia de re-cifrado porque protege tokens OAuth Gmail persistidos. No cambiar `TOKEN_ENCRYPTION_KEY` en produccion sin migrar o volver a conectar cuentas Gmail.

## Healthcheck

Endpoints publicos:

```txt
GET /api/health
GET /api/health/ready
```

Respuesta esperada para `/api/health`:

```json
{
  "status": "ok",
  "service": "auto-gmail-code-api",
  "timestamp": "2026-06-16T00:00:00.000Z"
}
```

Respuesta esperada para `/api/health/ready`:

```json
{
  "status": "ok",
  "service": "auto-gmail-code-api",
  "timestamp": "2026-06-16T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "ok",
      "detail": "Prisma pudo consultar PostgreSQL."
    },
    "gmailOAuth": {
      "status": "ok",
      "detail": "OAuth Gmail configurado."
    }
  }
}
```
