import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { UserController } from "./user.controller";

export function createUserRouter(
  controller: UserController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.patch("/me", authMiddleware.handler, controller.updateMe);

  return router;
}
