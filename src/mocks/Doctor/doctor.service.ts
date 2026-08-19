import { Logger } from "../../config/logger";

export interface ResultadoDoctor {
  status: 200 | 201;
  body: { message: string };
}

/**
 * Mock del endpoint POST /doctor/:producto del api-doctor (PHP).
 *
 * Espeja el comportamiento del "Doctor" real de forma simplificada:
 * - Mantiene EN MEMORIA el conjunto de codigos de cliente (codcli) ya procesados.
 * - Si el codcli NO existe en memoria -> lo guarda y responde 201 (equivale a
 *   "se creo la base de datos del cliente").
 * - Si el codcli YA existe en memoria -> responde 200 (equivale a "la base de
 *   datos ya existia y solo se sincronizo").
 *
 * El mensaje replica el formato exacto del api-doctor:
 *   "Doctor realizado con exito:{PRODUCTO} Cliente: {codcli} Inicio: {hh:mm:ss} Finalizo: {hh:mm:ss} Filtro: {filtro}"
 */
export class DoctorService {
  // Store en memoria: se pierde al reiniciar el proceso (comportamiento de mock).
  private readonly clientesProcesados = new Set<string>();

  constructor(private logger: Logger) {}

  procesar(producto: string, codcli: string, filtro: string): ResultadoDoctor {
    const prod = producto.toUpperCase();
    const yaExistia = this.clientesProcesados.has(codcli);

    if (!yaExistia) {
      this.clientesProcesados.add(codcli);
    }

    const hora = this.horaActual();
    const message =
      `Doctor realizado con exito:${prod} Cliente: ${codcli} ` +
      `Inicio: ${hora} Finalizo: ${hora} Filtro: ${filtro}`;

    this.logger.info(
      { producto: prod, codcli, filtro, yaExistia, status: yaExistia ? 200 : 201 },
      "Doctor mock: procesar",
    );

    return {
      status: yaExistia ? 200 : 201,
      body: { message },
    };
  }

  /** HH:MM:SS de la hora local, igual que date('H:i:s') en PHP. */
  private horaActual(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
}
