---
name: sab-bechdo-backend-architecture
overview: Plan for code, folder structure, and core practices for a production-ready Node.js (Express + TypeScript) backend for Sab-Bechdo. Covers structure, performance, and security only; testing will be added later.
todos:
  - id: bootstrap-backend-project
    content: Bootstrap `Sab-Bechdo-Backend` with Node.js 22 LTS, TypeScript, ESLint, Prettier, and basic npm scripts.
    status: pending
  - id: define-src-structure
    content: Create the `src` folder structure (config, core, middleware, routes, modules, models, common, jobs, health) with app.ts and server.ts at src root.
    status: pending
  - id: setup-config-and-env
    content: Implement configuration loader in `config/index.ts`, environment variable validation, and `.env.example`.
    status: pending
  - id: setup-logger-and-error-handling
    content: Add structured logger configuration and centralized error handling with custom error classes and Express error middleware.
    status: pending
  - id: setup-express-app
    content: Implement `src/app.ts` and `src/server.ts` with Express 5, Helmet, CORS, JSON/body parsing, request logging, health checks, and graceful shutdown.
    status: pending
  - id: implement-auth-or-users-module
    content: Implement the first feature module (auth or users) using routes, controllers, services, repositories, and validation schemas inside the module.
    status: pending
  - id: add-security-middlewares
    content: Integrate validation, rate limiting, and auth middlewares for critical routes following OWASP and Node.js security best practices.
    status: pending
isProject: false
---

# Sab-Bechdo Backend Architecture Plan

## 1. High-Level Goals

- **Clean architecture**: Clear separation of concerns (routes → controllers → services → repositories → database), fully typed with TypeScript.
- **Secure by default**: OWASP-aligned security (headers, validation, auth, rate limiting, safe configs).
- **Performance-ready**: Stateless design, structured logging, observability, and ready for horizontal scaling.
- **Modular & feature-based**: Group code by domain (e.g. users, listings, orders, payments) to support growth.

## 2. Tech Stack & Core Decisions

- **Runtime**: Node.js 22 LTS.
- **Language**: TypeScript (strict mode enabled).
- **HTTP Framework**: Express 5.x.
- **Database layer**: Start with an abstraction-friendly design (repositories + models). Concrete choice (e.g. MongoDB + Mongoose) can be plugged in without changing upper layers.
- **Package manager**: npm (or pnpm if you prefer later; plan keeps it generic).
- **Configuration**: Environment variables with a typed config loader and schema validation.
- **Validation**: Schema-based validation (e.g. Zod/Joi) at the edge (request layer).
- **Logging**: Structured logger (e.g. pino or winston) with correlation IDs.
- **Testing**: Jest or Vitest (unit + integration) with supertest for HTTP tests.

## 3. Root Project Structure

In the repo root, for the backend we will have:

- `**Sab-Bechdo-Backend/`**
  - `package.json` – scripts, dependencies, engines.
  - `tsconfig.json` – TypeScript config (strict, path aliases for `@core/*`, `@modules/*`).
  - `tsconfig.build.json` – build-only config (excludes tests, tooling).
  - `.eslintrc.cjs` / `.eslint.config.mjs` – lint rules aligned with your style.
  - `.prettierrc` – formatting rules.
  - `.editorconfig` – consistent editor settings.
  - `.env.example` – documented env vars (no secrets).
  - `README.md` – how to run, build, test.
  - `scripts/` – optional automation scripts (seed, migration helpers, etc.).
  - `dist/` – compiled output (ignored by git; generated from `src/`).
  - `src/` – all application source code (see below).
  - `tests/` – integration/e2e tests (if not colocated with modules).

## 4. `src/` Folder Structure (Layered + Modular)

Recommended structure inside `[Sab-Bechdo-Backend/src](Sab-Bechdo-Backend/src)`:

