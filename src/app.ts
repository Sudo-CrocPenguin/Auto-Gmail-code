import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { environment } from "./shared/config/environment";
import { buildContainer, type ApplicationContainer } from "./shared/container";
import { errorHandler } from "./shared/http/middlewares/error-handler.middleware";
import { notFoundHandler } from "./shared/http/middlewares/not-found.middleware";
import { healthRouter } from "./shared/http/routes/health.routes";
import { openApiRouter } from "./shared/http/routes/openapi.routes";

export function createApp(container: ApplicationContainer = buildContainer()): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: environment.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  if (environment.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  app.use(`${environment.apiPrefix}/health`, healthRouter);
  app.use(`${environment.apiPrefix}/openapi.json`, openApiRouter);
  app.use(`${environment.apiPrefix}/auth`, container.routes.auth);
  app.use(`${environment.apiPrefix}/workspaces`, container.routes.workspace);
  app.use(`${environment.apiPrefix}/gmail`, container.routes.gmail);
  app.use(`${environment.apiPrefix}/emails`, container.routes.emails);
  app.use(`${environment.apiPrefix}/alerts`, container.routes.alerts);
  app.use(`${environment.apiPrefix}/senders`, container.routes.senders);
  app.use(`${environment.apiPrefix}/rules`, container.routes.rules);
  app.use(`${environment.apiPrefix}/analytics`, container.routes.analytics);
  app.use(`${environment.apiPrefix}/audit`, container.routes.audit);
  app.use(`${environment.apiPrefix}/settings`, container.routes.settings);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
