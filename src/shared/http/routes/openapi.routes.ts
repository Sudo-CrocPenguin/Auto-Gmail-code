import { Router } from "express";

import { openApiDocument } from "../openapi/openapi-document";

export const openApiRouter = Router();

openApiRouter.get("/", (_request, response) => {
  response.json(openApiDocument);
});

