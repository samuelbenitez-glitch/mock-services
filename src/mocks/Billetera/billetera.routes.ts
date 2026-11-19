import { FastifyInstance } from "fastify";
import { BilleteraController } from "./billetera.controller";

const BASE = "/v1/maxirestonline/apibilletera/v1/api/billetera";

// Atiende TODO apibilletera. Las rutas estáticas y el comodín de BASE le ganan al comodín /v1/* del gateway local
// (find-my-way prefiere el prefijo más largo), así que nada de la billetera se reenvía a staging. El preflight OPTIONS
// lo sigue respondiendo el gateway (el comodín de acá no registra OPTIONS).
export const registerBilleteraRoutes = (server: FastifyInstance, controller: BilleteraController) => {
  const c = controller;

  // Consultas
  server.get(`${BASE}/estado`, c.estado.bind(c));
  server.get(`${BASE}/cuentas`, c.cuentas.bind(c));
  server.get(`${BASE}/cuenta/saldo`, c.saldo.bind(c));
  server.get(`${BASE}/cuenta/movimientos`, c.movimientos.bind(c));
  server.get(`${BASE}/onboarding/url`, c.onboardingUrl.bind(c));
  server.get(`${BASE}/cashout/destino`, c.destino.bind(c));

  // Acciones
  server.post(`${BASE}/onboarding`, c.onboarding.bind(c));
  server.post(`${BASE}/cuentas`, c.crearCuenta.bind(c));
  server.post(`${BASE}/activar`, c.activar.bind(c));
  server.post(`${BASE}/cuentas/:cod/sincronizar`, c.sincronizar.bind(c));
  server.put(`${BASE}/cuentas/:cod/alias`, c.modificarAlias.bind(c));
  server.post(`${BASE}/cashout`, c.cashout.bind(c));

  // Lo que no está mockeado: 501 (no va a staging)
  server.route({
    method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    url: `${BASE}/*`,
    handler: c.noMockeada.bind(c),
  });

  // Control del escenario: GET lo muestra; PUT { balance?, codBilleteraCuentaEstado?, cvu?, alias? } lo cambia.
  server.get("/mock/billetera", c.verEscenario.bind(c));
  server.put("/mock/billetera", c.cambiarEscenario.bind(c));
};
