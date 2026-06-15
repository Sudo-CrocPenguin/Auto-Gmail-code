import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { AnalyticsController } from "./analytics.controller";

export function createAnalyticsRouter(
  controller: AnalyticsController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/summary", authMiddleware.handler, controller.summary);
  router.get("/emails-by-day", authMiddleware.handler, controller.emailsByDay);
  router.get("/categories", authMiddleware.handler, controller.categories);
  router.get("/top-senders", authMiddleware.handler, controller.topSenders);
  router.get("/accounts", authMiddleware.handler, controller.accounts);

  return router;
}

