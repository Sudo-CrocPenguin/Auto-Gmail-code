# Runbook De Errores Gmail

## Que es

Este runbook define como interpretar fallos operativos de Gmail API durante OAuth, sincronizacion, adjuntos y reconexion.

## Para que sirve

Sirve para soporte y desarrollo: indica que estado esperar en la cuenta, que alerta se genera y que accion tomar sin revisar codigo fuente.

## Como funciona

El backend traduce errores comunes de Gmail a estados de cuenta, auditoria, alertas y logs de sincronizacion.

| Error Gmail | Estado cuenta | Auditoria | Alerta | Accion operativa |
| --- | --- | --- | --- | --- |
| `invalid_grant`, token revocado o expirado | `RECONNECT_REQUIRED` | `GMAIL_RECONNECT_REQUIRED` | `ACCOUNT_RECONNECT_REQUIRED` | Pedir al usuario reconectar la cuenta. |
| `userRateLimitExceeded` | `ERROR` | `GMAIL_SYNC_RATE_LIMITED` | `SYNC_ERROR` | Esperar unos minutos y reintentar. |
| `rateLimitExceeded` | `ERROR` | `GMAIL_SYNC_RATE_LIMITED` | `SYNC_ERROR` | Revisar frecuencia de sync y cuota. |
| `quotaExceeded` | `ERROR` | `GMAIL_SYNC_QUOTA_EXCEEDED` | `SYNC_ERROR` | Revisar cuotas de Google Cloud. |
| `historyId` no recuperable | `ERROR` | `GMAIL_HISTORY_NOT_FOUND` | No siempre | Ejecutar sync reciente o inicial nuevamente. |

## Flujo De Reconexion

1. La UI detecta cuenta `RECONNECT_REQUIRED`.
2. El usuario ejecuta reconexion:

```txt
POST /api/gmail/accounts/:id/reconnect
```

3. La UI abre `data.authUrl`.
4. Google redirige al callback.
5. El backend guarda tokens cifrados nuevos y deja la cuenta `CONNECTED`.
6. Ejecutar sync manual:

```txt
POST /api/gmail/accounts/:id/sync
```

## Evidencia A Revisar

- `GET /api/gmail/accounts/:id/sync-logs`
- `GET /api/alerts?type=ACCOUNT_RECONNECT_REQUIRED`
- `GET /api/audit?action=GMAIL_RECONNECT_REQUIRED`

## Pendiente Operativo

Todavia falta backoff automatico por cuenta y politica de reintentos diferidos. Por ahora el reintento es manual.
