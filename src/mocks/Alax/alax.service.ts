import { Logger } from "../../config/logger";
import {
  MOCK_ACTIVATED_DISCOUNTS,
  MOCK_COUPONS,
  MOCK_USERS,
  VALID_API_KEYS,
} from "./alax.data";
import {
  ActivatedDiscount,
  AlaxError,
  CheckedDiscount,
  Coupon,
  DiscountValidation,
  RequestedDiscount,
  SaleItem,
  UserData,
} from "./alax.types";

// Códigos de error definidos en la documentación de Alax.
export const ALAX_ERRORS = {
  DB_CONNECTION: { code: "10007", msg: "Error de conexión con la base de datos" },
  API_KEY_NOT_REGISTERED: {
    code: "10400",
    msg: "La Api Key enviada no se encuentra registrada.",
  },
  USER_NOT_FOUND: {
    code: "10401",
    msg: "No se encontró un usuario registrado con ese DNI o su cuenta no fue activada.",
  },
  TICKET_ALREADY_REGISTERED: {
    code: "10402",
    msg: "El ticket ingresado ya se encuentra registrado.",
  },
  API_KEY_REQUIRED: { code: "10500", msg: "Por favor, envíe una Api Key." },
  DISCOUNTS_REQUIRED: {
    code: "10501",
    msg: "Por favor, envíe los descuentos a utilizar.",
  },
  DISCOUNT_NOT_FOUND: { code: "10901", msg: "No se encontró descuento." },
  DISCOUNT_NOT_AVAILABLE: { code: "10902", msg: "Descuento no disponible." },
} as const;

// Error con status HTTP asociado, usado por el controlador para construir la
// respuesta de error apropiada.
export class AlaxApiError extends Error {
  constructor(
    public status: number,
    public error: AlaxError,
  ) {
    super(error.msg);
  }
}

export class AlaxService {
  // Tickets ya registrados en ventas (in-memory, singleton).
  private registeredTickets = new Set<string>();

  // Contador para generar validation_id incrementales.
  private validationCounter = 1;

  constructor(private logger: Logger) {}

  // ---- Helpers de validación ----

  isValidApiKey(apiKey?: string): boolean {
    return !!apiKey && VALID_API_KEYS.includes(apiKey);
  }

  // Lanza AlaxApiError si la API Key falta o no está registrada.
  private assertApiKey(apiKey?: string): void {
    if (!apiKey) {
      throw new AlaxApiError(400, ALAX_ERRORS.API_KEY_NOT_REGISTERED);
    }
    if (!this.isValidApiKey(apiKey)) {
      throw new AlaxApiError(400, ALAX_ERRORS.API_KEY_NOT_REGISTERED);
    }
  }

  private getUser(dni: string | number): UserData | undefined {
    return MOCK_USERS[String(dni)];
  }

  private findCouponByCode(code: string): Coupon | undefined {
    return MOCK_COUPONS.find((c) => c.code === code);
  }

  // ---- 1. Verificación de Api Key ----
  checkApiKey(apiKey?: string): { valid_key: boolean } {
    if (!apiKey) {
      // Sin API Key -> 403 (manejado por el controlador via AlaxApiError)
      throw new AlaxApiError(403, ALAX_ERRORS.API_KEY_REQUIRED);
    }
    return { valid_key: this.isValidApiKey(apiKey) };
  }

  // ---- 2. Listado de cupones ----
  getCoupons(apiKey?: string): { coupons: Coupon[] } {
    this.assertApiKey(apiKey);
    return { coupons: MOCK_COUPONS };
  }

  // ---- 5. Verificación de usuario ----
  checkUser(
    apiKey?: string,
    dni?: string | number,
  ): { user_registered: boolean; user_data: { first_name: string; last_name: string } } {
    this.assertApiKey(apiKey);
    const user = this.getUser(dni ?? "");
    if (!user) {
      throw new AlaxApiError(400, ALAX_ERRORS.USER_NOT_FOUND);
    }
    return {
      user_registered: true,
      user_data: { first_name: user.first_name, last_name: user.last_name },
    };
  }

  // ---- 6. Listado de descuentos activados por cliente ----
  getDiscountsByDocument(
    apiKey?: string,
    dni?: string | number,
  ): { discounts: ActivatedDiscount[] } {
    this.assertApiKey(apiKey);
    const discounts = MOCK_ACTIVATED_DISCOUNTS[String(dni ?? "")] || [];
    return { discounts };
  }

