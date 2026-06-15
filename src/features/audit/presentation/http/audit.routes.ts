import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { AuditController } from "./audit.controller";

export function createAuditRouter(controller: AuditController, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.get("/", authMiddleware.handler, controller.list);

  return router;
}

