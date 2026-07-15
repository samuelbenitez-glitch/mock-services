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

  /**
   * Tokens que empiezan con "C": la respuesta alterna en cada consulta
   * (401 → 200 → 401 → 200 ...). Estar en el Set significa que la última
   * respuesta fue 401. Estado en memoria (se reinicia al reiniciar el server),
   * por valor exacto del token.
   */
  private cTokenReturned401 = new Set<string>();

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
   * POST /v2/order/status/{orderToken}.
   *
   * La respuesta se decide por MARCADORES (substring, case-insensitive) presentes en el
   * orderToken, para poder disparar de forma predecible cada escenario de QA y validar el
   * mapeo de status del backend MRO (PedidosYa error → 400, salvo 5xx → 500, salvo conflicto
   * de transición reintentable → 503). Se evalúan en este orden de prioridad:
   *
   *   token contiene…        → mock responde                                    → MRO mapea a
   *   ─────────────────────────────────────────────────────────────────────────────────────
   *   NOTFOUND               → 400 { code: ORDER_NOT_FOUND }                    → 400
   *   RETRYASSIGNED          → 409 { currentState: ASSIGNED_TO_TRANSPORT }      → 503 (reintentable)
   *   RETRYWAITING           → 409 { currentState: WAITING_FOR_ACKNOWLEDGEMENT }→ 503 (reintentable)
   *   TERMINAL               → 409 { currentState: CANCELLED }                  → 400 (no reintentable)
   *   BADREQUEST             → 400 { code: INVALID_REQUEST }                    → 400
   *   FORBIDDEN              → 403 { code: FORBIDDEN }                          → 400
   *   SERVERERROR            → 500 { code: INTERNAL_ERROR }                     → 500
   *   AUTHREFRESH            → alterna 401 POS_ERROR / 200 (testea refresh de token) → 204 tras refresh
   *   (cualquier otro)       → 200 OK                                          → 204
   *
   * No valida el header Authorization ni el body (salvo el marcador AUTHREFRESH): el
   * comportamiento depende únicamente del valor del token.
   */
  updateOrderStatus(
    orderToken: string,
    _authHeader: string | undefined,
    body: OrderStatusUpdateBody,
  ): MockResponse {
    const token = (orderToken || "").toUpperCase();
    this.logger.info(
      { orderToken, body },
      "PEYA mock: order status update (respuesta según marcadores del token)",
    );

    const ok: MockResponse = {
      httpStatus: 200,
      body: { message: "Order status successfully changed." },
    };

    if (token.includes("NOTFOUND")) {
      return this.error(400, "ORDER_NOT_FOUND", "Order not found for the given token");
    }
    if (token.includes("RETRYASSIGNED")) {
      return this.conflictTransicion("ASSIGNED_TO_TRANSPORT");
    }
    if (token.includes("RETRYWAITING")) {
      return this.conflictTransicion("WAITING_FOR_ACKNOWLEDGEMENT");
    }
    if (token.includes("TERMINAL")) {
      return this.conflictTransicion("CANCELLED");
    }
    if (token.includes("BADREQUEST")) {
      return this.error(400, "INVALID_REQUEST", "Invalid request payload");
    }
    if (token.includes("FORBIDDEN")) {
      return this.error(403, "FORBIDDEN", "User is not authorized for this chain");
    }
    if (token.includes("SERVERERROR")) {
      return this.error(500, "INTERNAL_ERROR", "Unexpected server error");
    }
    if (token.includes("AUTHREFRESH")) {
      // Alterna en cada consulta del mismo token: si la última fue 401 → ahora 200, y viceversa.
      if (this.cTokenReturned401.has(orderToken)) {
        this.cTokenReturned401.delete(orderToken);
        return ok;
      }
      this.cTokenReturned401.add(orderToken);
      return this.error(401, "POS_ERROR", "Token inválido o expirado");
    }

    return ok;
  }

  /**
   * Conflicto de transición de estado (HTTP 409). Según la spec de PedidosYa, cuando la
   * transición es inválida el body incluye el {@code currentState} de la orden; si es
   * ASSIGNED_TO_TRANSPORT o WAITING_FOR_ACKNOWLEDGEMENT la operación debe reintentarse.
   */
  private conflictTransicion(currentState: string): MockResponse {
    return {
      httpStatus: 409,
      body: {
        code: "INVALID_ORDER_STATUS",
        message: "The order status transition is not allowed from the current state.",
        currentState,
      },
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
