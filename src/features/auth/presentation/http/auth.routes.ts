import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { RateLimitMiddleware } from "../../../../shared/http/middlewares/rate-limit.middleware";
import type { AuthController } from "./auth.controller";

export function createAuthRouter(
  controller: AuthController,
  authMiddleware: AuthMiddleware,
  authRateLimit: RateLimitMiddleware,
): Router {
  const router = Router();

  router.post("/register", controller.register);
  router.post("/login", authRateLimit.handler, controller.login);
  router.get("/me", authMiddleware.handler, controller.me);
  router.post("/logout", authMiddleware.handler, controller.logout);

  return router;
}
