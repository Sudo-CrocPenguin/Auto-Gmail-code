import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No existe la ruta ${request.method} ${request.path}.`,
    },
  });
};

