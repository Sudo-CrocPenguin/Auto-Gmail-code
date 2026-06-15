import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { SettingsController } from "./settings.controller";

export function createSettingsRouter(
  controller: SettingsController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/", authMiddleware.handler, controller.get);
  router.patch("/", authMiddleware.handler, controller.update);

  return router;
}

