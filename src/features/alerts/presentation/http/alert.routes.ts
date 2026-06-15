import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { AlertController } from "./alert.controller";

export function createAlertRouter(controller: AlertController, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.get("/", authMiddleware.handler, controller.list);
  router.get("/:id", authMiddleware.handler, controller.detail);
  router.post("/:id/resolve", authMiddleware.handler, controller.resolve);
  router.post("/:id/ignore", authMiddleware.handler, controller.ignore);

  return router;
}

