import {
  createContainer,
  asClass,
  asFunction,
  InjectionMode,
  AwilixContainer,
} from "awilix";
import { PedidosYaService } from "../mocks/PedidosYa/pedidosya.service";
import { PedidosYaController } from "../mocks/PedidosYa/pedidosya.controller";
import { AlaxService } from "../mocks/Alax/alax.service";
import { AlaxController } from "../mocks/Alax/alax.controller";
import { buildLogger, Logger } from "./logger";

export interface Container {
  logger: Logger;
  pedidosYaService: PedidosYaService;
  pedidosYaController: PedidosYaController;
  alaxService: AlaxService;
  alaxController: AlaxController;
}

export const buildContainer = (): AwilixContainer<Container> => {
  const container = createContainer<Container>({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    logger: asFunction(buildLogger).singleton(),
    pedidosYaService: asClass(PedidosYaService).singleton(),
    pedidosYaController: asClass(PedidosYaController).singleton(),
    alaxService: asClass(AlaxService).singleton(),
    alaxController: asClass(AlaxController).singleton(),
  });

  return container;
};
