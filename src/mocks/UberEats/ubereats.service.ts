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
   * El {@code orderId} solicitado solo se loguea (la orden devuelta es siempre la misma).
   */
  getOrder(orderId: string) {
    this.logger.info({ orderId }, "UberEats mock: getOrder -> orden fija");
    return uberOrder;
  }
}
