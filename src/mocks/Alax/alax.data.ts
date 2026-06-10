// Datos mockeados para el mock de Alax.
// API Keys válidas, usuarios y cupones de ejemplo usados por el servicio.

import { ActivatedDiscount, Coupon, UserData } from "./alax.types";

// API Key principal del local (registrada/habilitada para operar con Alax).
export const ALAX_API_KEY = "91202dd0-bd60-11ef-b483-a3f758f85781";

// API Keys aceptadas como válidas/registradas por el mock.
export const VALID_API_KEYS: string[] = [ALAX_API_KEY];

// Usuarios registrados, indexados por DNI (como string).
// Seed de 10 clientes de ejemplo para probar checkUser / sale / getDiscountsByDocument.
export const MOCK_USERS: Record<string, UserData> = {
  "11111111": {
    dni: "11111111",
    first_name: "Juan",
    last_name: "Perez",
    email: "juan.perez@example.com",
  },
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
  "22333444": {
    dni: "22333444",
    first_name: "Carlos",
    last_name: "Rodríguez",
    email: "carlos.rodriguez@example.com",
  },
  "25444555": {
    dni: "25444555",
    first_name: "Lucía",
    last_name: "Martínez",
    email: "lucia.martinez@example.com",
  },
  "27555666": {
    dni: "27555666",
    first_name: "Diego",
    last_name: "Fernández",
    email: "diego.fernandez@example.com",
  },
  "28666777": {
    dni: "28666777",
    first_name: "Sofía",
    last_name: "López",
    email: "sofia.lopez@example.com",
  },
  "31777888": {
    dni: "31777888",
    first_name: "Martín",
    last_name: "Sánchez",
    email: "martin.sanchez@example.com",
  },
  "33888999": {
    dni: "33888999",
    first_name: "Valentina",
    last_name: "Romero",
    email: "valentina.romero@example.com",
  },
  "35999000": {
    dni: "35999000",
    first_name: "Mateo",
    last_name: "Díaz",
    email: "mateo.diaz@example.com",
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
    code: "CODDESC2",
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
    code: "CODDESC1",
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
      code: "CODDESC2",
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
      code: "CODDESC1",
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
