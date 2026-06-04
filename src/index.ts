import dotenv from "dotenv";
import { createServer } from "./config/server";
import { buildContainer } from "./config/container";
import { registerPedidosYaRoutes } from "./mocks/PedidosYa/pedidosya.routes";
import { registerAlaxRoutes } from "./mocks/Alax/alax.routes";
import { registerErrorHandler } from "./config/error-handler";

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

    // Obtener los controladores del contenedor
    const pedidosYaController = container.resolve("pedidosYaController");
    const alaxController = container.resolve("alaxController");

    // Registrar las rutas de los mocks
    registerPedidosYaRoutes(server, pedidosYaController);
    registerAlaxRoutes(server, alaxController);

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
