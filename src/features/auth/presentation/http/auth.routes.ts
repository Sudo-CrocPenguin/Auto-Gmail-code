import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { AuthController } from "./auth.controller";

export function createAuthRouter(controller: AuthController, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.get("/me", authMiddleware.handler, controller.me);
  router.post("/logout", authMiddleware.handler, controller.logout);

  return router;
}

