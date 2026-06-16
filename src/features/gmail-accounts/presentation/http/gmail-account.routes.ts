import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { RateLimitMiddleware } from "../../../../shared/http/middlewares/rate-limit.middleware";
import type { GmailAccountController } from "./gmail-account.controller";

export function createGmailAccountRouter(
  controller: GmailAccountController,
  authMiddleware: AuthMiddleware,
  gmailRateLimit: RateLimitMiddleware,
  syncRateLimit: RateLimitMiddleware,
): Router {
  const router = Router();

  router.get("/accounts", authMiddleware.handler, gmailRateLimit.handler, controller.list);
  router.post("/oauth/start", authMiddleware.handler, gmailRateLimit.handler, controller.startOAuth);
  router.get("/oauth/status", authMiddleware.handler, gmailRateLimit.handler, controller.oauthStatus);
  router.get("/oauth/callback", controller.oauthCallback);
  router.get("/accounts/:id/sync-logs", authMiddleware.handler, gmailRateLimit.handler, controller.listSyncLogs);
  router.get("/accounts/:id/sync-logs/:logId", authMiddleware.handler, gmailRateLimit.handler, controller.syncLogDetail);
  router.post("/accounts/:id/sync", authMiddleware.handler, syncRateLimit.handler, controller.sync);
  router.post("/accounts/:id/reconnect", authMiddleware.handler, gmailRateLimit.handler, controller.reconnect);
  router.delete("/accounts/:id", authMiddleware.handler, gmailRateLimit.handler, controller.disconnect);

  return router;
}
