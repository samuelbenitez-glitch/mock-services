// Tipos compartidos para el mock de BigPons (IT_ROCKS) POS Integration.
// Basado en docs/analisis-api-bigpons.md del proyecto api-loyalty.
//
// Notas de fidelidad con la API real:
// - El prefijo real es "/pos/..." (SIN "/api"; con "/api" la real devuelve 403 CloudFront).
// - checkUser responde envuelto en "data".
// - El id de producto al que aplica un cupón NO se expone en la API real; acá se guarda
//   internamente (productCode) para poder calcular checkDiscounts, pero NO se devuelve en
//   getDiscountsByDocument.

// ---- Error estándar ----
export interface BigPonsError {
  code: string;
  msg: string;
}

export interface BigPonsErrorResponse {
  errors: BigPonsError[];
}

// ---- Descuentos activados por cliente (getDiscountsByDocument) ----
// discount viene como PORCENTAJE cuando coupon_type = "percentage" (ej. 30 = 30%).
export interface ActivatedDiscount {
  cupon_id: string;
  discount_id: string;
  cupon_name: string;
  coupon_type: string; // "percentage" | (otros)
  coupon_description: string;
  code: string;
  discount: number;
  discount_units: number;
  validThrough: string | null;
}

// Cupón interno del seed: agrega el productCode (id de producto BigPons al que aplica),
// que la API real NO expone (ver Nota Crítica del análisis).
export interface BigPonsCoupon extends ActivatedDiscount {
  productCode: string; // id de producto de BigPons sobre el que aplica el descuento
}

// ---- Usuario (checkUser) ----
export interface UserData {
  first_name: string;
  last_name: string;
}

// ---- Items y descuentos (checkDiscounts / sale) ----
export interface SaleItem {
  description: string;
  code: string;
  amount_sale: number;
  amount_units: number;
  quantity: number;
  segment?: string;
}

export interface RequestedDiscount {
  code: string;
}

// ---- Respuesta de checkDiscounts ----
export interface CheckedDiscount {
  code: string;
  status: string; // "ok" | "error"
  error_msg: string;
  validation_id: number;
  cumulative: boolean;
  discount_value: number; // fuente de verdad: el valor real del cupón calculado por BigPons
}

// ---- Respuesta de sale ----
export interface SaleDiscount {
  code: string;
  status: string; // "applied" | "error"
  error_msg: string;
  validation_id: number;
}
