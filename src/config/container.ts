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
import { BigPonsService } from "../mocks/BigPons/bigpons.service";
import { BigPonsController } from "../mocks/BigPons/bigpons.controller";
import { buildLogger, Logger } from "./logger";

export interface Container {
  logger: Logger;
  pedidosYaService: PedidosYaService;
  pedidosYaController: PedidosYaController;
  alaxService: AlaxService;
  alaxController: AlaxController;
  bigPonsService: BigPonsService;
  bigPonsController: BigPonsController;
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
    bigPonsService: asClass(BigPonsService).singleton(),
    bigPonsController: asClass(BigPonsController).singleton(),
  });

  return container;
};
