import { Logger } from "../../config/logger";

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface Catalog {
  chainCode: string;
  items: CatalogItem[];
  totalItems: number;
}

export class PedidosYaService {
  constructor(private logger: Logger) {}

  private mockCatalogData: Record<string, CatalogItem[]> = {
    CHAIN001: [
      {
        id: "1",
        name: "Hamburguesa Clásica",
        description: "Hamburguesa con carne, lechuga, tomate y queso",
        price: 850,
        category: "Hamburguesas",
        available: true,
      },
      {
        id: "2",
        name: "Pizza Margherita",
        description: "Pizza con salsa de tomate, mozzarella y albahaca",
        price: 1200,
        category: "Pizzas",
        available: true,
      },
      {
        id: "3",
        name: "Ensalada César",
        description: "Lechuga romana, pollo, crutones y aderezo césar",
        price: 650,
        category: "Ensaladas",
        available: true,
      },
    ],
    CHAIN002: [
      {
        id: "4",
        name: "Sushi Roll California",
        description: "Roll de salmón, palta y queso crema",
        price: 1450,
        category: "Sushi",
        available: true,
      },
      {
        id: "5",
        name: "Ramen Tonkotsu",
        description: "Fideos en caldo de cerdo con cerdo chashu",
        price: 1350,
        category: "Ramen",
        available: true,
      },
    ],
  };

  async getCatalog(chainCode: string): Promise<Catalog> {
    const items = this.mockCatalogData[chainCode] || [];

    return {
      chainCode,
      items,
      totalItems: items.length,
    };
  }

  async createCatalog(chainCode: string, catalogData: any): Promise<Catalog> {
    // Simulación de creación/actualización de catálogo
    this.logger.info(
      {
        chainCode,
        catalogData: catalogData,
      },
      "Creating/updating catalog",
    );

    // En un escenario real, aquí se guardaría en base de datos
    // Por ahora solo retornamos los datos mockeados existentes o creamos uno nuevo
    const items = this.mockCatalogData[chainCode] || [];

    return {
      chainCode,
      items,
      totalItems: items.length,
    };
  }
}
