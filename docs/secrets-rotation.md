# Rotacion De Secretos

## Que es

La rotacion de secretos es el proceso controlado para cambiar claves sensibles sin perder acceso ni exponer tokens. En este backend los secretos principales son `JWT_SECRET` y `TOKEN_ENCRYPTION_KEY`.

## Para que sirve

Sirve para reducir impacto si un secreto se filtra, cumplir politicas de seguridad y preparar el backend para ambientes productivos.

## Como funciona

### JWT_SECRET

`JWT_SECRET` firma los tokens de sesion propios de la API.

Rotarlo invalida todos los JWT existentes. Procedimiento:

1. Elegir una clave fuerte nueva.
2. Cambiar `JWT_SECRET` en el gestor de secretos.
3. Reiniciar el backend.
4. Pedir a usuarios iniciar sesion nuevamente.

### TOKEN_ENCRYPTION_KEY

`TOKEN_ENCRYPTION_KEY` cifra tokens OAuth Gmail persistidos. Cambiarla sin migracion impide descifrar credenciales guardadas.

Procedimiento seguro recomendado:

1. Mantener la clave actual disponible como `TOKEN_ENCRYPTION_KEY_OLD`.
2. Definir la nueva clave como `TOKEN_ENCRYPTION_KEY`.
3. Ejecutar un script de re-cifrado que:
   - lea cada fila de `gmail_oauth_tokens`,
   - descifre con la clave anterior,
   - cifre con la clave nueva,
   - actualice `updatedAt`,
   - registre conteos y errores sin imprimir tokens.
4. Ejecutar sync de prueba con una cuenta real.
5. Retirar `TOKEN_ENCRYPTION_KEY_OLD`.

## Reglas

- No imprimir secretos ni tokens en logs.
- No guardar `.env` en Git.
- Usar secretos distintos por ambiente.
- Rotar primero en staging.
- Hacer backup de base antes de re-cifrar tokens.

## Estado Actual

El backend bloquea `production` si `JWT_SECRET` o `TOKEN_ENCRYPTION_KEY` usan valores por defecto. Falta implementar el script automatizado de re-cifrado.
