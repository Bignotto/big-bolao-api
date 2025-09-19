# Big Bolão API

## Setup

1. Copy `.env.example` to `.env`.
2. Provide values for Supabase keys, database credentials, and other variables before running the app. `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are only needed when `NODE_ENV` is `test`.

## Development

See `AGENTS.md` for commands and project guidelines.

## Production Startup

- `scripts/start.sh` applies pending migrations with `npx prisma migrate deploy` and then boots the compiled server.
- The script intentionally skips `npx prisma db seed` so production data is never reset during container start.

## Database Seeding

- Entry point: `prisma/seed.ts` orchestrates seeding order.
- Seed modules: live in `prisma/seeds/` and export functions (e.g., `seedUsers`, `seedTeams`).
- Data files: CSVs live in `prisma/data/`.

Folder layout
- `prisma/seeds/`: `tournament.seed.ts`, `teams.seed.ts`, `groupMatches.seed.ts`, `knockoutMatches.seed.ts`, `users.seed.ts`, `scoringRules.seed.ts`, `predictions.seed.ts`
- `prisma/data/`: `teams.csv`, `subsolo2_final_standings.csv`, `subsolo2_guesses.csv`, `user_groups_rows.csv`

Run seeds
- `npx prisma db seed` to seed only
- `npx prisma migrate reset` to reset DB, apply migrations, and seed

Add or change CSV data
- Place new CSVs in `prisma/data/`.
- Read them from a seed module using ESM-safe paths:
  - `import { fileURLToPath } from 'url'`
  - `const resolveLocalPath = (p: string) => fileURLToPath(new URL(p, import.meta.url))`
  - Example: `const filePath = resolveLocalPath('../data/my-data.csv')`
- Avoid using `__dirname` (project uses ES modules).

Create a new seed step
- Add a new file in `prisma/seeds/` exporting a function.
- Use Prisma Client within that function and return when complete.
- Import and call it in `prisma/seed.ts` in the correct order.
