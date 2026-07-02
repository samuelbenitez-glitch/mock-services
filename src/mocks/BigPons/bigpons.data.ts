// Datos mockeados para el mock de BigPons (IT_ROCKS).
// API Keys válidas, usuarios y cupones por cliente, según docs/analisis-api-bigpons.md.

import { BigPonsCoupon, UserData } from "./bigpons.types";

// API Keys de prueba documentadas (dev y test). El backend api-loyalty desencripta la
// apiKey del tenant y la envía; para operar contra el mock, el endpoint_base del tenant
// debe apuntar acá y su apiKey estar en esta lista.
export const BIGPONS_API_KEY_DEV = "62863db548ee44996afd6c5e73b8836c";
export const BIGPONS_API_KEY_TEST = "35883a8a4ff2aad7c6a71de4da965933";

export const VALID_API_KEYS: string[] = [
  BIGPONS_API_KEY_DEV,
  BIGPONS_API_KEY_TEST,
];

// Usuarios registrados, indexados por Loyalty ID (dni alfanumérico "BP-...").
export const MOCK_USERS: Record<string, UserData> = {
  "BP-37373738-D0CQ": { first_name: "Agustín", last_name: "Martinez" }, // test (§9)
  "BP-99999999-KCE3": { first_name: "Agustín", last_name: "Martinez" }, // dev (§2)
};

// Los 4 cupones reales del entorno test (§9.1 / §9.3): codes y discount_id verdaderos.
const CUPONES_REALES: BigPonsCoupon[] = [
  {
    cupon_id: "J014FI-1782761000001",
    discount_id: "cmorj4jnq009h01adndtkvkj5",
    cupon_name: "PESTO",
    coupon_type: "percentage",
    coupon_description: "PESTO",
    code: "cmorj4jnq009h01adndtkvkj5J014FI-6",
    discount: 20,
    discount_units: 0,
    validThrough: "2026-08-31T18:27:00.000Z",
    productCode: "309",
  },
  {
    cupon_id: "1STHTH-1782761000002",
    discount_id: "cmorjaj2o00a601adrjdknwjc",
    cupon_name: "CHEESE BURGER",
    coupon_type: "percentage",
    coupon_description: "CHEESE BURGER",
    code: "cmorjaj2o00a601adrjdknwjc1STHTH-6",
    discount: 30,
    discount_units: 0,
    validThrough: "2026-08-31T18:27:00.000Z",
    productCode: "300",
  },
  {
    cupon_id: "62KL6S-1782761807868",
    discount_id: "cmorj83yt009y01add78dyeka",
    cupon_name: "HDP TRIPLE",
    coupon_type: "percentage",
    coupon_description: "HDP TRIPLE",
    code: "cmorj83yt009y01add78dyeka62KL6S-6",
    discount: 30,
    discount_units: 0,
    validThrough: "2026-08-25T18:27:00.000Z",
    productCode: "748",
  },
  {
    cupon_id: "VHQFUK-1782761804253",
    discount_id: "cmq5c4d8u013r01aduy7tsn1q",
    cupon_name: "Royal",
    coupon_type: "percentage",
    coupon_description:
      "Una hamburguesa artesanal irresistible, preparada con un medallón de carne vacuna 100% premium de aproximadamente 180 gramos, cocinado a la perfección para conservar toda su jugosidad y sabor. Se sirve en un suave pan brioche ligeramente tostado, que aporta una textura esponjosa y un delicado toque dulce.",
    discount: 20,
    code: "cmq5c4d8u013r01aduy7tsn1qVHQFUK-6",
    discount_units: 0,
    validThrough: "2026-07-24T14:57:00.000Z",
    productCode: "99999",
  },
];

// Especificación de cupones sintéticos (fill hasta 25) — mezcla de porcentaje y monto fijo.
// type "percentage" => discount es un %; type "amount" => discount es un importe fijo ($).
type Spec = { name: string; type: "percentage" | "amount"; value: number; product: string };

