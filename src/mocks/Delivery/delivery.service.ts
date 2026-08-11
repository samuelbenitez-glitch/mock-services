import { Logger } from "../../config/logger";

/**
 * Mock del endpoint de recepcion de pedidos (webhook estilo UberEats).
 * Espeja el endpoint real POST /ubereats/pedido del api-delivery de Spring Boot,
 * pero SIN validar la firma HMAC (X-Uber-Signature). Solo loguea y responde 200.
 */
export class DeliveryService {
  constructor(private logger: Logger) {}

  /**
   * Procesa la notificacion del webhook de pedido.
   * No valida la firma ni el contenido: solo deja registro en el log (archivo) de la
   * firma X-Uber-Signature y el body, y devuelve un resultado fijo
   * (idPedido / codigoExterno / mensaje), igual que ResultadoPedido.
   */
  crearPedido(signature: string | string[] | undefined, body: unknown) {
    this.logger.info(
      { "x-uber-signature": signature ?? null, body },
      "Delivery mock: crearPedido -> resultado fijo (sin validar firma)",
    );

    return {
      idPedido: 1,
      codigoExterno: "MOCK-DELIVERY-0001",
      mensaje: "Pedido recibido por el mock (firma no validada)",
    };
  }
}
