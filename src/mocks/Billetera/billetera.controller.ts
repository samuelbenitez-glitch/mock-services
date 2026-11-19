import { FastifyReply, FastifyRequest } from "fastify";
import { BilleteraService, Resultado } from "./billetera.service";
import { LocalGatewayService } from "../LocalGateway/localgateway.service";

interface ParamsCuenta {
  cod: string;
}

interface QueryMovimientos {
  filter?: string;
}

interface QueryDestino {
  aliasCvu?: string;
}

export class BilleteraController {
  // El CORS lo resuelve igual que el gateway local (mismos orígenes permitidos): el front llama a estas rutas con la
  // misma base que al resto de /v1/*.
  constructor(
    private billeteraService: BilleteraService,
    private localGatewayService: LocalGatewayService,
  ) {}

  // ── Consultas ──

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

  async onboardingUrl(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.send(this.billeteraService.onboardingUrl(`${request.protocol}://${request.hostname}`));
  }

  // ── Acciones ──

  async onboarding(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.status(200).send({ mensaje: "Onboarding ya registrado (mock)" });
  }

  /** La wallet del mock siempre existe: el back responde 409 a un segundo alta. */
  async crearCuenta(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.status(409).send({ mensaje: "La billetera ya existe (mock)" });
  }

  async activar(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.send(this.billeteraService.activar());
  }

  async sincronizar(request: FastifyRequest<{ Params: ParamsCuenta }>, reply: FastifyReply) {
    this.cors(request, reply);
    return reply.send(this.billeteraService.sincronizar(Number(request.params.cod)));
  }

  async modificarAlias(request: FastifyRequest<{ Params: ParamsCuenta; Body: { alias?: unknown } }>, reply: FastifyReply) {
    this.cors(request, reply);
    return this.responder(reply, this.billeteraService.modificarAlias(Number(request.params.cod), request.body?.alias));
  }

  async destino(request: FastifyRequest<{ Querystring: QueryDestino }>, reply: FastifyReply) {
    this.cors(request, reply);
    return this.responder(reply, this.billeteraService.destino(request.query.aliasCvu));
  }

  async cashout(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    const resultado = this.billeteraService.cashout(request.body);
    request.log.info({ resultado }, "Billetera mock: cashout");
    return this.responder(reply, resultado, 202);
  }

  /** Cualquier otra ruta de apibilletera: 501, para que nunca vaya a staging. */
  async noMockeada(request: FastifyRequest, reply: FastifyReply) {
    this.cors(request, reply);
    request.log.warn({ metodo: request.method, url: request.url }, "Billetera mock: ruta no mockeada");
    return reply
      .status(501)
      .send({ mensaje: `Billetera mock: ${request.method} ${request.url} no está mockeada (no se reenvía a staging)` });
  }

  // ── Control del escenario ──

  async verEscenario(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(this.billeteraService.obtenerEscenario());
  }

  async cambiarEscenario(request: FastifyRequest, reply: FastifyReply) {
    const resultado = this.billeteraService.actualizarEscenario(request.body ?? {});
    if (resultado.ok) request.log.info({ escenario: resultado.valor }, "Billetera mock: escenario actualizado");
    return this.responder(reply, resultado);
  }

  private responder(reply: FastifyReply, resultado: Resultado<object>, status = 200) {
    if (!resultado.ok) return reply.status(400).send({ mensaje: resultado.errores.join(". "), errores: resultado.errores });
    return reply.status(status).send(resultado.valor);
  }

  private cors(request: FastifyRequest, reply: FastifyReply) {
    const origen = request.headers["origin"];
    if (origen && this.localGatewayService.origenesPermitidos.includes(origen)) {
      reply.header("access-control-allow-origin", origen);
      reply.header("vary", "Origin");
    }
  }
}
