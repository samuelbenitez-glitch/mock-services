import { FastifyReply, FastifyRequest } from "fastify";
import { AlaxApiError, AlaxService } from "./alax.service";
import { RequestedDiscount, SaleItem } from "./alax.types";

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

export interface SaleBody {
  apiKey?: string;
  dni?: string | number;
  isDelivery?: boolean;
  ticket?: string;
  items?: SaleItem[];
  discounts?: RequestedDiscount[];
}

export interface CheckDiscountsBody {
  apiKey?: string;
  dni?: string | number;
  items?: SaleItem[];
  discounts?: RequestedDiscount[];
  add_user_discounts?: boolean;
}

export interface EshopValidateBody {
  api_key?: string;
  coupon_code?: string;
  amount?: number;
}

export interface ValidateCouponBody {
  apiKey?: string;
  coupon_code?: string;
}

export class AlaxController {
  constructor(private alaxService: AlaxService) {}

  // Convierte errores de negocio en respuestas HTTP. AlaxApiError lleva su
  // propio status. Cualquier otro error (inesperado) se relanza para que lo
  // capture el middleware global de errores, que lo loguea a archivo.
  private handleError(_request: FastifyRequest, reply: FastifyReply, error: unknown) {
    if (error instanceof AlaxApiError) {
      return reply.status(error.status).send({ errors: [error.error] });
    }
    throw error;
  }

  // ---- 1. POST /api/pos/checkApiKey ----
  async checkApiKey(
    request: FastifyRequest<{ Body: ApiKeyBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey } = request.body ?? {};
      return reply.status(200).send(this.alaxService.checkApiKey(apiKey));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 2. GET /api/pos/coupons ----
  async getCoupons(
    request: FastifyRequest<{ Querystring: ApiKeyQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey } = request.query ?? {};
      return reply.status(200).send(this.alaxService.getCoupons(apiKey));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 3. POST /api/pos/sale ----
  async sale(request: FastifyRequest<{ Body: SaleBody }>, reply: FastifyReply) {
    try {
      return reply.status(200).send(this.alaxService.sale(request.body ?? {}));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 4. POST /api/pos/checkDiscounts ----
  async checkDiscounts(
    request: FastifyRequest<{ Body: CheckDiscountsBody }>,
    reply: FastifyReply,
  ) {
    try {
      return reply
        .status(200)
        .send(this.alaxService.checkDiscounts(request.body ?? {}));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 5. POST /api/pos/checkUser ----
  async checkUser(
    request: FastifyRequest<{ Body: CheckUserBody }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey, dni } = request.body ?? {};
      return reply.status(200).send(this.alaxService.checkUser(apiKey, dni));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 6. GET /api/pos/getDiscountsByDocument ----
  async getDiscountsByDocument(
    request: FastifyRequest<{ Querystring: GetDiscountsQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { apiKey, dni } = request.query ?? {};
      return reply
        .status(200)
        .send(this.alaxService.getDiscountsByDocument(apiKey, dni));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 7. POST /api/eshop/validateCoupon ----
  async validateEshopCoupon(
    request: FastifyRequest<{ Body: EshopValidateBody }>,
    reply: FastifyReply,
  ) {
    try {
      return reply
        .status(200)
        .send(this.alaxService.validateEshopCoupon(request.body ?? {}));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }

  // ---- 8. POST /api/pos/validateCoupon ----
  async validateCoupon(
    request: FastifyRequest<{ Body: ValidateCouponBody }>,
    reply: FastifyReply,
  ) {
    try {
      return reply
        .status(200)
        .send(this.alaxService.validateCoupon(request.body ?? {}));
    } catch (error) {
      return this.handleError(request, reply, error);
    }
  }
}
