import { Logger } from "../../config/logger";
import {
  MOCK_COUPONS_BY_USER,
  MOCK_USERS,
  VALID_API_KEYS,
} from "./bigpons.data";
import {
  ActivatedDiscount,
  BigPonsCoupon,
  BigPonsError,
  CheckedDiscount,
  RequestedDiscount,
  SaleDiscount,
  SaleItem,
} from "./bigpons.types";

// Códigos de error de BigPons (según docs/analisis-api-bigpons.md).
export const BIGPONS_ERRORS = {
  API_KEY_NOT_REGISTERED: {
    code: "10400",
    msg: "La Api Key enviada no se encuentra registrada.",
  },
  USER_NOT_FOUND: {
    code: "10401",
    msg: "No existe un usuario registrado con ese DNI.",
  },
  TICKET_ALREADY_REGISTERED: {
    code: "10402",
    msg: "El ticket ingresado ya se encuentra registrado.",
  },
  API_KEY_REQUIRED: { code: "10500", msg: "Por favor, envíe una Api Key." },
  DEPENDENCY_VALIDATION: { code: "DEPENDENCY_ERROR", msg: "Validation failed" },
  MEMBER_NOT_FOUND: { code: "DEPENDENCY_ERROR", msg: "Member not found" },
  INVALID_COUPON_CODE: { code: "BAD_REQUEST", msg: "Código de cupón inválido" },
} as const;

// Mensajes por-cupón (no cortan la request; van en el status "error" de cada descuento).
const DISCOUNT_MSG = {
  NOT_FOUND_FOR_USER: "Cupón no encontrado o no disponible para el usuario",
  NO_PRODUCT: "El cupón no aplica a ningún producto de la compra",
  AMOUNT_MISMATCH:
    "El monto del descuento enviado no coincide con el valor real del cupón",
} as const;

// Error con status HTTP asociado; el controlador lo convierte en { errors: [...] }.
export class BigPonsApiError extends Error {
  constructor(
    public status: number,
    public error: BigPonsError,
  ) {
    super(error.msg);
  }
}

export class BigPonsService {
  // Tickets ya registrados (in-memory). Nota: la API real NO rechaza duplicados
  // (ver §6.c/§9.7); se replica ese comportamiento y solo se usa para consumir cupones.
  private registeredTickets = new Set<string>();

  // Cupones ya consumidos por usuario (sale los canjea → dejan de listarse). §9.7.
  private consumedByUser = new Map<string, Set<string>>();

  private validationCounter = 1;

  constructor(private logger: Logger) {}

  // ---- Helpers ----

  private isValidApiKey(apiKey?: string): boolean {
    return !!apiKey && VALID_API_KEYS.includes(apiKey);
  }

  private assertApiKey(apiKey?: string): void {
    if (!apiKey) {
      throw new BigPonsApiError(403, BIGPONS_ERRORS.API_KEY_REQUIRED);
    }
    if (!this.isValidApiKey(apiKey)) {
      throw new BigPonsApiError(400, BIGPONS_ERRORS.API_KEY_NOT_REGISTERED);
    }
  }

  private consumed(dni: string): Set<string> {
    let set = this.consumedByUser.get(dni);
    if (!set) {
      set = new Set<string>();
      this.consumedByUser.set(dni, set);
    }
    return set;
  }

  // Cupones vigentes del usuario que aún no fueron consumidos.
  private couponsOf(dni?: string | number): BigPonsCoupon[] {
    const all = MOCK_COUPONS_BY_USER[String(dni ?? "")] || [];
    const used = this.consumed(String(dni ?? ""));
    return all.filter((c) => !used.has(c.code));
  }

  // discount_value = porcentaje * (precio del producto del cupón presente en items).
  private calcularDiscountValue(coupon: BigPonsCoupon, items: SaleItem[]): number {
    const linea = items.find(
      (it) => it.code === coupon.productCode && it.amount_sale > 0,
    );
    if (!linea) {
      return 0;
    }
    const qty = linea.quantity && linea.quantity > 0 ? linea.quantity : 1;
    return Math.round((coupon.discount / 100) * linea.amount_sale * qty);
  }

  // ---- 1. POST /pos/checkApiKey ----
  checkApiKey(apiKey?: string): { valid_key: boolean } {
    if (!apiKey) {
      throw new BigPonsApiError(403, BIGPONS_ERRORS.API_KEY_REQUIRED);
    }
    return { valid_key: this.isValidApiKey(apiKey) };
  }

  // ---- 2. POST /pos/checkUser (respuesta envuelta en "data") ----
  checkUser(
    apiKey?: string,
    dni?: string | number,
  ): {
    data: { user_registered: boolean; user_data: { first_name: string; last_name: string } };
  } {
    this.assertApiKey(apiKey);
    const user = MOCK_USERS[String(dni ?? "")];
    if (!user) {
      throw new BigPonsApiError(400, BIGPONS_ERRORS.USER_NOT_FOUND);
    }
    return {
      data: {
        user_registered: true,
        user_data: { first_name: user.first_name, last_name: user.last_name },
      },
    };
  }

