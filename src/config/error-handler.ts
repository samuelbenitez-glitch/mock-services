import { FastifyInstance } from "fastify";
import { Logger } from "./logger";

// Middleware global de captura de errores.
// Loguea SIEMPRE al archivo (servicio de log por archivo, no console.log):
//   - la URL llamada (método + url)
//   - el body de la petición, si hubiera
//   - el stack trace del error
// y responde con el formato de error estándar de la API.
export const registerErrorHandler = (
  server: FastifyInstance,
  logger: Logger,
) => {
  server.setErrorHandler((error, request, reply) => {
    logger.error(
      {
        method: request.method,
        url: request.url,
        body: request.body ?? null,
        stack: error.stack,
      },
      `Error no controlado: ${error.message}`,
    );

    const status =
      typeof error.statusCode === "number" && error.statusCode >= 400
        ? error.statusCode
        : 500;

    return reply.status(status).send({
      errors: [
        {
          code: "10000",
          msg: status >= 500 ? "Internal server error" : error.message,
        },
      ],
    });
  });
};
