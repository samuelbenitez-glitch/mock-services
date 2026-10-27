import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { LocalGatewayController } from "./localgateway.controller";

// Gateway local: todo lo que cuelga de /v1/ (mismas rutas que el api-gateway-firewall).
// Se registra encapsulado para recibir el body crudo (JSON, multipart, etc.) y reenviarlo
// sin tocar, sin afectar los parsers de los demas mocks.
export const registerLocalGatewayRoutes = (
  server: FastifyInstance,
  controller: LocalGatewayController,
) => {
  server.register(async (gateway) => {
    gateway.removeAllContentTypeParsers();
    gateway.addContentTypeParser("*", { parseAs: "buffer" }, (_request, body, done) => {
      done(null, body);
    });

    gateway.options("/v1/*", async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.preflight(request, reply);
    });

    gateway.route({
      method: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
      url: "/v1/*",
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        return controller.reenviar(request, reply);
      },
    });
  });
};
