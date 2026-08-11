import { Logger } from "../../config/logger";
import { MOCK_COUPONS } from "./bigpons.data";
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

  // Cupones ya consumidos (in-memory, global). /sale los canjea → dejan de listarse.
  // Al reiniciar el proceso este Set se vacía, por lo que los cupones vuelven a aparecer.
  private consumedCodes = new Set<string>();

  private validationCounter = 1;

  constructor(private logger: Logger) {}

  // ---- Helpers ----

  // Cupones vigentes (aún no consumidos). No depende del dni ni del token: la misma
  // lista global se devuelve para cualquier cliente.
  private couponsOf(): BigPonsCoupon[] {
    return MOCK_COUPONS.filter((c) => !this.consumedCodes.has(c.code));
  }

  // discount_value: se calcula sobre el total de los ítems vendidos (líneas positivas).
  // Versión simplificada: el cupón NO está atado a un productCode; el descuento aplica
  // sobre lo enviado en items (amount_sale * quantity de las líneas con amount_sale > 0).
  // - coupon_type "percentage": discount es un % → valor = % * total.
  // - otro (ej. "amount"): discount es un importe fijo → valor = discount (tope: total).
  private calcularDiscountValue(coupon: BigPonsCoupon, items: SaleItem[]): number {
    const total = items
      .filter((it) => it.amount_sale > 0)
      .reduce((acc, it) => {
        const qty = it.quantity && it.quantity > 0 ? it.quantity : 1;
        return acc + it.amount_sale * qty;
      }, 0);
    if (total <= 0) {
      return 0;
    }
    if (coupon.coupon_type === "percentage") {
      return Math.round((coupon.discount / 100) * total);
    }
    // Monto fijo: no puede superar el total de la compra.
    return Math.min(Math.round(coupon.discount), Math.round(total));
  }

  // ---- 1. POST /pos/checkApiKey ----
  // Ya no se valida el token: cualquier apiKey se considera válida.
  checkApiKey(_apiKey?: string): { valid_key: boolean } {
    return { valid_key: true };
  }

  // ---- 2. POST /pos/checkUser (respuesta envuelta en "data") ----
  // Ya no se valida el dni: cualquier documento devuelve un usuario mock.
  checkUser(
    _apiKey?: string,
    _dni?: string | number,
  ): {
    data: { user_registered: boolean; user_data: { first_name: string; last_name: string } };
  } {
    return {
      data: {
        user_registered: true,
        user_data: { first_name: "Cliente", last_name: "Mock" },
      },
    };
  }

  // ---- 3. GET /pos/getDiscountsByDocument ----
  // Devuelve los cupones vigentes para cualquier token/dni.
  getDiscountsByDocument(
    _apiKey?: string,
    _dni?: string | number,
  ): { discounts: ActivatedDiscount[] } {
    // Se omite productCode (interno): la API real no expone el id de producto.
    const discounts = this.couponsOf().map(({ productCode, ...pub }) => pub);
    return { discounts };
  }

  // ---- 4. GET /pos/coupons ----
  // Devuelve los mismos cupones vigentes (sin validar token).
  getCoupons(_apiKey?: string): { discounts: ActivatedDiscount[] } {
    const discounts = this.couponsOf().map(({ productCode, ...pub }) => pub);
    return { discounts };
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
    const { items = [], discounts = [] } = params;

    const codes = discounts.map((d) => d.code).filter(Boolean);
    if (codes.length === 0) {
      return { discounts: [] };
    }

    const disponibles = this.couponsOf();

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
        // No se enviaron ítems válidos (líneas positivas) para calcular el descuento.
        return {
          code,
          status: "error",
          error_msg: DISCOUNT_MSG.NO_PRODUCT,
          validation_id,
          cumulative: false,
          discount_value: 0,
        };
      }

      // Cupón válido + ítems válidos: devuelve el 10% (valor calculado) con status ok.
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
    const { dni, ticket, discounts = [] } = params;

    const disponibles = this.couponsOf();
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
      // Consumir el cupón (deja de listarse en getDiscountsByDocument / coupons).
      this.consumedCodes.add(coupon.code);
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
