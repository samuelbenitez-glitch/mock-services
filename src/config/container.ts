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
import { UberEatsService } from "../mocks/UberEats/ubereats.service";
import { UberEatsController } from "../mocks/UberEats/ubereats.controller";
import { DeliveryService } from "../mocks/Delivery/delivery.service";
import { DeliveryController } from "../mocks/Delivery/delivery.controller";
import { buildLogger, Logger } from "./logger";

export interface Container {
  logger: Logger;
  pedidosYaService: PedidosYaService;
  pedidosYaController: PedidosYaController;
  alaxService: AlaxService;
  alaxController: AlaxController;
  bigPonsService: BigPonsService;
  bigPonsController: BigPonsController;
  uberEatsService: UberEatsService;
  uberEatsController: UberEatsController;
  deliveryService: DeliveryService;
  deliveryController: DeliveryController;
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
    uberEatsService: asClass(UberEatsService).singleton(),
    uberEatsController: asClass(UberEatsController).singleton(),
    deliveryService: asClass(DeliveryService).singleton(),
    deliveryController: asClass(DeliveryController).singleton(),
  });

  return container;
};