- `src/`
  - `app.ts` – create and configure the Express app (routes, middleware).
  - `server.ts` – process bootstrap, listening on port, graceful shutdown.
  - `config/` – configuration and initialization.
    - `config/index.ts` – central config loader (reads env, validates schema).
    - `config/logger.ts` – logger instance configuration.
    - `config/database.ts` – database client/ORM initialization.
    - `config/redis.ts` – optional cache/queue client init.
  - `core/` – cross-cutting, framework-agnostic core.
    - `core/errors/` – custom error classes and error helpers.
    - `core/http/` – response helpers, pagination, API response types.
    - `core/types/` – shared TypeScript types/interfaces.
    - `core/auth/` – auth helpers (JWT, password hashing) that don’t depend on Express.
  - `middleware/` – Express middleware.
    - `middleware/error-handler.ts` – centralized error handling.
    - `middleware/request-logger.ts` – request logging with correlation IDs.
    - `middleware/auth.ts` – authentication/authorization guards.
    - `middleware/validation.ts` – glue between validators and Express.
    - `middleware/rate-limit.ts` – rate limiting for critical routes.
  - `routes/` – top-level route registration.
    - `routes/index.ts` – mounts feature routers (`/auth`, `/users`, `/listings`, etc.).
  - `modules/` – feature-based modules (domain-driven structure).
    - `modules/users/`
      - `users.routes.ts` – defines Express routes for users.
      - `users.controller.ts` – HTTP layer (parse, call services, map responses).
      - `users.service.ts` – business logic (no Express imports here).
      - `users.repository.ts` – data access (DB queries via ORM/driver).
      - `users.entity.ts` or `users.model.ts` – entity definitions / ORM models.
      - `users.validation.ts` – DTO schemas for inputs/outputs.
      - `__tests__/` – unit tests for this module (optional colocated tests).
    - `modules/auth/` – login, signup, refresh tokens, password reset.
    - `modules/listings/` – products/items listed for sale.
    - `modules/orders/` – orders, bookings, transactions.
    - `modules/payments/` – payment provider integration.
  - `common/` – shared utilities that are not domain-specific.
    - `common/constants.ts` – enums, app-wide constants.
    - `common/utils.ts` – generic helpers.
    - `common/mappers/` – mapping between DB models and DTOs/domain objects.
  - `validations/` – global validation schemas (if not fully inside modules).
  - `jobs/` – background jobs (e.g. queues, cron tasks) if needed.
  - `subscribers/` – event listeners for domain events or message queues.
  - `loaders/` – optional module loaders (e.g. `loadExpress`, `loadDatabase`).
  - `health/` – health check endpoints and readiness probes.

This structure:

- Keeps **core domain logic** in `modules/*/service.ts` and `modules/*/repository.ts`.
- Lets you test services and repositories without the HTTP layer.
- Allows features to evolve independently (add `modules/reviews`, `modules/notifications`, etc.).

## 5. Code Structure & Patterns

### 5.1 Layers & Responsibilities

- **Routes** (`routes/*.ts` or `modules/*/*.routes.ts`):
  - Define the URL paths and HTTP methods.
  - Attach middlewares (auth, validation, rate limiting).
  - No business logic or database calls.
- **Controllers** (`modules/*/*.controller.ts`):
  - Receive validated input from Express.
  - Call services and map domain results into HTTP responses.
  - Handle mapping of domain errors to HTTP status codes.
- **Services** (`modules/*/*.service.ts`):
  - Contain business rules and use-cases (e.g. "createListing", "placeOrder").
  - Orchestrate calls to repositories, other services, and external APIs.
  - Are fully testable via unit tests.
- **Repositories** (`modules/*/*.repository.ts`):
  - Encapsulate data access (SQL/NoSQL, caches).
  - Expose simple methods like `findById`, `create`, `listByFilter`.
  - Hide DB/ORM details from upper layers.
- **Entities / Models** (`*.entity.ts` / `*.model.ts`):
  - Represent domain entities and map to DB structures.

### 5.2 TypeScript Practices

- Enable strict mode and noImplicitAny in `tsconfig.json`.
- Use interfaces/types for DTOs, service contracts, and repository contracts.
- Use enums or string literal unions for fixed value sets (status, roles, etc.).
- Define reusable generic types for paginated results, API responses, etc.

### 5.3 Error Handling Strategy

- Create base `AppError` class under `core/errors` with:
  - `message`, `statusCode`, `code`, `isOperational` flags.
