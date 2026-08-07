import { FastifyRequest, FastifyReply } from "fastify";
import { UberEatsService } from "./ubereats.service";

export interface OrderParams {
  orderId: string;
}

export class UberEatsController {
  constructor(private uberEatsService: UberEatsService) {}

  /** POST /oauth/v2/token — loguea la peticion y devuelve un token fijo. No valida nada. */
  async login(request: FastifyRequest, reply: FastifyReply) {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        query: request.query,
        headers: request.headers,
        body: request.body,
      },
      "UberEats mock: peticion recibida POST /oauth/v2/token",
    );

    const token = this.uberEatsService.login();
    return reply.status(200).send(token);
  }

  /** GET /v1/delivery/order/:orderId — loguea la peticion y devuelve la orden mockeada. */
  async getOrder(
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply,
  ) {
    const { orderId } = request.params;

    request.log.info(
      {
        orderId,
        method: request.method,
        url: request.url,
        query: request.query,
        headers: request.headers,
      },
      "UberEats mock: peticion recibida GET /v1/delivery/order/:orderId",
    );

    const order = this.uberEatsService.getOrder(orderId);
    return reply.status(200).send(order);
  }
}
