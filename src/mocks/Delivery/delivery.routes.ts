import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { DeliveryController } from "./delivery.controller";

// Registra el endpoint de recepcion de pedidos del mock Delivery.
// Espeja el endpoint real POST /ubereats/pedido del api-delivery (Spring Boot).
// Ej: http://localhost:3101/ubereats/pedido
//
// Version simplificada: NO valida la firma X-Uber-Signature. Solo loguea el body
// y los headers y siempre responde 200.
export const registerDeliveryRoutes = (
  server: FastifyInstance,
  controller: DeliveryController,
) => {
  server.post(
    "/ubereats/pedido",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.crearPedido(request, reply);
    },
  );
};
