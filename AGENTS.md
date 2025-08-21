# Big Bolão API - Agent Guide

## Commands

- **Dev**: `npm run dev` (watch mode with tsx)
- **Build**: `npm run build` (tsup)
- **Seed**: `npx prisma db seed` (preloads World Cup teams, tournaments, and matches)
- **Test Unit**: `npm run test:run` or `vitest` (src/useCases/*/*.spec.ts)
- **Test E2E**: `npm run test:e2e` (src/http/*/*.spec.ts)
- **Test Single Unit**: `npm run test:run -- path/to/test.spec.ts`
- **Test Single E2E**: `npm run test:e2e -- path/to/test.spec.ts`
- **Lint**: `npm run lint` / `npm run lint:fix`
- **Coverage**: `npm run test:coverage` / `npm run test:e2e:coverage`

## Architecture

- **Framework**: Fastify + TypeScript (ES modules)
- **Database**: Prisma ORM + PostgreSQL
- **Testing**: Vitest (unit/e2e), Supertest for HTTP tests
- **Auth**: JWT with Fastify JWT plugin
- **Structure**: Clean Architecture (useCases, repositories, controllers)
- **Paths**: `@/*` alias maps to `src/*`

## Data

- **Read-only**: teams, tournaments, and matches are immutable for regular users
- **Admin**: only admin routes may update match records

## Code Conventions

- **Imports**: External libs first, then internal with `@/` prefix, alphabetized with newlines between groups
- **Functions**: camelCase controllers end with `Controller`, use cases end with `UseCase`
- **Files**: camelCase for controllers/services, PascalCase for classes/types
- **Route Functions**: camelCase (e.g., `userRoutes`)
- **Middleware**: files and imports use camelCase with `@/` aliases
- **Schemas**: `$ref` uses `#/components/schemas/SchemaName` style and pools reference `name`
- **Error Handling**: Custom error classes (ResourceNotFoundError, NotParticipantError), Zod validation errors
- **Testing**: Use `createTestApp()` for e2e, in-memory repositories for unit tests, mock factories in `@/test/mocks/`
- **Format**: Prettier (semicolons, single quotes, 100 chars), ESLint with TypeScript strict rules

## Contributing

- **Commits**: use [Conventional Commits](https://www.conventionalcommits.org/) (`type: short description`)

