// Tipos compartidos para el mock de Alax POS Api Rest

// ---- Error estándar ----
export interface AlaxError {
  code: string;
  msg: string;
}

export interface AlaxErrorResponse {
  errors: AlaxError[];
}

// ---- Cupones (Listado de cupones) ----
export interface Coupon {
  id: number;
  cupon_name: string;
  coupon_type: string;
  coupon_description: string;
  code: string;
  discount: number; // DEPRECADO: usar discount_value de checkDiscounts
  discount_units: number;
  validFrom: string;
  validThrough: string;
}

// ---- Descuentos activados por cliente (getDiscountsByDocument) ----
export interface ActivatedDiscount {
  cupon_id: number;
  discount_id: number;
  cupon_name: string;
  coupon_type: string;
  coupon_description: string;
  code: string;
  discount: number; // DEPRECADO
  discount_units: number;
  validThrough: string;
}

// ---- Usuario (checkUser / validateCoupon eshop) ----
export interface UserData {
  dni: string;
  first_name: string;
  last_name: string;
  email: string;
}

// ---- Items y descuentos de las ventas / verificaciones ----
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
  eshop_code?: string;
}

// ---- Respuesta de validación de descuentos (sale) ----
export interface DiscountValidation {
  code: string;
  status: string; // "ok" | "error"
  error_msg: string;
  validation_id: number;
}

// ---- Respuesta de checkDiscounts (cálculo automático v2.0) ----
export interface CheckedDiscount extends DiscountValidation {
  eshop_discount_code: string;
  cumulative: boolean;
  discount_value: number; // monto a descontar (fuente de verdad v2.0)
  matched_products: SaleItem[];
}
