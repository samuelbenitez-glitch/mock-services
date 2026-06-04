# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Mock HTTP service that emulates third-party integration APIs (currently PedidosYa) so other systems can be developed/tested against stable, fake responses. Stack: TypeScript + Fastify + Awilix (DI).

## Commands

```bash
npm run dev      # tsx watch src/index.ts — hot-reload dev server
npm run build    # tsc — compile to dist/
npm start        # node dist/index.js — run compiled build
```

There is no test runner or linter configured (`npm test` is a placeholder that exits 1). The server listens on `PORT` from `.env` (3101 locally; falls back to 3000 if unset) on host `0.0.0.0`.

## Architecture

The app wires everything together in `src/index.ts`: it builds the Awilix container, creates the Fastify server, resolves the controller from the container, and registers routes — in that order. Adding a new mock integration means following the same per-vendor pattern and repeating these wiring steps in `index.ts`.

**Per-vendor module pattern** (see `src/PedidosYa/`): each integration is a folder with three files — `*.service.ts` (business logic + mock data), `*.controller.ts` (Fastify request/reply handling, defines `Params`/`Body` interfaces), and `*.routes.ts` (a `register<Vendor>Routes(server, controller)` function). The controller depends on the service; both are registered as singletons.

**Dependency injection** (`src/config/container.ts`): Awilix uses `InjectionMode.CLASSIC`, so constructor parameter *names* must match registered token names exactly (e.g. a constructor param named `pedidosYaService` resolves the `pedidosYaService` registration). Register every new service/controller here and add it to the `Container` interface.

**Two separate loggers — know which is which:**
- `src/config/server.ts` configures Fastify's built-in pino logger with `pino-pretty` (console only). This is what `request.log` uses in controllers.
- `src/config/logger.ts` (`buildLogger`, registered as the `logger` token) is a *separate* pino instance writing daily-rotated gzipped files to `storage/logs/` (10-file retention). Services receive this via DI. It is **not** connected to Fastify's request logging.

## Conventions & gotchas

- Mock data lives inline in the service as a `Record<chainCode, ...>` map (e.g. `CHAIN001`, `CHAIN002`). Extend catalogs by editing that map.
- The catalog write endpoint is **`PUT /v2/chains/:chainCode/catalog`** (the README says POST — the code is the source of truth). `GET /v2/chains/:chainCode/catalog` reads it. `GET /health` returns status + timestamp.
- `createCatalog` currently does not persist; it logs the payload and returns existing mock data. The commented-out 500 block in the controller is a manual switch for simulating server errors during testing.
- Code, comments, and commit messages are in Spanish.
- `src/Alax/` holds only an API reference PDF (`Api-Rest.pdf`) — the spec for a not-yet-implemented integration, no code yet.
