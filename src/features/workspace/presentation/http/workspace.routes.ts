import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { WorkspaceController } from "./workspace.controller";

export function createWorkspaceRouter(
  controller: WorkspaceController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/current", authMiddleware.handler, controller.getCurrent);
  router.patch("/current", authMiddleware.handler, controller.updateCurrent);

  return router;
}

