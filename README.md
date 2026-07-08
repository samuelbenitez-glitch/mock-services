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

## Ciclo de vida de pedidos (Integration Middleware / Delivery Hero)

Mock de la API real de PedidosYa/Delivery Hero para probar los endpoints MRO de
tomar/rechazar/listo. Emula: auth, actualización de estado y (extra) preparación.

### Login — `POST /v2/login` (⚠️ `application/x-www-form-urlencoded`)

Credenciales válidas (staging): `stg03-plugin-maxisistemas-srl-001` / `iRrI7x4q28`.

```bash
curl -X POST http://localhost:3101/v2/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=stg03-plugin-maxisistemas-srl-001&password=iRrI7x4q28&grant_type=client_credentials"
# → { "access_token": "...", "token_type": "bearer", "expires_in": 1800 }
```

Credenciales incorrectas → `401`.

### Actualizar estado — `POST /v2/order/status/:orderToken`

Requiere header `Authorization: Bearer <token>`. El body varía según `status`:

| Operación | Body |
|---|---|
| Tomar | `{"status":"order_accepted","acceptanceTime":"2026-07-07T16:20:00-03:00"}` (acceptanceTime **requerido**) |
| Rechazar | `{"status":"order_rejected","reason":"ITEM_UNAVAILABLE","message":"opcional"}` (reason del enum de 24 valores) |
| Listo | `{"status":"order_picked_up"}` |

```bash
TOKEN=... # del login
curl -X POST "http://localhost:3101/v2/order/status/ORD123" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"order_accepted","acceptanceTime":"2026-07-07T16:20:00-03:00"}'
# → 200 { "message": "Order status successfully changed." }
```

**Casos de error simulados por el valor del `orderToken`** (para QA):

| Si el orderToken contiene… | Respuesta |
|---|---|
| `NOTFOUND` | `400 { code: ORDER_NOT_FOUND }` |
| `CONFLICT_RETRY` | `409 { currentState: WAITING_FOR_ACKNOWLEDGEMENT }` (reintentable) |
| `CONFLICT_CANCELLED` | `409 { currentState: CANCELLED }` (NO reintentable) |
| `FORBIDDEN` | `403 { code: FORBIDDEN }` (ej. integración indirecta) |
| `SERVERERROR` | `500 { code: INTERNAL_ERROR }` |
| (cualquier otro) | `200` OK |

Sin header `Authorization` o `Bearer EXPIRED` → `401 { code: POS_ERROR }` (para testear el refresh de token).

Validaciones: `status` fuera del enum → `400 INVALID_ORDER_STATUS`; `order_accepted` sin
`acceptanceTime` → `400`; `order_rejected` con `reason` inválido o ausente → `400`.

### Extra — `POST /v2/orders/:orderToken/preparation-completed` (rider Delivery Hero)

`200 { code: OK }`. Token con `NOTFOUND` → `404`; con `CONFLICT` → `409`.

### Extra — `POST /v2/orders/:orderToken/adjust-preparation-time` (logistics delivery)

Body `{"expectedPickupAt":"<date-time>"}` → `204`. Token con `MAXTIME` → `400`,
`NOTFOUND` → `404`, `CONFLICT` → `409`.

## Datos Mockeados

El servicio incluye datos mockeados para los siguientes códigos de cadena:

- `CHAIN001`: Hamburguesas, pizzas y ensaladas
- `CHAIN002`: Sushi y ramen

## Tecnologías

- **TypeScript**: Lenguaje de programación
- **Fastify**: Framework web rápido y eficiente
- **Awilix**: Contenedor de inyección de dependencias
