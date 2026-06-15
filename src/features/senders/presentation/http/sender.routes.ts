import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { SenderController } from "./sender.controller";

export function createSenderRouter(controller: SenderController, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.get("/", authMiddleware.handler, controller.list);
  router.get("/:id", authMiddleware.handler, controller.detail);
  router.post("/:id/trust", authMiddleware.handler, controller.trust);
  router.post("/:id/suspicious", authMiddleware.handler, controller.suspicious);
  router.get("/:id/emails", authMiddleware.handler, controller.emails);

  return router;
}

