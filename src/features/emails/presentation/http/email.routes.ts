import { Router } from "express";

import type { AuthMiddleware } from "../../../../shared/http/middlewares/auth.middleware";
import type { EmailController } from "./email.controller";

export function createEmailRouter(controller: EmailController, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.get("/", authMiddleware.handler, controller.list);
  router.get("/:id/attachments/:attachmentId", authMiddleware.handler, controller.attachment);
  router.get("/:id", authMiddleware.handler, controller.detail);
  router.patch("/:id/classification", authMiddleware.handler, controller.correctClassification);
  router.post("/:id/mark-reviewed", authMiddleware.handler, controller.markReviewed);
  router.post("/:id/mark-important", authMiddleware.handler, controller.markImportant);

  return router;
}