  // ---- 4. Verificación de cupones (checkDiscounts) ----
  checkDiscounts(params: {
    apiKey?: string;
    dni?: string | number;
    items?: SaleItem[];
    discounts?: RequestedDiscount[];
    add_user_discounts?: boolean;
  }): { discounts: CheckedDiscount[] } {
    const { apiKey, dni, items = [], discounts = [], add_user_discounts } = params;
    this.assertApiKey(apiKey);

    let codes = discounts.map((d) => d.code).filter(Boolean);

    // Si se pide cálculo automático y no hay descuentos, se toman los del cliente.
    if (add_user_discounts && codes.length === 0) {
      const activated = MOCK_ACTIVATED_DISCOUNTS[String(dni ?? "")] || [];
      codes = activated.map((d) => d.code);
    }

    if (codes.length === 0) {
      throw new AlaxApiError(400, ALAX_ERRORS.DISCOUNTS_REQUIRED);
    }

    const result: CheckedDiscount[] = codes.map((code) => {
      const coupon = this.findCouponByCode(code);
      const validation_id = this.validationCounter++;

      if (!coupon) {
        return {
          code,
          status: "error",
          error_msg: "Cupón no encontrado o no disponible.",
          validation_id,
          eshop_discount_code: "",
          cumulative: false,
          discount_value: add_user_discounts ? 3000 : 1500,
          matched_products: [],
        };
      }

      return {
        code,
        status: "ok",
        error_msg: "",
        validation_id,
        eshop_discount_code: coupon.coupon_type === "amount" ? `ESHOP-${coupon.id}` : "",
        cumulative: false,
        discount_value: add_user_discounts ? 3000 : 2500,
        matched_products: items,
      };
    });

    return { discounts: result };
  }

  // ---- 3. Venta / validación de cupones ----
  sale(params: {
    apiKey?: string;
    dni?: string | number;
    isDelivery?: boolean;
    ticket?: string;
    items?: SaleItem[];
    discounts?: RequestedDiscount[];
  }): { discounts: DiscountValidation[]; success: boolean; successMsg: string } {
    const { apiKey, dni, ticket, discounts = [] } = params;
    this.assertApiKey(apiKey);

    if (!this.getUser(dni ?? "")) {
      throw new AlaxApiError(400, ALAX_ERRORS.USER_NOT_FOUND);
    }

    if (ticket && this.registeredTickets.has(ticket)) {
      throw new AlaxApiError(400, ALAX_ERRORS.TICKET_ALREADY_REGISTERED);
    }

    if (discounts.length === 0) {
      throw new AlaxApiError(400, ALAX_ERRORS.DISCOUNTS_REQUIRED);
    }

    const validated: DiscountValidation[] = discounts.map((d) => {
      const coupon = this.findCouponByCode(d.code);
      const validation_id = this.validationCounter++;
      if (!coupon) {
        return {
          code: d.code,
          status: "error",
          error_msg: "Cupón no encontrado o no disponible.",
          validation_id,
        };
      }
      return { code: d.code, status: "ok", error_msg: "", validation_id };
    });

    if (ticket) {
      this.registeredTickets.add(ticket);
    }

    this.logger.info({ dni, ticket, discounts }, "Registrando venta Alax");

    return {
      discounts: validated,
      success: true,
      successMsg: "Venta registrada correctamente.",
    };
  }

  // ---- 7. API Eshop (Fenicio) ----
  validateEshopCoupon(params: {
    api_key?: string;
    coupon_code?: string;
    amount?: number;
  }):
    | { valid: false; message: string }
    | {
        valid: true;
        dni: string;
        first_name: string;
        last_name: string;
        email: string;
        min_amount: number;
        activation_local_type: string;
      } {
    const { api_key, coupon_code, amount } = params;

    if (!api_key) {
      throw new AlaxApiError(400, ALAX_ERRORS.DB_CONNECTION);
    }

    const coupon = coupon_code ? this.findCouponByCode(coupon_code) : undefined;
    if (!coupon) {
      return { valid: false, message: "El cupón no existe o no es válido." };
    }

    const minAmount = 1000;
    if (typeof amount === "number" && amount < minAmount) {
      return {
        valid: false,
        message: `El monto mínimo para usar este cupón es $${minAmount}.`,
      };
    }

    // Usuario de ejemplo asociado a la activación.
    const user = MOCK_USERS["12345678"];
    return {
      valid: true,
      dni: user.dni,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      min_amount: minAmount,
      activation_local_type: "pos",
    };
  }

  // ---- 8. Validar cupón (E-Commerce externos) ----
  validateCoupon(params: {
    apiKey?: string;
    coupon_code?: string;
  }): { result: number } {
    const { apiKey, coupon_code } = params;
    this.assertApiKey(apiKey);

    if (!coupon_code) {
      throw new AlaxApiError(400, ALAX_ERRORS.DISCOUNT_NOT_FOUND);
    }

    const coupon = this.findCouponByCode(coupon_code);
    if (!coupon) {
      throw new AlaxApiError(400, ALAX_ERRORS.DISCOUNT_NOT_FOUND);
    }

    const now = new Date();
    const validThrough = new Date(coupon.validThrough);
    if (validThrough < now) {
      throw new AlaxApiError(400, ALAX_ERRORS.DISCOUNT_NOT_AVAILABLE);
    }

    return { result: 1 };
  }
}
