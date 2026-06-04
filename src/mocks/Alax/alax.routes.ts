import { FastifyInstance } from "fastify";
import {
  AlaxController,
  ApiKeyBody,
  ApiKeyQuery,
  CheckDiscountsBody,
  CheckUserBody,
  EshopValidateBody,
  GetDiscountsQuery,
  SaleBody,
  ValidateCouponBody,
} from "./alax.controller";
import { apiKeyMiddleware } from "./alax.middleware";

// Registra todos los endpoints del mock de Alax POS Api Rest.
// Las URLs no llevan namespace/tenant: se montan tal cual en la raíz
// (ej: http://localhost:3101/api/pos/checkApiKey).
//
// El apiKeyMiddleware valida la Api Key (body o querystring) en los endpoints
// que requieren una clave registrada. Quedan exentos:
//   - checkApiKey: devuelve valid_key/403 con su propia lógica.
//   - eshop/validateCoupon: usa api_key y otro esquema de errores (10007).
export const registerAlaxRoutes = (
  server: FastifyInstance,
  controller: AlaxController,
) => {
  // 1. Verificación de Api Key
  server.post<{ Body: ApiKeyBody }>(
    "/api/pos/checkApiKey",
    (request, reply) => controller.checkApiKey(request, reply),
  );

  // 2. Listado de cupones
  server.get<{ Querystring: ApiKeyQuery }>(
    "/api/pos/coupons",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.getCoupons(request, reply),
  );

  // 3. Venta / validación de cupones
  server.post<{ Body: SaleBody }>(
    "/api/pos/sale",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.sale(request, reply),
  );

  // 4. Verificación de cupones (cálculo automático de descuentos)
  server.post<{ Body: CheckDiscountsBody }>(
    "/api/pos/checkDiscounts",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.checkDiscounts(request, reply),
  );

  // 5. Verificación de usuario
  server.post<{ Body: CheckUserBody }>(
    "/api/pos/checkUser",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.checkUser(request, reply),
  );

  // 6. Listado de descuentos activados por cliente
  server.get<{ Querystring: GetDiscountsQuery }>(
    "/api/pos/getDiscountsByDocument",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.getDiscountsByDocument(request, reply),
  );

  // 7. API Eshop (Fenicio)
  server.post<{ Body: EshopValidateBody }>(
    "/api/eshop/validateCoupon",
    (request, reply) => controller.validateEshopCoupon(request, reply),
  );

  // 8. Validar cupón (E-Commerce externos)
  server.post<{ Body: ValidateCouponBody }>(
    "/api/pos/validateCoupon",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.validateCoupon(request, reply),
  );
};
