import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  AdjustPrepTimeBody,
  CreateCatalogBody,
  CreateCatalogParams,
  LoginBody,
  OrderTokenParams,
  PedidosYaController,
} from "./pedidosya.controller";
import { OrderStatusUpdateBody } from "./pedidosya.service";

export const registerPedidosYaRoutes = (
  server: FastifyInstance,
  controller: PedidosYaController,
) => {
  // PUT endpoint para crear/actualizar catálogo
  server.put(
    "/v2/chains/:chainCode/catalog",
    async (
      request: FastifyRequest<{
        Params: CreateCatalogParams;
        Body: CreateCatalogBody;
      }>,
      reply: FastifyReply,
    ) => {
      return controller.createCatalog(request, reply);
    },
  );

  // GET endpoint para obtener catálogo (adicional)
  server.get(
    "/v2/chains/:chainCode/catalog",
    async (
      request: FastifyRequest<{ Params: CreateCatalogParams }>,
      reply: FastifyReply,
    ) => {
      return controller.getCatalog(request, reply);
    },
  );

  // ─────────── Ciclo de vida de pedidos (Integration Middleware / Delivery Hero) ───────────

  // POST /v2/login — auth (application/x-www-form-urlencoded)
  server.post(
    "/v2/login",
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      return controller.login(request, reply);
    },
  );

  // POST /v2/order/status/:orderToken — tomar (order_accepted) / rechazar (order_rejected) / listo (order_picked_up)
  server.post(
    "/v2/order/status/:orderToken",
    async (
      request: FastifyRequest<{
        Params: OrderTokenParams;
        Body: OrderStatusUpdateBody;
      }>,
      reply: FastifyReply,
    ) => {
      return controller.updateOrderStatus(request, reply);
    },
  );

  // POST /v2/orders/:orderToken/preparation-completed — marcar preparado (rider Delivery Hero)
  server.post(
    "/v2/orders/:orderToken/preparation-completed",
    async (
      request: FastifyRequest<{ Params: OrderTokenParams }>,
      reply: FastifyReply,
    ) => {
      return controller.preparationCompleted(request, reply);
    },
  );

  // POST /v2/orders/:orderToken/adjust-preparation-time — ajustar tiempo de preparación (logistics)
  server.post(
    "/v2/orders/:orderToken/adjust-preparation-time",
    async (
      request: FastifyRequest<{
        Params: OrderTokenParams;
        Body: AdjustPrepTimeBody;
      }>,
      reply: FastifyReply,
    ) => {
      return controller.adjustPreparationTime(request, reply);
    },
  );
};