- Extend for common errors: `ValidationError`, `AuthError`, `NotFoundError`, etc.
- Centralize error middleware (`middleware/error-handler.ts`) to:
  - Log error with context.
  - Map error types to HTTP responses without leaking internal details.
  - Prevent unhandled promise rejections.

## 6. Security Foundations

### 6.1 HTTP-Level Security

- Use **Helmet** early in `app.ts` to set secure headers.
- Configure **CORS** to only allow trusted frontend origins, not `*` in production.
- Disable **x-powered-by** header.

### 6.2 Authentication & Authorization

- Use **JWT-based** or **session-based** authentication with:
  - HttpOnly, Secure cookies (if cookie-based) or Authorization headers (if token-based).
  - Short-lived access tokens and refresh tokens with rotation.
- Store password hashes using a strong algorithm (argon2 or bcrypt with proper cost).
- Implement role-based or permission-based authorization in `middleware/auth.ts`.

### 6.3 Input Validation & Sanitization

- Define validation schemas (e.g. Zod/Joi) close to each route or module:
  - Request body, query, params, and headers are validated and sanitized.
  - Only whitelisted fields are accepted.
- Use **validation middleware** to convert validation results into consistent errors.

### 6.4 Rate Limiting & Abuse Prevention

- Use `express-rate-limit` (or a similar library) with:
  - Stricter limits on login/auth routes.
  - Global limits for general APIs.
- Back rate limiting with **Redis** when running multiple instances.

### 6.5 Secure Config & Secrets

- Never commit real secrets; use `.env` files + a secrets manager in production.
- Centralize env access in `config/index.ts` with validation:
  - Ensure required env vars are present and valid at startup.

### 6.6 Dependency & Vulnerability Management

- Regularly run `npm audit` (or Snyk) and keep dependencies updated.
- Limit the number of third-party packages to those that are well-maintained and necessary.

## 7. Performance & Scalability

### 7.1 Stateless Design & Horizontal Scaling

- Make each API stateless: no in-memory user sessions or per-instance state.
- Use shared stores (DB, Redis, message queues) for cross-node coordination.

### 7.2 Efficient I/O and Queries

- Use async/await everywhere and avoid blocking operations on the event loop.
- Ensure DB queries are indexed and paginated.
- Introduce **caching** for read-heavy endpoints (e.g. listing search):
  - Cache responses or query results in Redis with TTLs.

### 7.3 Clustering & Process Management

- Use **PM2** or a similar process manager in production:
  - Run clustered processes equal to CPU cores.
  - Enable zero-downtime restarts and health checks.
- Implement graceful shutdown in `server.ts` to close DB and server connections.

### 7.4 Logging & Monitoring

- Use a structured logger (JSON logs) and include:
  - Request ID / correlation ID.
  - User ID (if authenticated).
  - Duration, status code, and endpoint.
- Add basic health check endpoints under `health/`.
- Integrate with an APM/metrics tool later (Prometheus, OpenTelemetry, etc.).

## 8. Testing Strategy

- **Unit tests** (services, repositories, helpers): colocated under `__tests__/` or in `tests/unit`.
- **Integration tests** (HTTP endpoints): use supertest to spin up the app and test API responses.
- **Test data factories**: helpers to generate valid fixtures for tests.
- Use separate test database/schema and clear it between test runs.

## 9. Initial Implementation Steps (High-Level)

1. **Bootstrap project** in `Sab-Bechdo-Backend` with Node.js 22, TypeScript, ESLint, Prettier.
2. **Implement core config** (`config/index.ts`, `config/logger.ts`, `config/database.ts`).
3. **Set up Express app** in `app.ts` with Helmet, CORS, JSON parsing, request logging.
4. **Add centralized error handling** (`middleware/error-handler.ts`) and base error classes.
5. **Define first module** (e.g. `modules/auth` or `modules/users`) following routes → controllers → services → repositories pattern.
6. **Add security middlewares**: validation, auth, rate limiting for a small set of routes.
7. **Introduce logging & health checks**.
8. **Add tests** for the first module and CI-friendly scripts (`npm test`, `npm run lint`).

This plan will guide the initial setup; we can refine it as we understand more domain-specific needs (payment flows, listing filters, etc.) while keeping the same core structure, security posture, and performance strategy.