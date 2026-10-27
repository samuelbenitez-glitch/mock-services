import { FastifyReply, FastifyRequest } from "fastify";
import { LocalGatewayService } from "./localgateway.service";

export class LocalGatewayController {
  constructor(private localGatewayService: LocalGatewayService) {}

  /** Preflight CORS: lo responde el gateway, sin ir a la API. */
  async preflight(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.status(204).send();
  }

  /** Reenvia la peticion a la API local o al fallback y devuelve la respuesta tal cual. */
  async reenviar(request: FastifyRequest, reply: FastifyReply) {
    const destino = this.localGatewayService.resolver(request.url);
    this.cors(request, reply);
    if (!destino) {
      return reply
        .status(502)
        .send({ mensaje: `LocalGateway: sin destino para ${request.url} (falta LOCAL_GATEWAY_FALLBACK)` });
    }

    request.log.info(
      { metodo: request.method, destino: destino.url, local: destino.local },
      "LocalGateway: reenviando",
    );
    try {
      const r = await this.localGatewayService.reenviar(
        request.method,
        destino,
        request.headers,
        request.body as Buffer | undefined,
      );
      for (const [nombre, valor] of Object.entries(r.headers)) {
        if (!nombre.toLowerCase().startsWith("access-control-")) reply.header(nombre, valor);
      }
      return reply.status(r.status).send(r.body);
    } catch (error) {
      request.log.error({ destino: destino.url, error }, "LocalGateway: destino no disponible");
      return reply
        .status(502)
        .send({ mensaje: `LocalGateway: no responde ${destino.url} (${(error as Error).message})` });
    }
  }

  private cors(request: FastifyRequest, reply: FastifyReply) {
    const origen = request.headers["origin"];
    if (origen && this.localGatewayService.origenesPermitidos.includes(origen)) {
      reply.header("access-control-allow-origin", origen);
      reply.header("vary", "Origin");
      reply.header("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      reply.header(
        "access-control-allow-headers",
        (request.headers["access-control-request-headers"] as string) ?? "*",
      );
      reply.header("access-control-max-age", "3600");
    }
  }
}