  // ---- 3. GET /pos/getDiscountsByDocument ----
  getDiscountsByDocument(
    apiKey?: string,
    dni?: string | number,
  ): { discounts: ActivatedDiscount[] } {
    this.assertApiKey(apiKey);
    // Se omite productCode (interno): la API real no expone el id de producto.
    const discounts = this.couponsOf(dni).map(({ productCode, ...pub }) => pub);
    return { discounts };
  }

  // ---- 4. GET /pos/coupons (falla real: DEPENDENCY_ERROR / Validation failed, §4) ----
  getCoupons(apiKey?: string): never {
    this.assertApiKey(apiKey);
    throw new BigPonsApiError(400, BIGPONS_ERRORS.DEPENDENCY_VALIDATION);
  }

  // ---- 5. POST /pos/checkDiscounts ----
  // BigPons no soporta cálculo automático: si no se envían discounts, responde { discounts: [] }
  // (§5.d, no 10501). Devuelve discount_value autoritativo aunque falte la línea negativa (§5.a).
  checkDiscounts(params: {
    apiKey?: string;
    dni?: string | number;
    items?: SaleItem[];
    discounts?: RequestedDiscount[];
    add_user_discounts?: boolean;
  }): { discounts: CheckedDiscount[] } {
    const { apiKey, dni, items = [], discounts = [] } = params;
    this.assertApiKey(apiKey);

    // dni inexistente → DEPENDENCY_ERROR "Member not found" (§9.6).
    if (!MOCK_USERS[String(dni ?? "")]) {
      throw new BigPonsApiError(400, BIGPONS_ERRORS.MEMBER_NOT_FOUND);
    }

    const codes = discounts.map((d) => d.code).filter(Boolean);
    if (codes.length === 0) {
      return { discounts: [] };
    }

    const disponibles = this.couponsOf(dni);

    const result: CheckedDiscount[] = codes.map((code) => {
      const validation_id = this.validationCounter++;
      const coupon = disponibles.find((c) => c.code === code);

      if (!coupon) {
        return {
          code,
          status: "error",
          error_msg: DISCOUNT_MSG.NOT_FOUND_FOR_USER,
          validation_id,
          cumulative: false,
          discount_value: 0,
        };
      }

      const discountValue = this.calcularDiscountValue(coupon, items);
      if (discountValue <= 0) {
        return {
          code,
          status: "error",
          error_msg: DISCOUNT_MSG.NO_PRODUCT,
          validation_id,
          cumulative: false,
          discount_value: 0,
        };
      }

      // La línea negativa (código = code del cupón) debe coincidir con el valor real.
      const lineaCupon = items.find(
        (it) => it.code === code && it.amount_sale < 0,
      );
      if (!lineaCupon) {
        // Sin línea negativa: la API igual devuelve el valor calculado con status error (§5.a).
        return {
          code,
          status: "error",
          error_msg: "Descuento no encontrado en los ítems enviados por la caja",
          validation_id,
          cumulative: false,
          discount_value: discountValue,
        };
      }
      if (Math.abs(lineaCupon.amount_sale) !== discountValue) {
        return {
          code,
          status: "error",
          error_msg: DISCOUNT_MSG.AMOUNT_MISMATCH,
          validation_id,
          cumulative: false,
          discount_value: discountValue,
        };
      }

      return {
        code,
        status: "ok",
        error_msg: "",
        validation_id,
        cumulative: false,
        discount_value: discountValue,
      };
    });

    return { discounts: result };
  }

  // ---- 6. POST /pos/sale (venta / nota de crédito) ----
  // sale SÍ consume el cupón (§9.7). Idempotencia por ticket: la API real NO rechaza el
  // duplicado (§6.c), por eso acá también responde success:true.
  sale(params: {
    apiKey?: string;
    dni?: string | number;
    isDelivery?: boolean;
    ticket?: string;
    items?: SaleItem[];
    discounts?: RequestedDiscount[];
  }): { discounts: SaleDiscount[]; success: boolean; successMsg: string } {
    const { apiKey, dni, ticket, discounts = [] } = params;
    this.assertApiKey(apiKey);

    if (!MOCK_USERS[String(dni ?? "")]) {
      throw new BigPonsApiError(400, BIGPONS_ERRORS.USER_NOT_FOUND);
    }

    const disponibles = this.couponsOf(dni);
    const validated: SaleDiscount[] = discounts.map((d) => {
      const validation_id = this.validationCounter++;
      const coupon = disponibles.find((c) => c.code === d.code);
      if (!coupon) {
        return {
          code: d.code,
          status: "error",
          error_msg: DISCOUNT_MSG.NOT_FOUND_FOR_USER,
          validation_id,
        };
      }
      // Consumir el cupón (deja de listarse en getDiscountsByDocument).
      this.consumed(String(dni ?? "")).add(coupon.code);
      return { code: d.code, status: "applied", error_msg: "", validation_id };
    });

    if (ticket) {
      this.registeredTickets.add(ticket);
    }

    this.logger.info(
      { dni, ticket, discounts },
      "Registrando venta BigPons (IT_ROCKS)",
    );

    return {
      discounts: validated,
      success: true,
      successMsg: "Venta registrada exitosamente",
    };
  }
}
