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

// Registra los endpoints del mock de BigPons (IT_ROCKS) POS Integration.
// El prefijo real es "/pos/..." (SIN "/api"): la API real devuelve 403 con "/api/pos".
// Ej: http://localhost:3101/pos/getDiscountsByDocument
//
// Versión simplificada: NINGÚN endpoint valida Api Key ni DNI. Cualquier token y
// cualquier documento operan igual (no hay preHandler de validación).
export const registerBigPonsRoutes = (
  server: FastifyInstance,
  controller: BigPonsController,
) => {
  // 1. Verificación de Api Key (siempre valid_key: true)
  server.post<{ Body: ApiKeyBody }>("/pos/checkApiKey", (request, reply) =>
    controller.checkApiKey(request, reply),
  );

  // 2. Verificación de usuario (siempre devuelve usuario mock)
  server.post<{ Body: CheckUserBody }>("/pos/checkUser", (request, reply) =>
    controller.checkUser(request, reply),
  );

  // 3. Listado de descuentos activados por cliente
  server.get<{ Querystring: GetDiscountsQuery }>(
    "/pos/getDiscountsByDocument",
    (request, reply) => controller.getDiscountsByDocument(request, reply),
  );

  // 4. Listado de cupones activos
  server.get<{ Querystring: ApiKeyQuery }>("/pos/coupons", (request, reply) =>
    controller.getCoupons(request, reply),
  );

  // 5. Verificación de cupones
  server.post<{ Body: CheckDiscountsBody }>(
    "/pos/checkDiscounts",
    (request, reply) => controller.checkDiscounts(request, reply),
  );

  // 6. Venta / nota de crédito (mismo endpoint)
  server.post<{ Body: SaleBody }>("/pos/sale", (request, reply) =>
    controller.sale(request, reply),
  );
};
