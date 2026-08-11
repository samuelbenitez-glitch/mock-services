import { FastifyRequest, FastifyReply } from "fastify";
import { DeliveryService } from "./delivery.service";

export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  /**
   * POST /ubereats/pedido — espeja el webhook de pedidos del api-delivery.
   * Solo loguea el body y la firma X-Uber-Signature. NO valida la firma HMAC.
   * Siempre responde 200.
   */
  async crearPedido(request: FastifyRequest<{Body: {meta?: {resource_id?: string}}}>, reply: FastifyReply) {
    // El header llega en minusculas normalizado por Fastify.
    const signature = request.headers["x-uber-signature"];

    request.log.info(
      {
        method: request.method,
        url: request.url,
        query: request.query,
        headers: request.headers,
        body: request.body,
      },
      "Delivery mock: peticion recibida POST /ubereats/pedido",
    );

    if(request.body?.meta?.resource_id?.startsWith("err")) {
      return reply.status(500).send();
    }

    const resultado = this.deliveryService.crearPedido(signature, request.body);
    return reply.status(200).send(resultado);
  }
}
