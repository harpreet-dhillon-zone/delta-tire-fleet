# Delta Tire Fleet

Vite + React + TypeScript + Tailwind frontend, deployed as a Cloudflare Worker
with static assets. API requests are handled by a Hono app running in the
Worker, backed by a D1 database.

## Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS
- **API**: Cloudflare Worker at `src/worker/index.ts`, routed with [Hono](https://hono.dev)
- **Database**: Cloudflare D1, bound as `DB`
- **Static assets + Worker routing**: `[assets]` in `wrangler.toml` serves the
  built frontend; `run_worker_first = ["/api/*"]` routes `/api/*` to the
  Worker instead of the asset handler, and everything else falls back to
  `index.html` (single-page-app routing)

## Project structure

```
src/                # React app
src/worker/index.ts # Hono app handling all /api/* requests
wrangler.toml        # Worker entry, static assets, D1 binding config
```

## Local development

```bash
npm install

# Frontend only (no API/D1) — fast iteration on UI
npm run dev

# Full stack: builds the frontend, then runs the Worker + assets + a local
# D1 instance via wrangler
npm run worker:dev
```

`npm run worker:dev` builds the app and runs `wrangler dev`, which serves the
built frontend as static assets, runs `src/worker/index.ts` for `/api/*`
requests, and provides a local D1 database bound as `DB`. Hit
`http://127.0.0.1:8787/api/health` to confirm the API and D1 binding are
wired up.

## First-time D1 setup

```bash
# Create the database (once per Cloudflare account)
npx wrangler d1 create delta-fleet-db
```

Copy the `database_id` from the output into `wrangler.toml` under
`[[d1_databases]]`.

## Deployment

Deploy manually from the CLI:

```bash
npx wrangler login
npm run deploy
```

`npm run deploy` builds the app and runs `wrangler deploy`, which uploads
`src/worker/index.ts`, the built static assets, and applies the bindings in
`wrangler.toml` (including the `DB` binding — no separate dashboard step
needed).

To deploy automatically on push instead, connect the repo under
**Workers & Pages → your Worker → Settings → Build** (Workers Builds) and
point the build command at `npm run build`, or wire up a CI workflow that
runs `npm run deploy` with a `CLOUDFLARE_API_TOKEN` secret.

## Migrating to a different Cloudflare account

Use this when moving the project to a new Cloudflare account (e.g. ownership
transfer, org split).

### 1. Export and import the D1 database

```bash
# In the OLD account
npx wrangler d1 export delta-fleet-db --output backup.sql

# Log into the NEW account (wrangler logout / wrangler login, or use a
# separate CLOUDFLARE_API_TOKEN), then create the destination database
npx wrangler d1 create delta-fleet-db
npx wrangler d1 execute delta-fleet-db --file backup.sql
```

Update `database_id` in `wrangler.toml` to the new database's ID.

### 2. Reconnect Git

If you're using Workers Builds (git-connected deploys), the connection isn't
transferable between accounts — in the new account, go to
**Workers & Pages → Create → Import a repository**, select the same Git
repo, and reconfigure the build command (`npm run build`) and bindings from
the Deployment section above. Once the new Worker is live, disconnect the
Workers Builds integration on the old account to avoid duplicate deployments.
If you deploy via CLI/CI instead, just update the `CLOUDFLARE_API_TOKEN`
(and account ID, if pinned) used by your deploy step.

### 3. Recreate the Cloudflare Access app (if used)

If the old account had a Cloudflare Access application protecting this
Worker:

1. In the new account, go to **Zero Trust → Access → Applications → Add an
   application → Self-hosted**.
2. Point it at the new Worker's domain (`*.workers.dev` or your custom
   domain once re-attached).
3. Recreate the access policies (allowed emails/groups/IdP rules) from the
   old app — these do not migrate automatically.
4. If using a custom domain, update its DNS to point at the new account's
   Worker, and re-verify domain ownership.

### 4. Verify

Hit `/api/health` on the new deployment and confirm it returns
`{"status":"ok","db":true}`.
