import Fastify, { FastifyInstance } from "fastify";

export const createServer = (): FastifyInstance => {
  const server = Fastify({
    // Permite que /api/pos/checkDiscounts y /api/pos/checkDiscounts/ resuelvan igual.
    ignoreTrailingSlash: true,
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
  });

  // Parser para application/x-www-form-urlencoded (lo requiere el POST /v2/login de
  // PedidosYa / Delivery Hero). Fastify no lo trae por defecto. Convierte el body en un
  // objeto plano { campo: valor } usando URLSearchParams.
  server.addContentTypeParser(
    "application/x-www-form-urlencoded",
    { parseAs: "string" },
    (_request, body, done) => {
      try {
        const parsed = Object.fromEntries(
          new URLSearchParams(body as string),
        );
        done(null, parsed);
      } catch (error) {
        done(error as Error);
      }
    },
  );

  return server;
};
