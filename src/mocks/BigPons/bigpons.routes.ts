import { FastifyInstance } from "fastify";
import {
  ApiKeyBody,
  ApiKeyQuery,
  BigPonsController,
  CheckDiscountsBody,
  CheckUserBody,
  GetDiscountsQuery,
  SaleBody,
} from "./bigpons.controller";
import { apiKeyMiddleware } from "./bigpons.middleware";

// Registra los endpoints del mock de BigPons (IT_ROCKS) POS Integration.
// El prefijo real es "/pos/..." (SIN "/api"): la API real devuelve 403 con "/api/pos".
// Ej: http://localhost:3101/pos/getDiscountsByDocument
//
// apiKeyMiddleware valida la Api Key (body o querystring). checkApiKey queda exento
// (tiene su propia lógica valid_key/403).
export const registerBigPonsRoutes = (
  server: FastifyInstance,
  controller: BigPonsController,
) => {
  // 1. Verificación de Api Key
  server.post<{ Body: ApiKeyBody }>("/pos/checkApiKey", (request, reply) =>
    controller.checkApiKey(request, reply),
  );

  // 2. Verificación de usuario
  server.post<{ Body: CheckUserBody }>(
    "/pos/checkUser",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.checkUser(request, reply),
  );

  // 3. Listado de descuentos activados por cliente
  server.get<{ Querystring: GetDiscountsQuery }>(
    "/pos/getDiscountsByDocument",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.getDiscountsByDocument(request, reply),
  );

  // 4. Listado de cupones activos (falla real: DEPENDENCY_ERROR)
  server.get<{ Querystring: ApiKeyQuery }>(
    "/pos/coupons",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.getCoupons(request, reply),
  );

  // 5. Verificación de cupones
  server.post<{ Body: CheckDiscountsBody }>(
    "/pos/checkDiscounts",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.checkDiscounts(request, reply),
  );

  // 6. Venta / nota de crédito (mismo endpoint)
  server.post<{ Body: SaleBody }>(
    "/pos/sale",
    { preHandler: apiKeyMiddleware },
    (request, reply) => controller.sale(request, reply),
  );
};
