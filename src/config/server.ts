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

  return server;
};
