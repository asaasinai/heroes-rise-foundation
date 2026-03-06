# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Heroes Rise Foundation — a Next.js 16 non-profit website with an Express 5 REST API backend (served via Vercel serverless functions) and PostgreSQL database. See `README.md` for the full feature list, API endpoints, and environment variables.

### Services

| Service | Port | Command |
|---------|------|---------|
| Next.js frontend | 3000 | `npm run dev` |
| Express API | Vercel Functions | Runs at `/api/*` via `vercel.json` rewrites (not directly via `npm run dev`) |
| PostgreSQL | 5432 | `sudo pg_ctlcluster 16 main start` |

### Key caveats

- **API routing**: The Express backend at `api/index.ts` is a Vercel serverless function. The `vercel.json` rewrites (`/api/* → api/index.ts`) only work in the Vercel runtime. When using `npm run dev` (Next.js dev server), API routes return 404. The frontend gracefully falls back to hardcoded data in `src/lib/constants.ts`. To test API endpoints locally, run the Express app standalone with `tsx` (create a small wrapper that imports and listens) or use `npx vercel dev` (requires Vercel CLI auth).
- **Environment variables**: Next.js reads from `.env.local`; a standalone Express server does not. Pass env vars explicitly when running the API outside Next.js (e.g. `POSTGRES_URL=... npx tsx dev-server.ts`).
- **PostgreSQL must be running** before starting the dev server if you need database-backed API responses. Start with `sudo pg_ctlcluster 16 main start`.
- **Admin credentials**: The dev database is seeded with `admin@heroesrise.org` / `admin123`. The password hash is generated via `npm run hash:admin -- "admin123"` (crypto HMAC `salt:hash` format).

### Standard commands (see `package.json`)

- `npm run dev` — Start Next.js dev server on port 3000
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type-check (`tsc --noEmit`)
- `npm run hash:admin -- "<password>"` — Generate crypto `salt:hash` for admin user