const SPECS_SINTETICOS: Spec[] = [
  // Porcentaje
  { name: "Combo 5%", type: "percentage", value: 5, product: "501" },
  { name: "Combo 10%", type: "percentage", value: 10, product: "502" },
  { name: "Combo 15%", type: "percentage", value: 15, product: "503" },
  { name: "Combo 25%", type: "percentage", value: 25, product: "504" },
  { name: "Combo 35%", type: "percentage", value: 35, product: "505" },
  { name: "Combo 40%", type: "percentage", value: 40, product: "506" },
  { name: "Combo 45%", type: "percentage", value: 45, product: "507" },
  { name: "Combo 50%", type: "percentage", value: 50, product: "508" },
  { name: "Combo 60%", type: "percentage", value: 60, product: "509" },
  { name: "Combo 70%", type: "percentage", value: 70, product: "510" },
  // Monto fijo
  { name: "Bono $200", type: "amount", value: 200, product: "601" },
  { name: "Bono $300", type: "amount", value: 300, product: "602" },
  { name: "Bono $500", type: "amount", value: 500, product: "603" },
  { name: "Bono $750", type: "amount", value: 750, product: "604" },
  { name: "Bono $1000", type: "amount", value: 1000, product: "605" },
  { name: "Bono $1250", type: "amount", value: 1250, product: "606" },
  { name: "Bono $1500", type: "amount", value: 1500, product: "607" },
  { name: "Bono $2000", type: "amount", value: 2000, product: "608" },
  { name: "Bono $3000", type: "amount", value: 3000, product: "609" },
  { name: "Bono $5000", type: "amount", value: 5000, product: "610" },
  { name: "Bono $7500", type: "amount", value: 7500, product: "611" },
];

// Token de 6 chars determinístico por índice (couponBookKey + este token + "-6", ver §9.2).
const token6 = (idx: number): string => "MB" + String(idx).padStart(4, "0");

const cuponSintetico = (spec: Spec, idx: number): BigPonsCoupon => {
  const discountId = ("cmockbp" + String(idx).padStart(4, "0")).padEnd(25, "0");
  const tok = token6(idx);
  return {
    cupon_id: `${tok}-17827620000${String(idx).padStart(2, "0")}`,
    discount_id: discountId,
    cupon_name: spec.name,
    coupon_type: spec.type,
    coupon_description: spec.name,
    code: `${discountId}${tok}-6`,
    discount: spec.value,
    discount_units: 0,
    validThrough: "2026-12-31T23:59:00.000Z",
    productCode: spec.product,
  };
};

// 25 cupones para el usuario de test: 4 reales + 21 sintéticos (10 %, 11 monto fijo).
const CUPONES_TEST: BigPonsCoupon[] = [
  ...CUPONES_REALES,
  ...SPECS_SINTETICOS.map((s, i) => cuponSintetico(s, i + 1)),
];

// Cupones activados por cliente, indexados por Loyalty ID.
export const MOCK_COUPONS_BY_USER: Record<string, BigPonsCoupon[]> = {
  // Usuario de entorno TEST (§9). Vinculado al tenant 4558 / partner 5. 25 cupones.
  "BP-37373738-D0CQ": CUPONES_TEST,

  // Usuario de entorno DEV (§3). Cupones de ejemplo.
  "BP-99999999-KCE3": [
    {
      cupon_id: "LFXYF3-1779389718946",
      discount_id: "cmndjqly0001e01ada34d4nbp",
      cupon_name: "15% de descuento en producto 657",
      coupon_type: "percentage",
      coupon_description: "15% de descuento en producto 657",
      code: "cmndjqly0001e01ada34d4nbpLFXYF3-6",
      discount: 15,
      discount_units: 0,
      validThrough: null,
      productCode: "657",
    },
    {
      cupon_id: "P7N2SK-1778608328177",
      discount_id: "cmoric09w006e01adfg5d2d8q",
      cupon_name: "BIG PONS SIMPLE",
      coupon_type: "percentage",
      coupon_description: "BIG PONS SIMPLE",
      code: "cmoric09w006e01adfg5d2d8qP7N2SK-6",
      discount: 30,
      discount_units: 0,
      validThrough: "2026-07-31T17:27:00.000Z",
      productCode: "800",
    },
  ],
};
