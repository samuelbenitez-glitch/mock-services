import { FastifyReply, FastifyRequest } from "fastify";
import { VALID_API_KEYS } from "./alax.data";
import { ALAX_ERRORS } from "./alax.service";

// Extrae la apiKey indistintamente del body o del querystring (nombre: apiKey).
const extractApiKey = (request: FastifyRequest): string | undefined => {
  const fromBody = (request.body as { apiKey?: string } | undefined)?.apiKey;
  const fromQuery = (request.query as { apiKey?: string } | undefined)?.apiKey;
  return fromBody ?? fromQuery;
};

// preHandler de Fastify: valida que la apiKey enviada esté registrada.
// Responde 400 (10400) si falta o no es válida. Se aplica a los endpoints
// que requieren una Api Key registrada.
export const apiKeyMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const apiKey = extractApiKey(request);

  if (!apiKey || !VALID_API_KEYS.includes(apiKey)) {
    return reply
      .status(400)
      .send({ errors: [ALAX_ERRORS.API_KEY_NOT_REGISTERED] });
  }
};
