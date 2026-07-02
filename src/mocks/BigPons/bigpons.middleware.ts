import { FastifyReply, FastifyRequest } from "fastify";
import { VALID_API_KEYS } from "./bigpons.data";
import { BIGPONS_ERRORS } from "./bigpons.service";

// Extrae la apiKey del body o del querystring (nombre: apiKey).
const extractApiKey = (request: FastifyRequest): string | undefined => {
  const fromBody = (request.body as { apiKey?: string } | undefined)?.apiKey;
  const fromQuery = (request.query as { apiKey?: string } | undefined)?.apiKey;
  return fromBody ?? fromQuery;
};

// preHandler de Fastify: valida que la apiKey esté registrada. Sin apiKey → 403 (10500);
// apiKey no registrada → 400 (10400). Coincide con el comportamiento real (§4).
export const apiKeyMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return reply
      .status(403)
      .send({ errors: [BIGPONS_ERRORS.API_KEY_REQUIRED] });
  }
  if (!VALID_API_KEYS.includes(apiKey)) {
    return reply
      .status(400)
      .send({ errors: [BIGPONS_ERRORS.API_KEY_NOT_REGISTERED] });
  }
};
