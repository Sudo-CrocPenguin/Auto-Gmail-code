import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { RuleController } from "./rule.controller";

export function createRuleRouter(controller: RuleController, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.get("/", authMiddleware.handler, controller.list);
  router.post("/", authMiddleware.handler, controller.create);
  router.get("/:id", authMiddleware.handler, controller.detail);
  router.patch("/:id", authMiddleware.handler, controller.update);
  router.delete("/:id", authMiddleware.handler, controller.remove);
  router.post("/:id/enable", authMiddleware.handler, controller.enable);
  router.post("/:id/disable", authMiddleware.handler, controller.disable);

  return router;
}

