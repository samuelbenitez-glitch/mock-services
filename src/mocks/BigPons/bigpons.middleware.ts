import { FastifyReply, FastifyRequest } from "fastify";

// preHandler de Fastify: en esta versión simplificada NO se valida la Api Key.
// Se deja el middleware (no-op) para no tener que modificar el registro de rutas;
// cualquier token (o su ausencia) pasa sin error.
export const apiKeyMiddleware = async (
  _request: FastifyRequest,
  _reply: FastifyReply,
) => {
  // Sin validación: pasa siempre.
};
