import { FastifyReply, FastifyRequest } from "fastify";
import { BilleteraService, EscenarioBilletera } from "./billetera.service";
import { LocalGatewayService } from "../LocalGateway/localgateway.service";

interface QueryMovimientos {
  filter?: string;
}

export class BilleteraController {
  // El CORS lo resuelve igual que el gateway local (mismos orígenes permitidos): el front llama a estas rutas con la
  // misma base que al resto de /v1/*.
  constructor(
    private billeteraService: BilleteraService,
    private localGatewayService: LocalGatewayService,
  ) {}

  async estado(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.send(this.billeteraService.estado());
  }

  async cuentas(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.send(this.billeteraService.cuentas());
  }

  async saldo(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    const saldo = this.billeteraService.saldo();
    if (!saldo) {
      return reply.status(409).send({ mensaje: "La cuenta de la billetera no está aprobada (mock)" });
    }
    return reply.send(saldo);
  }

  async movimientos(request: FastifyRequest<{ Querystring: QueryMovimientos }>, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.send(this.billeteraService.movimientos(request.query.filter));
  }

  async verEscenario(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.billeteraService.obtenerEscenario());
  }

  async cambiarEscenario(request: FastifyRequest<{ Body: Partial<EscenarioBilletera> }>, reply: FastifyReply) {
    const escenario = this.billeteraService.actualizarEscenario(request.body ?? {});
    request.log.info({ escenario }, "Billetera mock: escenario actualizado");
    return reply.send(escenario);
  }

  private cors(request: FastifyRequest, reply: FastifyReply) {
    const origen = request.headers["origin"];
    if (origen && this.localGatewayService.origenesPermitidos.includes(origen)) {
      reply.header("access-control-allow-origin", origen);
      reply.header("vary", "Origin");
    }
  }
}
