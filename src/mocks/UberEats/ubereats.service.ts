import { Logger } from "../../config/logger";
import uberOrder from "./ubereats.order.json";
import uberToken from "./ubereats.token.json";

/**
 * Mock de la API de UberEats.
 * Resuelve el login OAuth (token fijo) y el detalle de una orden (respuesta fija).
 */
export class UberEatsService {
  constructor(private logger: Logger) {}

  /**
   * POST /oauth/v2/token. Devuelve un token fijo (no valida nada de lo recibido).
   */
  login() {
    this.logger.info("UberEats mock: login -> token fijo");
    return uberToken;
  }

  /**
   * GET /v1/delivery/order/{order_id}. Devuelve una orden fija (no valida cabeceras).
   * El {@code order.id} de la respuesta se reemplaza por el {@code orderId} recibido por parametro.
   */
  getOrder(orderId: string) {
    this.logger.info({ orderId }, "UberEats mock: getOrder -> orden fija (id dinamico)");
    // Clonamos para no mutar el JSON importado (cache del modulo).
    const order = structuredClone(uberOrder);
    order.order.id = orderId;
    return order;
  }
}
