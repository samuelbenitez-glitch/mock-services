import { FastifyRequest, FastifyReply } from "fastify";
import {
  OrderStatusUpdateBody,
  PedidosYaService,
} from "./pedidosya.service";

export interface CreateCatalogParams {
  chainCode: string;
}

export interface CreateCatalogBody {
  items?: any[];
  metadata?: any;
}

export interface LoginBody {
  username?: string;
  password?: string;
  grant_type?: string;
}

export interface OrderTokenParams {
  orderToken: string;
}

export interface AdjustPrepTimeBody {
  expectedPickupAt?: string;
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

  // ─────────────────── Ciclo de vida de pedidos (Delivery Hero) ───────────────────

  /** POST /v2/login (application/x-www-form-urlencoded) */
  async login(
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { httpStatus, body } = this.pedidosYaService.login(
        request.body || {},
      );
      return reply.status(httpStatus).send(body);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
    }
  }

  /** POST /v2/order/status/:orderToken */
  async updateOrderStatus(
    request: FastifyRequest<{
      Params: OrderTokenParams;
      Body: OrderStatusUpdateBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderToken } = request.params;
      const { httpStatus, body } = this.pedidosYaService.updateOrderStatus(
        orderToken,
        request.headers.authorization,
        request.body || {},
      );
      return reply.status(httpStatus).send(body);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
    }
  }

  /** POST /v2/orders/:orderToken/preparation-completed */
  async preparationCompleted(
    request: FastifyRequest<{ Params: OrderTokenParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderToken } = request.params;
      const { httpStatus, body } = this.pedidosYaService.preparationCompleted(
        orderToken,
        request.headers.authorization,
      );
      return reply.status(httpStatus).send(body);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
    }
  }

  /** POST /v2/orders/:orderToken/adjust-preparation-time */
  async adjustPreparationTime(
    request: FastifyRequest<{
      Params: OrderTokenParams;
      Body: AdjustPrepTimeBody;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { orderToken } = request.params;
      const { httpStatus, body } = this.pedidosYaService.adjustPreparationTime(
        orderToken,
        request.headers.authorization,
        request.body || {},
      );
      // 204 No Content: no se envía body.
      if (httpStatus === 204) return reply.status(204).send();
      return reply.status(httpStatus).send(body);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
    }
  }
}
