# Mock Services

Proyecto de servicios mock con TypeScript, Fastify y Awilix.

## Estructura del Proyecto

```
mock-services/
├── src/
│   ├── config/
│   │   ├── server.ts          # Configuración del servidor Fastify
│   │   └── container.ts       # Configuración del contenedor Awilix
│   ├── PedidosYa/
│   │   ├── pedidosya.service.ts    # Servicio con datos mockeados
│   │   ├── pedidosya.controller.ts # Controlador HTTP
│   │   └── pedidosya.routes.ts     # Definición de rutas
│   └── index.ts               # Punto de entrada
├── package.json
└── tsconfig.json
```

## Instalación

```bash
npm install
```

## Uso

### Modo desarrollo

```bash
npm run dev
```

### Compilar

```bash
npm run build
```

### Ejecutar en producción

```bash
npm start
```

## Endpoints

### Health Check

```
GET /health
```

### Crear/Actualizar Catálogo

```
POST /v2/chains/:chainCode/catalog
```

**Ejemplo:**

```bash
curl -X POST http://localhost:3000/v2/chains/CHAIN001/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "items": [],
    "metadata": {}
  }'
```

### Obtener Catálogo

```
GET /v2/chains/:chainCode/catalog
```

**Ejemplo:**

```bash
curl http://localhost:3000/v2/chains/CHAIN001/catalog
```

## Datos Mockeados

El servicio incluye datos mockeados para los siguientes códigos de cadena:

- `CHAIN001`: Hamburguesas, pizzas y ensaladas
- `CHAIN002`: Sushi y ramen

## Tecnologías

- **TypeScript**: Lenguaje de programación
- **Fastify**: Framework web rápido y eficiente
- **Awilix**: Contenedor de inyección de dependencias
