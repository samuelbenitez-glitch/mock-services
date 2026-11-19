import { FastifyInstance } from "fastify";
import { BilleteraController } from "./billetera.controller";

const BASE = "/v1/maxirestonline/apibilletera/v1/api/billetera";

// Rutas estáticas: le ganan al comodín /v1/* del gateway local, así que el resto de api-wallet (activar, cashout,
// alias, etc.) sigue yendo al fallback. El preflight OPTIONS lo responde el gateway.
export const registerBilleteraRoutes = (server: FastifyInstance, controller: BilleteraController) => {
  server.get(`${BASE}/estado`, controller.estado.bind(controller));
  server.get(`${BASE}/cuentas`, controller.cuentas.bind(controller));
  server.get(`${BASE}/cuenta/saldo`, controller.saldo.bind(controller));
  server.get(`${BASE}/cuenta/movimientos`, controller.movimientos.bind(controller));

  // Control del escenario: GET lo muestra; PUT { balance?, codBilleteraCuentaEstado?, cvu?, alias? } lo cambia.
  server.get("/mock/billetera", controller.verEscenario.bind(controller));
  server.put("/mock/billetera", controller.cambiarEscenario.bind(controller));
};
