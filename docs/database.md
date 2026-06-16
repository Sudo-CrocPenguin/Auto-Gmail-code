# Base de datos

## Que es

La primera version robusta del backend soporta PostgreSQL usando Prisma. La persistencia real se activa con `PERSISTENCE_DRIVER=prisma`.

## Para que sirve

Permite conservar usuarios, workspaces, tokens Gmail cifrados, cuentas conectadas, correos sincronizados, alertas, remitentes, reglas, settings y auditoria aunque el servidor se reinicie.

## Como funciona

Configura `.env`:

```txt
PERSISTENCE_DRIVER=prisma
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code?schema=public
```

Inicializa Prisma:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Arranca backend:

```bash
npm run dev
```

## Migraciones

La migracion inicial esta en:

```txt
prisma/migrations/20260615190000_initial_schema/migration.sql
```

La migracion de logs de sincronizacion Gmail esta en:

```txt
prisma/migrations/20260616153000_add_gmail_sync_logs/migration.sql
```

La tabla `gmail_sync_logs` guarda el resultado operativo de cada sincronizacion por cuenta Gmail: estado, tiempos, conteos, error y metadata. Sirve para que la UI muestre historial, fallos y avances sin depender solo de auditoria.

Para entornos productivos:

```bash
npm run db:deploy
```

## Tests Prisma

Existe una suite dedicada para validar repositorios Prisma contra una base real. No se ejecuta dentro de `npm test`; se invoca de forma explicita cuando existe una base de pruebas disponible.

```bash
PRISMA_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run db:deploy
PRISMA_TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auto_gmail_code_test?schema=public npm run test:prisma
```

La base debe estar creada antes de ejecutar la suite. Esta prueba cubre persistencia de workspace, usuario, settings, cuenta Gmail, token OAuth, logs de sync, reglas y auditoria.
