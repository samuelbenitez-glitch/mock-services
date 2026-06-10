import { FastifyInstance } from "fastify";
import { Logger } from "./logger";

// Middleware global de logueo de peticiones.
// Loguea SIEMPRE al archivo (servicio de log por archivo, no console.log):
//   - la URL consultada (método + url)
//   - el body de la petición, si hubiera
// Se registra como hook preHandler para que el body ya esté parseado.
export const registerRequestLogger = (
  server: FastifyInstance,
  logger: Logger,
) => {
  server.addHook("preHandler", async (request) => {
    const hasBody =
      request.body !== undefined &&
      request.body !== null &&
      !(typeof request.body === "object" && Object.keys(request.body).length === 0);

    logger.info(
      {
        method: request.method,
        url: request.url,
        ...(hasBody ? { body: request.body } : {}),
      },
      `Petición recibida: ${request.method} ${request.url}`,
    );
  });
};
