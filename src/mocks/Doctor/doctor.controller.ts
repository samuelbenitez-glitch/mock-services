import { FastifyRequest, FastifyReply } from "fastify";
import { DoctorService } from "./doctor.service";

interface DoctorParams {
  producto: string;
}

interface DoctorBody {
  tabla?: string;
}

export class DoctorController {
  constructor(private doctorService: DoctorService) {}

  /**
   * POST /doctor/:producto — espeja el endpoint del api-doctor (PHP).
   *
   * Flujo:
   *  1. Extrae el token del header Authorization (Bearer) y decodifica el codcli.
   *     Si falta el header o el token es invalido -> 401 (igual que auth() en PHP).
   *  2. Toma el filtro de tablas del body { "tabla": "..." } (opcional).
   *  3. Delega en el service, que decide 201 (nuevo) o 200 (ya existia).
   */
  async generarDoctor(
    request: FastifyRequest<{ Params: DoctorParams; Body: DoctorBody }>,
    reply: FastifyReply,
  ) {
    const codcli = this.extraerCodCli(request.headers["authorization"]);

    if (!codcli) {
      request.log.warn(
        { url: request.url },
        "Doctor mock: peticion no autorizada (token ausente o invalido)",
      );
      return reply.status(401).send({ message: "no autorizado" });
    }

    const producto = request.params.producto;
    const filtro = request.body?.tabla ?? "";

    request.log.info(
      { producto, codcli, filtro },
      "Doctor mock: peticion recibida POST /doctor/:producto",
    );

    // Simulacion de error de servidor: el cliente 55555 siempre falla con 500.
    if (codcli === "55555") {
      request.log.error(
        { producto, codcli },
        "Doctor mock: error simulado (codcli 55555 -> 500)",
      );
      return reply
        .status(500)
        .send({ message: `Error procesando Doctor:${producto.toUpperCase()} Cliente: ${codcli}` });
    }

    const resultado = this.doctorService.procesar(producto, codcli, filtro);
    return reply.status(resultado.status).send(resultado.body);
  }

  /**
   * Decodifica el payload del JWT y devuelve el codcli.
   * NO valida la firma (es un mock): solo lee el payload base64url.
   * Devuelve null si no hay header, no es un JWT o no trae codcli.
   */
  private extraerCodCli(
    authorization: string | undefined,
  ): string | null {
    if (!authorization) {
      return null;
    }

    // Soporta "Bearer <token>" (case-insensitive) o el token pelado.
    const token = authorization.replace(/^bearer\s+/i, "").trim();
    const partes = token.split(".");
    if (partes.length < 2) {
      return null;
    }

    try {
      const payloadJson = Buffer.from(partes[1], "base64url").toString("utf8");
      const payload = JSON.parse(payloadJson) as { codcli?: string | number };
      if (payload.codcli === undefined || payload.codcli === null) {
        return null;
      }
      return String(payload.codcli);
    } catch {
      return null;
    }
  }
}
