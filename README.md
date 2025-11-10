# Unleashed Middleware Dashboard

Production-ready Next.js 14 dashboard for monitoring the Unleashed → ROar middleware. Stage 1 + 2
baseline includes secure credential management, scheduled health probes, and dashboards for key
Unleashed resources (Products, Sales Orders, Purchase Orders, Stock On Hand).

## Features

- **Dashboard status cards** with GREEN / ORANGE / RED indicators, last success timestamps, and
  rolling error counts per resource.
- **Secure settings** screen that stores Unleashed API credentials encrypted with AES-256-GCM and
  never returns plaintext secrets to the browser.
- **Health probe API routes** (`/api/health/unleashed/[resource]`) that call Unleashed page 1 REST
  endpoints using the official HMAC signature, persist results, and return probe data.
- **Vercel Cron integration** via `/api/cron/probe` to run the full probe suite every 15 minutes.
- **Probe logs** view showing the 50 most recent runs per resource.
- **Prisma data models** for secrets, probe history, upcoming ROar mappings, and pipeline tasks.
- **Tailwind UI** with accessible components and status badges.
- **Jest unit tests** covering the status calculator rules.

## Tech Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS 3
- Prisma 5 (SQLite locally, PostgreSQL ready for production)
- pnpm 10 package management
- Jest + Testing Library for automated tests

## Getting Started (Local Development)

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` from the example and update the encryption key:

   ```bash
   cp .env.example .env
   # replace ENCRYPTION_KEY with a 64+ character random string
   ```

3. Generate the Prisma client and run the first migration:

   ```bash
   pnpm prisma migrate dev --name init
   ```

   > If you are developing in a restricted network and Prisma engine downloads fail, retry with
   > `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 pnpm prisma migrate dev --name init`.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Visit `http://localhost:3000/settings`, enter the Unleashed API ID and API Key, and run a probe
   from the dashboard to verify status changes.

## Scripts

| Command                      | Description                           |
| ---------------------------- | ------------------------------------- |
| `pnpm dev`                   | Start Next.js in development mode     |
| `pnpm build`                 | Build the production bundle           |
| `pnpm start`                 | Run the production server             |
| `pnpm lint`                  | Run ESLint with Next.js rules         |
| `pnpm test`                  | Execute Jest unit tests               |
| `pnpm prisma migrate dev`    | Apply local Prisma migrations         |
| `pnpm prisma migrate deploy` | Apply migrations in production        |
| `pnpm prisma generate`       | Manually regenerate the Prisma client |

## Environment Variables

| Variable              | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `DATABASE_PROVIDER`   | Database provider (`sqlite` locally, `postgresql` in prod) |
| `DATABASE_URL`        | Connection string (`file:./dev.db` for SQLite)             |
| `ENCRYPTION_KEY`      | 32+ character secret used for AES-256-GCM encryption       |
| `NEXT_PUBLIC_APP_URL` | Origin used to scope server actions                        |

## Database Models

- **Secret** — encrypted key/value store for credentials.
- **ProbeResult** — history of health probe executions and metadata payloads.
- **Mapping** — placeholder for future ROar identity mapping.
- **SyncTask** — placeholder for pipeline orchestration and status tracking.

## Deployment (Vercel)

1. Push the repository and open a PR. Vercel should import the project as a Next.js framework app.
2. Configure environment variables:
   - `ENCRYPTION_KEY` — long random string.
   - `DATABASE_PROVIDER` — `postgresql` for Vercel Postgres.
   - `DATABASE_URL` — Vercel Postgres connection string.
   - `NEXT_PUBLIC_APP_URL` — production URL (e.g. `https://middleware.example.com`).
3. Set **Post-build Command**: `npx prisma migrate deploy`.
4. Add a **Vercel Cron Job**: `*/15 * * * *` → `/api/cron/probe`.
5. Deploy, visit `/settings`, supply Unleashed credentials, and trigger probes from the dashboard.

## Security Notes

- Secrets are encrypted with AES-256-GCM using a key derived from `ENCRYPTION_KEY`.
- Server actions and API routes run on the server only; secrets are never exposed to the client.
- Probe results capture HTTP status codes and metadata for auditing.
- The HMAC signature for Unleashed requests uses the canonical query string (lowercased) with the
  API key as the secret.

## Testing & Quality Gates

- `pnpm lint` — ensures code style and TypeScript correctness.
- `pnpm test` — validates the probe status calculator rules.
- Prettier configuration enforces consistent formatting (`pnpm format`).

## Roadmap

- Integrate real ROar credentials and authentication health checks (Stage 3).
- Build pipeline orchestration UI and sync task execution.
- Extend mappings and add Supabase RLS verification where required.

  <!-- {
      "path": "/api/cron/roar-export",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/queue/worker",
      "schedule": "0 0 * * *"
    } -->
