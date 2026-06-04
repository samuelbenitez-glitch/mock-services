// Datos mockeados para el mock de Alax.
// API Keys válidas, usuarios y cupones de ejemplo usados por el servicio.

import { ActivatedDiscount, Coupon, UserData } from "./alax.types";

// API Key principal del local (registrada/habilitada para operar con Alax).
export const ALAX_API_KEY = "91202dd0-bd60-11ef-b483-a3f758f85781";

// API Keys aceptadas como válidas/registradas por el mock.
export const VALID_API_KEYS: string[] = [ALAX_API_KEY, "alax-demo-key", "ABC123"];

// Usuarios registrados, indexados por DNI (como string).
export const MOCK_USERS: Record<string, UserData> = {
  "12345678": {
    dni: "12345678",
    first_name: "Juan",
    last_name: "Pérez",
    email: "juan.perez@example.com",
  },
  "30111222": {
    dni: "30111222",
    first_name: "María",
    last_name: "González",
    email: "maria.gonzalez@example.com",
  },
};

// Listado general de cupones vigentes para operar en el local.
// IMPORTANTE: todo código que pueda devolver getDiscountsByDocument
// (ver MOCK_ACTIVATED_DISCOUNTS) debe existir acá, porque checkDiscounts valida
// los códigos contra este catálogo con igualdad estricta (findCouponByCode).
export const MOCK_COUPONS: Coupon[] = [
  {
    id: 1,
    cupon_name: "Descuento Bienvenida",
    coupon_type: "amount",
    coupon_description: "Descuento de $500 en tu primera compra",
    code: "WELCOME!!",
    discount: 500,
    discount_units: 0,
    validFrom: "2025-01-01",
    validThrough: "2026-12-31",
  },
  {
    id: 4,
    cupon_name: "Descuento Sin Código",
    coupon_type: "amount",
    coupon_description: "Descuento de $500 en tu primera compra",
    code: "OTRODESCUENTO",
    discount: 500,
    discount_units: 0,
    validFrom: "2025-01-01",
    validThrough: "2026-12-31",
  },
  {
    id: 2,
    cupon_name: "2x1 Hamburguesas",
    coupon_type: "units",
    coupon_description: "Llevá 2 hamburguesas pagando 1",
    code: "BURGER2X1",
    discount: 0,
    discount_units: 1,
    validFrom: "2025-01-01",
    validThrough: "2026-12-31",
  },
  {
    id: 3,
    cupon_name: "Descuento Fenicio",
    coupon_type: "amount",
    coupon_description: "Cupón activado desde eshop Fenicio",
    code: "FEN-AB12CD",
    discount: 1000,
    discount_units: 0,
    validFrom: "2025-01-01",
    validThrough: "2026-12-31",
  },
];

// Descuentos activados por cliente, indexados por DNI (como string).
// Se excluyen cupones sin código externo (segun doc).
export const MOCK_ACTIVATED_DISCOUNTS: Record<string, ActivatedDiscount[]> = {
  "12345678": [
    {
      cupon_id: 1,
      discount_id: 1001,
      cupon_name: "Descuento Bienvenida",
      coupon_type: "15%",
      coupon_description: "Descuento de $500 en tu primera compra",
      code: "WELCOME!!",
      discount: 500,
      discount_units: 0,
      validThrough: "2026-12-31",
    },
    {
      cupon_id: 2,
      discount_id: 1002,
      cupon_name: "Descuento Sin Código",
      coupon_type: "10%",
      coupon_description: "Descuento de $500 en tu primera compra",
      code: "OTRODESCUENTO",
      discount: 500,
      discount_units: 0,
      validThrough: "2026-12-31",
    },
  ],
  "30111222": [
    {
      cupon_id: 3,
      discount_id: 1003,
      cupon_name: "Descuento Fenicio",
      coupon_type: "amount",
      coupon_description: "Cupón activado desde eshop Fenicio",
      code: "FEN-AB12CD",
      discount: 1000,
      discount_units: 0,
      validThrough: "2026-12-31",
    },
  ],
};
