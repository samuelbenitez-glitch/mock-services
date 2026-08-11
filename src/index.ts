import dotenv from "dotenv";
import { createServer } from "./config/server";
import { buildContainer } from "./config/container";
import { registerPedidosYaRoutes } from "./mocks/PedidosYa/pedidosya.routes";
import { registerAlaxRoutes } from "./mocks/Alax/alax.routes";
import { registerBigPonsRoutes } from "./mocks/BigPons/bigpons.routes";
import { registerUberEatsRoutes } from "./mocks/UberEats/ubereats.routes";
import { registerDeliveryRoutes } from "./mocks/Delivery/delivery.routes";
import { registerErrorHandler } from "./config/error-handler";
import { registerRequestLogger } from "./config/request-logger";

// Configurar dotenv
dotenv.config();

const start = async () => {
  try {
    // Crear el contenedor de dependencias
    const container = buildContainer();

    // Crear el servidor Fastify
    const server = createServer();

    // Registrar el middleware global de captura de errores (log a archivo)
    const logger = container.resolve("logger");
    registerErrorHandler(server, logger);

    // Registrar el middleware global de logueo de peticiones (log a archivo)
    registerRequestLogger(server, logger);

    // Obtener los controladores del contenedor
    const pedidosYaController = container.resolve("pedidosYaController");
    const alaxController = container.resolve("alaxController");
    const bigPonsController = container.resolve("bigPonsController");
    const uberEatsController = container.resolve("uberEatsController");
    const deliveryController = container.resolve("deliveryController");

    // Registrar las rutas de los mocks
    registerPedidosYaRoutes(server, pedidosYaController);
    registerAlaxRoutes(server, alaxController);
    registerBigPonsRoutes(server, bigPonsController);
    registerUberEatsRoutes(server, uberEatsController);
    registerDeliveryRoutes(server, deliveryController);

    // Ruta de health check
    server.get("/health", async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    });

    // Iniciar el servidor
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    await server.listen({ port, host: "0.0.0.0" });

    console.log(`Server is running on http://0.0.0.0:${port}`);
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
