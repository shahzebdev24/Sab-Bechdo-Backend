# Sab Bechdo Backend

Backend API for Sab Bechdo marketplace application built with Node.js, Express, and TypeScript.

## Features

- **Authentication System**
  - Email/Password signup and login
  - JWT-based authentication with access and refresh tokens
  - Password reset via email
  - Social authentication (Google, Facebook, Apple)
  - Secure password hashing with bcrypt

- **Security**
  - Helmet for security headers
  - CORS configuration
  - Rate limiting on authentication endpoints
  - Input validation with Zod
  - JWT token verification

- **Architecture**
  - Clean layered architecture (Routes → Controllers → Services → Repositories)
  - TypeScript with strict mode
  - Modular feature-based structure
  - Centralized error handling
  - Structured logging with Pino

## Prerequisites

- Node.js 22 LTS or higher
- npm or pnpm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

3. Update the `.env` file with your actual values

## Development

Run the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Build

Build the TypeScript code:
```bash
npm run build
```

## Production

Start the production server:
```bash
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Lint code with ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/social` - Social authentication
- `GET /api/v1/auth/profile` - Get user profile (requires authentication)

### Health

- `GET /api/v1/health` - Health check
- `GET /api/v1/ready` - Readiness check

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # Server bootstrap and graceful shutdown
├── config/                # Configuration and initialization
│   ├── index.ts          # Config loader with validation
│   └── logger.ts         # Logger configuration
├── core/                  # Cross-cutting concerns
│   ├── auth/             # Auth helpers (JWT, password)
│   ├── errors/           # Custom error classes
│   ├── http/             # HTTP response helpers
│   └── types/            # Shared TypeScript types
├── middleware/            # Express middleware
│   ├── auth.ts           # Authentication middleware
│   ├── error-handler.ts  # Centralized error handling
│   ├── rate-limit.ts     # Rate limiting
│   ├── request-logger.ts # Request logging
│   └── validation.ts     # Input validation
├── modules/               # Feature modules
│   └── auth/             # Authentication module
│       ├── auth.controller.ts
│       ├── auth.entity.ts
│       ├── auth.repository.ts
│       ├── auth.routes.ts
│       ├── auth.service.ts
│       ├── auth.validation.ts
│       └── email.service.ts
├── routes/                # Route registration
│   └── index.ts
└── health/                # Health check endpoints
    └── health.routes.ts
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

ISC
