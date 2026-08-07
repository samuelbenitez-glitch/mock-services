import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { OrderParams, UberEatsController } from "./ubereats.controller";

export const registerUberEatsRoutes = (
  server: FastifyInstance,
  controller: UberEatsController,
) => {
  // POST login OAuth. No valida nada de lo recibido, siempre devuelve un token fijo.
  server.post(
    "/oauth/v2/token",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.login(request, reply);
    },
  );

  // GET detalle de la orden. No valida ninguna cabecera.
  server.get(
    "/v1/delivery/order/:orderId",
    async (
      request: FastifyRequest<{ Params: OrderParams }>,
      reply: FastifyReply,
    ) => {
      return controller.getOrder(request, reply);
    },
  );
};
