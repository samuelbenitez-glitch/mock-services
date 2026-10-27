import { readFileSync } from "fs";

export interface Destino {
  url: string;
  local: boolean;
}

export interface Respuesta {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

// Headers que no se reenvian: los recalcula fetch / Node o no aplican entre saltos.
const HEADERS_DE_SALTO = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "keep-alive",
  "upgrade",
  "accept-encoding",
  "content-encoding",
  // El CORS lo resuelve este gateway: reenviar Origin hace que la API destino aplique su propia
  // lista de origenes (que no incluye los puertos locales de los fronts) y responda 403.
  "origin",
  "referer",
]);

/**
 * Gateway local para probar los fronts contra APIs Java levantadas en la maquina.
 *
 * - /v1/maxirestonline/{api}/... de las APIs en LOCAL_GATEWAY_ROUTES va a la API local
 *   (ej. catalogos=http://localhost:8080) con el token local (LOCAL_GATEWAY_TOKEN_FILE),
 *   porque las APIs locales solo aceptan tokens firmados con la clave de desarrollo.
 * - Cualquier otra ruta va a LOCAL_GATEWAY_FALLBACK (ej. el gateway de staging) tal cual,
 *   con el token real que manda el front.
 */
export class LocalGatewayService {
  private readonly rutas: Map<string, string>;
  private readonly fallback: string;
  private readonly tokenFile: string;
  readonly origenesPermitidos: string[];

  constructor() {
    this.rutas = new Map(
      (process.env.LOCAL_GATEWAY_ROUTES ?? "")
        .split(",")
        .map((par) => par.trim())
        .filter(Boolean)
        .map((par) => {
          const [api, url] = par.split("=");
          return [api.trim(), url.trim().replace(/\/$/, "")] as [string, string];
        }),
    );
    this.fallback = (process.env.LOCAL_GATEWAY_FALLBACK ?? "").replace(/\/$/, "");
    this.tokenFile = process.env.LOCAL_GATEWAY_TOKEN_FILE ?? "";
    this.origenesPermitidos = (
      process.env.LOCAL_GATEWAY_CORS_ORIGINS ?? "http://localhost:4200,http://localhost:4210"
    )
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }

  /** Destino de la peticion segun el segmento {api} de /v1/maxirestonline/{api}/... */
  resolver(url: string): Destino | null {
    const api = url.match(/^\/v1\/maxirestonline\/([^/?]+)/)?.[1];
    const local = api ? this.rutas.get(api) : undefined;
    if (local) {
      return { url: local + url, local: true };
    }
    return this.fallback ? { url: this.fallback + url, local: false } : null;
  }

  /** El token se lee en cada peticion: si se regenera el archivo no hace falta reiniciar. */
  tokenLocal(): string | null {
    if (!this.tokenFile) return null;
    try {
      return readFileSync(this.tokenFile, "utf8").trim() || null;
    } catch {
      return null;
    }
  }

  async reenviar(
    metodo: string,
    destino: Destino,
    headers: Record<string, string | string[] | undefined>,
    body: Buffer | undefined,
  ): Promise<Respuesta> {
    const salida: Record<string, string> = {};
    for (const [nombre, valor] of Object.entries(headers)) {
      if (valor === undefined || HEADERS_DE_SALTO.has(nombre.toLowerCase())) continue;
      salida[nombre] = Array.isArray(valor) ? valor.join(", ") : valor;
    }
    if (destino.local) {
      const token = this.tokenLocal();
      if (token) salida["authorization"] = `Bearer ${token}`;
    }

    const respuesta = await fetch(destino.url, {
      method: metodo,
      headers: salida,
      body: metodo === "GET" || metodo === "HEAD" || !body?.length ? undefined : body,
      redirect: "manual",
    });

    const headersRespuesta: Record<string, string> = {};
    respuesta.headers.forEach((valor, nombre) => {
      if (!HEADERS_DE_SALTO.has(nombre.toLowerCase())) headersRespuesta[nombre] = valor;
    });
    return {
      status: respuesta.status,
      headers: headersRespuesta,
      body: Buffer.from(await respuesta.arrayBuffer()),
    };
  }
}
