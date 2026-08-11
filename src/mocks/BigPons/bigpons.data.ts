// Datos mockeados para el mock de BigPons (IT_ROCKS).
//
// Versión simplificada (a pedido): NO se valida ni la Api Key (token) ni el DNI.
// Para cualquier token y cualquier dni se devuelven SIEMPRE los mismos 10 cupones,
// todos de 10% de descuento y con un "code" aleatorio.

import { BigPonsCoupon } from "./bigpons.types";

// Api Keys "válidas": ya no se validan (se deja el export vacío por compatibilidad
// con imports existentes).
export const VALID_API_KEYS: string[] = [];

// Genera un string alfanumérico aleatorio (usado como "code" del cupón).
const randomCode = (len = 24): string => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

// Construye los 10 cupones: todos "percentage" con discount = 10 (10%).
// Se genera UNA sola vez al iniciar el proceso (in-memory): al reiniciar el
// servidor se regeneran (con codes nuevos) y los consumidos "vuelven a aparecer".
const buildCoupons = (): BigPonsCoupon[] =>
  Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    return {
      cupon_id: `MOCK-${randomCode(8)}`,
      discount_id: randomCode(25),
      cupon_name: `Cupón 10% #${n}`,
      coupon_type: "percentage",
      coupon_description: `Descuento del 10% (cupón #${n})`,
      code: randomCode(24),
      discount: 10,
      discount_units: 0,
      validThrough: "2099-12-31T23:59:00.000Z",
      // productCode: id de producto sobre el que aplica (para checkDiscounts).
      productCode: String(500 + n),
    };
  });

// Lista global de cupones (la misma para cualquier dni / token).
export const MOCK_COUPONS: BigPonsCoupon[] = buildCoupons();
