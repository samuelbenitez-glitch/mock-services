import { FastifyRequest, FastifyReply } from "fastify";
import { PedidosYaService } from "./pedidosya.service";

export interface CreateCatalogParams {
  chainCode: string;
}

export interface CreateCatalogBody {
  items?: any[];
  metadata?: any;
}

export class PedidosYaController {
  constructor(private pedidosYaService: PedidosYaService) {}

  async createCatalog(
    request: FastifyRequest<{
      Params: CreateCatalogParams;
      Body: CreateCatalogBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      //   return reply.status(500).send({
      //     success: false,
      //     error: "Internal server error",
      //   });

      const { chainCode } = request.params;
      const catalogData = request.body;

      const catalog = await this.pedidosYaService.createCatalog(
        chainCode,
        catalogData,
      );

      return reply.status(201).send({
        success: true,
        data: catalog,
        message: `Catalog created/updated for chain: ${chainCode}`,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async getCatalog(
    request: FastifyRequest<{
      Params: CreateCatalogParams;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { chainCode } = request.params;
      const catalog = await this.pedidosYaService.getCatalog(chainCode);

      return reply.status(200).send({
        success: true,
        data: catalog,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
