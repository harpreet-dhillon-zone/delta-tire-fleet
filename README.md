# Delta Tire Fleet

Vite + React + TypeScript + Tailwind frontend, deployed on Cloudflare Pages with a
Hono-based Pages Functions API and a D1 database.

## Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS
- **API**: Cloudflare Pages Functions, catch-all route at `functions/api/[[route]].ts`, routed with [Hono](https://hono.dev)
- **Database**: Cloudflare D1, bound as `DB`

## Project structure

```
src/                        # React app
functions/api/[[route]].ts  # Hono app handling all /api/* requests
wrangler.toml                # Pages + D1 binding config
```

## Local development

```bash
npm install

# Frontend only (no API/D1)
npm run dev

# Full stack: builds the frontend, then serves it + Pages Functions
# with a local D1 instance via wrangler
npm run pages:dev
```

`npm run pages:dev` builds the app and runs `wrangler pages dev ./dist --d1=DB`,
which serves `functions/` alongside the built frontend and provides a local
D1 database bound as `DB`. Hit `http://127.0.0.1:8788/api/health` to confirm
the API and D1 binding are wired up.

## First-time D1 setup

```bash
# Create the database (once per Cloudflare account)
npx wrangler d1 create delta-tire-fleet-db
```

Copy the `database_id` from the output into `wrangler.toml` under
`[[d1_databases]]`.

## Deployment

1. Push this repo to GitHub/GitLab.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages →
   Connect to Git** and select the repo.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Under **Settings → Functions → D1 database bindings**, bind `DB` to the
   `delta-tire-fleet-db` database created above (this must be set for both
   Production and Preview environments).
5. Deploy. Every push to the connected branch triggers a new deployment.

You can also deploy manually from the CLI:

```bash
npm run pages:deploy
```

## Migrating to a different Cloudflare account

Use this when moving the project to a new Cloudflare account (e.g. ownership
transfer, org split).

### 1. Export and import the D1 database

```bash
# In the OLD account
npx wrangler d1 export delta-tire-fleet-db --output backup.sql

# Log into the NEW account (wrangler logout / wrangler login, or use a
# separate CLOUDFLARE_API_TOKEN), then create the destination database
npx wrangler d1 create delta-tire-fleet-db
npx wrangler d1 execute delta-tire-fleet-db --file backup.sql
```

Update `database_id` in `wrangler.toml` to the new database's ID.

### 2. Reconnect Git

The Pages project itself isn't transferable between accounts — create a new
Pages project in the new account and connect it to the same Git repository
(**Workers & Pages → Create → Pages → Connect to Git**). Re-apply the build
settings and the `DB` binding from the Deployment section above. Once the new
project is live, remove the Pages integration from the old account/repo
connection to avoid duplicate deployments.

### 3. Recreate the Cloudflare Access app (if used)

If the old account had a Cloudflare Access application protecting this Pages
project:

1. In the new account, go to **Zero Trust → Access → Applications → Add an
   application → Self-hosted**.
2. Point it at the new Pages project's domain (`*.pages.dev` or your custom
   domain once re-attached).
3. Recreate the access policies (allowed emails/groups/IdP rules) from the
   old app — these do not migrate automatically.
4. If using a custom domain, update its DNS to point at the new account's
   Pages project, and re-verify domain ownership.

### 4. Verify

Hit `/api/health` on the new deployment and confirm it returns
`{"status":"ok","db":true}`.
