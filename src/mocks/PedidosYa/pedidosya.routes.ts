import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  CreateCatalogBody,
  CreateCatalogParams,
  PedidosYaController,
} from "./pedidosya.controller";

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
};
