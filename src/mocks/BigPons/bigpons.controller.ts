import { FastifyReply, FastifyRequest } from "fastify";
import { BigPonsApiError, BigPonsService } from "./bigpons.service";
import { RequestedDiscount, SaleItem } from "./bigpons.types";

// ---- Tipos de request ----
export interface ApiKeyBody {
  apiKey?: string;
}

export interface ApiKeyQuery {
  apiKey?: string;
}

export interface CheckUserBody {
  apiKey?: string;
  dni?: string | number;
}

export interface GetDiscountsQuery {
  apiKey?: string;
  dni?: string;
}

export interface CheckDiscountsBody {
  apiKey?: string;
  dni?: string | number;
  items?: SaleItem[];
  discounts?: RequestedDiscount[];
  add_user_discounts?: boolean;
}

export interface SaleBody {
  apiKey?: string;
  dni?: string | number;
  isDelivery?: boolean;
  ticket?: string;
  items?: SaleItem[];
  discounts?: RequestedDiscount[];
}

export class BigPonsController {
  constructor(private bigPonsService: BigPonsService) {}

  // Convierte BigPonsApiError en respuesta HTTP { errors: [...] }. Otros errores se
  // relanzan para el middleware global (log a archivo).
  private handleError(
    _request: FastifyRequest,
    reply: FastifyReply,
    error: unknown,
  ) {
    if (error instanceof BigPonsApiError) {
      return reply.status(error.status).send({ errors: [error.error] });
    }
    throw error;
  }

  // ---- 1. POST /pos/checkApiKey ----
  async checkApiKey(
    request: FastifyRequest<{ Body: ApiKeyBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey } = request.body ?? {};
      return reply.status(200).send(this.bigPonsService.checkApiKey(apiKey));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 2. POST /pos/checkUser ----
  async checkUser(
    request: FastifyRequest<{ Body: CheckUserBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey, dni } = request.body ?? {};
      return reply.status(200).send(this.bigPonsService.checkUser(apiKey, dni));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 3. GET /pos/getDiscountsByDocument ----
  async getDiscountsByDocument(
    request: FastifyRequest<{ Querystring: GetDiscountsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey, dni } = request.query ?? {};
      return reply
        .status(200)
        .send(this.bigPonsService.getDiscountsByDocument(apiKey, dni));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 4. GET /pos/coupons (falla real: DEPENDENCY_ERROR) ----
  async getCoupons(
    request: FastifyRequest<{ Querystring: ApiKeyQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey } = request.query ?? {};
      return reply.status(200).send(this.bigPonsService.getCoupons(apiKey));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 5. POST /pos/checkDiscounts ----
  async checkDiscounts(
    request: FastifyRequest<{ Body: CheckDiscountsBody }>,
    reply: FastifyReply,
  ) {
    try {
      return reply
        .status(200)
        .send(this.bigPonsService.checkDiscounts(request.body ?? {}));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 6. POST /pos/sale ----
  async sale(request: FastifyRequest<{ Body: SaleBody }>, reply: FastifyReply) {
    try {
      return reply.status(200).send(this.bigPonsService.sale(request.body ?? {}));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }
}
