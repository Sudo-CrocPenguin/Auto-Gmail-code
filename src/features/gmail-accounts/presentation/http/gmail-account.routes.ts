import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { GmailAccountController } from "./gmail-account.controller";

export function createGmailAccountRouter(
  controller: GmailAccountController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/accounts", authMiddleware.handler, controller.list);
  router.post("/oauth/start", authMiddleware.handler, controller.startOAuth);
  router.get("/oauth/status", authMiddleware.handler, controller.oauthStatus);
  router.get("/oauth/callback", controller.oauthCallback);
  router.post("/accounts/:id/sync", authMiddleware.handler, controller.sync);
  router.post("/accounts/:id/reconnect", authMiddleware.handler, controller.reconnect);
  router.delete("/accounts/:id", authMiddleware.handler, controller.disconnect);

  return router;
}
