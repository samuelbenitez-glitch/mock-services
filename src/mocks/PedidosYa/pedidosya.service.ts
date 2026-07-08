import { Logger } from "../../config/logger";

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface Catalog {
  chainCode: string;
  items: CatalogItem[];
  totalItems: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ciclo de vida de pedidos — Integration Middleware Plugins API (Delivery Hero)
// Referencia: middlewareExternalApi.yaml + shared-components.yaml
//   POST /v2/login                          (auth, form-urlencoded)
//   POST /v2/order/status/{orderToken}       (order_accepted | order_rejected | order_picked_up)
//   POST /v2/orders/{orderToken}/preparation-completed
//   POST /v2/orders/{orderToken}/adjust-preparation-time
// ─────────────────────────────────────────────────────────────────────────────

/** Credenciales válidas del mock (mismas que usa el cron en staging, .env.test/.env.prod). */
export const MOCK_CREDENTIALS = {
  username: "stg03-plugin-maxisistemas-srl-001",
  password: "iRrI7x4q28",
};

/** Estados de orden aceptados por el endpoint /v2/order/status/{orderToken}. */
export const ORDER_STATUSES = [
  "order_accepted",
  "order_rejected",
  "order_picked_up",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Enum completo de razones de rechazo válidas (24 valores). Fuente: shared-components.yaml. */
export const REJECT_REASONS = [
  "ADDRESS_INCOMPLETE_MISSTATED",
  "BAD_WEATHER",
  "BLACKLISTED",
  "CARD_READER_NOT_AVAILABLE",
  "CLOSED",
  "CONTENT_WRONG_MISLEADING",
  "FOOD_QUALITY_SPILLAGE",
  "FRAUD_PRANK",
  "ITEM_UNAVAILABLE",
  "LATE_DELIVERY",
  "MENU_ACCOUNT_SETTINGS",
  "MOV_NOT_REACHED",
  "NO_COURIER",
  "NO_PICKER",
  "NO_RESPONSE",
  "OUTSIDE_DELIVERY_AREA",
  "TECHNICAL_PROBLEM",
  "TEST_ORDER",
  "TOO_BUSY",
  "UNABLE_TO_FIND",
  "UNABLE_TO_PAY",
  "UNPROFESSIONAL_BEHAVIOUR",
  "WILL_NOT_WORK_WITH_PLATFORM",
  "WRONG_ORDER_ITEMS_DELIVERED",
] as const;

/** Body del /v2/order/status/{orderToken} (los campos varían según status). */
export interface OrderStatusUpdateBody {
  status?: string;
  acceptanceTime?: string;
  remoteOrderId?: string;
  message?: string;
  reason?: string;
  modifications?: unknown;
}

/** Respuesta unificada del service: httpStatus + body. El controller solo la relaya. */
export interface MockResponse {
  httpStatus: number;
  body: unknown;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class PedidosYaService {
  constructor(private logger: Logger) {}

  private mockCatalogData: Record<string, CatalogItem[]> = {
    CHAIN001: [
      {
        id: "1",
        name: "Hamburguesa Clásica",
        description: "Hamburguesa con carne, lechuga, tomate y queso",
        price: 850,
        category: "Hamburguesas",
        available: true,
      },
      {
        id: "2",
        name: "Pizza Margherita",
        description: "Pizza con salsa de tomate, mozzarella y albahaca",
        price: 1200,
        category: "Pizzas",
        available: true,
      },
      {
        id: "3",
        name: "Ensalada César",
        description: "Lechuga romana, pollo, crutones y aderezo césar",
        price: 650,
        category: "Ensaladas",
        available: true,
      },
    ],
    CHAIN002: [
      {
        id: "4",
        name: "Sushi Roll California",
        description: "Roll de salmón, palta y queso crema",
        price: 1450,
        category: "Sushi",
        available: true,
      },
      {
        id: "5",
        name: "Ramen Tonkotsu",
        description: "Fideos en caldo de cerdo con cerdo chashu",
        price: 1350,
        category: "Ramen",
        available: true,
      },
    ],
  };

  async getCatalog(chainCode: string): Promise<Catalog> {
    const items = this.mockCatalogData[chainCode] || [];

    return {
      chainCode,
      items,
      totalItems: items.length,
    };
  }

  async createCatalog(chainCode: string, catalogData: any): Promise<Catalog> {
    // Simulación de creación/actualización de catálogo
    this.logger.info(
      {
        chainCode,
        catalogData: catalogData,
      },
      "Creating/updating catalog",
    );

    // En un escenario real, aquí se guardaría en base de datos
    // Por ahora solo retornamos los datos mockeados existentes o creamos uno nuevo
    const items = this.mockCatalogData[chainCode] || [];

    return {
      chainCode,
      items,
      totalItems: items.length,
    };
  }

  // ───────────────────────────── Auth ─────────────────────────────

  /**
   * POST /v2/login — grant_type=client_credentials. Valida username/password.
   * Devuelve un access_token mockeado (formato JWT-like) + token_type "bearer" + expires_in.
   */
  login(body: {
    username?: string;
    password?: string;
    grant_type?: string;
  }): MockResponse {
    const { username, password, grant_type } = body || {};

    if (grant_type !== "client_credentials") {
      return this.error(400, "INVALID_REQUEST", "grant_type debe ser client_credentials");
    }
    if (
      username !== MOCK_CREDENTIALS.username ||
      password !== MOCK_CREDENTIALS.password
    ) {
      this.logger.info({ username }, "PEYA mock: credenciales inválidas");
      return this.error(401, "UNAUTHORIZED", "Credenciales inválidas");
    }

    const result: LoginResult = {
      access_token: this.fakeJwt(username),
      token_type: "bearer",
      expires_in: 1800,
    };
    this.logger.info({ username }, "PEYA mock: login OK, token emitido");
    return { httpStatus: 200, body: result };
  }

  // ─────────────────────── Order status update ───────────────────────

  /**
   * POST /v2/order/status/{orderToken}. Valida auth y body según el `status`.
   *
   * Simulación de casos de error por convención en el orderToken (para QA):
   *   *NOTFOUND*            → 400 ORDER_NOT_FOUND
   *   *CONFLICT_RETRY*      → 409 currentState WAITING_FOR_ACKNOWLEDGEMENT (reintentable)
   *   *CONFLICT_CANCELLED*  → 409 currentState CANCELLED (NO reintentable)
   *   *FORBIDDEN*           → 403 FORBIDDEN (p.ej. integración indirecta)
   *   *SERVERERROR*         → 500 INTERNAL_ERROR
   *   (cualquier otro)      → 200 OK
   */
  updateOrderStatus(
    orderToken: string,
    authHeader: string | undefined,
    body: OrderStatusUpdateBody,
  ): MockResponse {
    const authError = this.checkAuth(authHeader);
    if (authError) return authError;

    // Casos de error simulados por el valor del orderToken.
    const token = orderToken || "";
    if (token.includes("NOTFOUND")) {
      return this.error(400, "ORDER_NOT_FOUND", "La orden no existe");
    }
    if (token.includes("CONFLICT_CANCELLED")) {
      return this.conflict("CANCELLED");
    }
    if (token.includes("CONFLICT_RETRY")) {
      return this.conflict("WAITING_FOR_ACKNOWLEDGEMENT");
    }
    if (token.includes("FORBIDDEN")) {
      return this.error(403, "FORBIDDEN", "User is not authorized for this chain");
    }
    if (token.includes("SERVERERROR")) {
      return this.error(500, "INTERNAL_ERROR", "dummy error message");
    }

    // Validación del body según el status.
    const status = body?.status;
    if (!status || !ORDER_STATUSES.includes(status as OrderStatus)) {
      return this.error(
        400,
        "INVALID_ORDER_STATUS",
        `status inválido. Válidos: ${ORDER_STATUSES.join(", ")}`,
      );
    }

    if (status === "order_accepted" && !body.acceptanceTime) {
      return this.error(400, "INVALID_REQUEST", "acceptanceTime es requerido para order_accepted");
    }

    if (status === "order_rejected") {
      if (!body.reason) {
        return this.error(400, "INVALID_REQUEST", "reason es requerido para order_rejected");
      }
      if (!REJECT_REASONS.includes(body.reason as (typeof REJECT_REASONS)[number])) {
        return this.error(400, "INVALID_REQUEST", `reason inválido: ${body.reason}`);
      }
    }

    this.logger.info(
      { orderToken, status, body },
      "PEYA mock: order status update OK",
    );
    return {
      httpStatus: 200,
      body: { message: "Order status successfully changed." },
    };
  }

  /**
   * POST /v2/orders/{orderToken}/preparation-completed. Solo órdenes con rider de Delivery Hero.
   * (Maxirest hoy NO lo usa, pero el mock lo expone para completar la API.)
   */
  preparationCompleted(
    orderToken: string,
    authHeader: string | undefined,
  ): MockResponse {
    const authError = this.checkAuth(authHeader);
    if (authError) return authError;

    const token = orderToken || "";
    if (token.includes("NOTFOUND")) {
      return this.error(404, "NOT_FOUND", "Order Not Found");
    }
    if (token.includes("CONFLICT")) {
      return this.error(409, "INVALID_ORDER_STATUS", "El estado actual no permite marcar preparado");
    }

    this.logger.info({ orderToken }, "PEYA mock: preparation-completed OK");
    return { httpStatus: 200, body: { code: "OK" } };
  }

  /**
   * POST /v2/orders/{orderToken}/adjust-preparation-time. Solo order type Logistics Delivery.
   * Valida el rango min/max de forma simulada por el valor del token.
   */
  adjustPreparationTime(
    orderToken: string,
    authHeader: string | undefined,
    body: { expectedPickupAt?: string },
  ): MockResponse {
    const authError = this.checkAuth(authHeader);
    if (authError) return authError;

    if (!body?.expectedPickupAt) {
      return this.error(
        400,
        "PREPARATION_TIME_BELOW_ALLOWED_MIN_TIME",
        "expectedPickupAt es requerido",
      );
    }
    const token = orderToken || "";
    if (token.includes("NOTFOUND")) {
      return this.error(404, "NOT_FOUND", "Order Not Found");
    }
    if (token.includes("MAXTIME")) {
      return this.error(
        400,
        "PREPARATION_TIME_EXCEEDS_ALLOWED_MAX_TIME",
        "Excede el máximo permitido",
      );
    }
    if (token.includes("CONFLICT")) {
      return this.error(
        409,
        "conflict-error",
        "The current order state does not allow preparation time adjustment.",
      );
    }

    this.logger.info(
      { orderToken, expectedPickupAt: body.expectedPickupAt },
      "PEYA mock: adjust-preparation-time OK (204)",
    );
    return { httpStatus: 204, body: null };
  }

  // ───────────────────────────── helpers ─────────────────────────────

  /** 401 si falta el header Authorization o no es un Bearer no vacío. */
  private checkAuth(authHeader: string | undefined): MockResponse | null {
    const token = (authHeader || "").replace(/^Bearer\s+/i, "").trim();
    if (!authHeader || !/^Bearer\s+/i.test(authHeader) || token.length === 0) {
      return this.error(401, "POS_ERROR", "Token ausente o inválido");
    }
    if (token === "EXPIRED") {
      // Permite testear el flujo de refresh de token del cliente.
      return this.error(401, "POS_ERROR", "Token expirado");
    }
    return null;
  }

  /** 409 con currentState, según OrderStatusUpdateConflict. */
  private conflict(currentState: string): MockResponse {
    return {
      httpStatus: 409,
      body: {
        code: "INVALID_REQUEST",
        message: "Invalid order status transition",
        currentState,
      },
    };
  }

  private error(httpStatus: number, code: string, message: string): MockResponse {
    return { httpStatus, body: { code, message } };
  }

  /** Genera un access_token con forma de JWT (header.payload.signature) — solo para el mock. */
  private fakeJwt(sub: string): string {
    const b64 = (o: unknown) =>
      Buffer.from(JSON.stringify(o)).toString("base64url");
    const header = b64({ alg: "HS384", typ: "JWT" });
    const payload = b64({
      iss: "middleware",
      sub,
      iat: 0,
      exp: 1800,
    });
    return `${header}.${payload}.mock-signature`;
  }
}
