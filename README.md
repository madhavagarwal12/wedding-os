# Wedding Operations Platform

Private wedding operations platform for an Indian wedding/event management
company. Built from `Wedding_Operations_Platform_PRD_v1.md`.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)
- Auth.js v5 (credentials-based, JWT sessions) — no external identity provider
- Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- Local disk storage for uploaded documents (no S3/MinIO dependency)

This intentionally avoids the full Supabase stack to keep the running
footprint small: in production this needs only the Node.js process and a
single PostgreSQL instance.

## Development setup

```bash
cd app
npm install
npm run dev
```

The dev database in this workspace is a real local PostgreSQL 18 (installed
via `scoop install postgresql`, data directory at `./pgdata`), not a hosted
service or Docker container — the same engine you'd run in production, just
on your own machine.

> Note: an earlier version of this setup used Prisma's `npx prisma dev`
> local emulator instead. It turned out to be unstable in this environment
> (dropped connections after idling, occasional crashes), so we switched to
> a real local Postgres. If you hit `ConnectionClosed` / "Server has closed
> the connection" errors from Prisma, that emulator is almost certainly why
> — a real Postgres instance doesn't have that problem.

```bash
# start (background)
"$HOME/scoop/apps/postgresql/18.6-1/bin/postgres.exe" -D "./pgdata" -p 5433 > pglog.txt 2>&1 &

# stop (graceful)
"$HOME/scoop/apps/postgresql/18.6-1/bin/pg_ctl.exe" -D "./pgdata" stop -m fast
```

`DATABASE_URL` in `app/.env` points at `localhost:5433/weddingos`. For a
real deployment, point it at whatever standard PostgreSQL instance you're
running on the server (see `app/.env.example`).

### Database

```bash
cd app
npx prisma migrate dev     # apply schema changes
npx prisma db seed         # create the Organization + first Owner account
```

The seed script prints the Owner login (or reads `SEED_OWNER_EMAIL` /
`SEED_OWNER_PASSWORD` from `.env`). Change the password after first login —
there's no self-serve password reset yet.

## Project status

Built phase by phase per the PRD's §46 Development Phases. See
`app/PROGRESS.md` for what's done — Phases 1-7 (Foundation, CRM, Wedding
Operations, Vendors, Finance, Guests & Documents, Dashboard & Reporting) are
complete. Phase 8 (QA & Deployment) is in progress.

## Data model

The full entity set from PRD §33 is modeled in `app/prisma/schema.prisma`.
The app is built for a single wedding-planning company per deployment (one
`Organization` row, created by the seed script) — it does not implement
multi-tenant data isolation, since the PRD describes a private internal tool
for one company, not a multi-org SaaS product.

## Backup & recovery

The database is the only stateful store that matters (uploaded documents on
disk are the other one — see `UPLOADS_DIR` in `.env`).

```bash
# Backup (run against the running Postgres instance)
"$HOME/scoop/apps/postgresql/18.6-1/bin/pg_dump.exe" -h localhost -p 5433 -U postgres -Fc weddingos > backup.dump

# Restore into a fresh database
"$HOME/scoop/apps/postgresql/18.6-1/bin/pg_restore.exe" -h localhost -p 5433 -U postgres -d weddingos --clean --if-exists backup.dump
```

Also back up the `UPLOADS_DIR` directory (uploaded documents live on disk,
not in the database — only their metadata/filenames are in Postgres). Run
both backups together and keep them paired; a document row with no matching
file, or a file with no matching row, is otherwise unrecoverable.

### Automated nightly backups

Do not rely on running the commands above by hand. Install this crontab on the
app host (`crontab -e`), adjusting paths:

```cron
# 02:15 nightly — dump the DB and tar the uploads dir into a dated pair
15 2 * * * PGPASSWORD=... pg_dump -h localhost -p 5433 -U postgres -Fc weddingos > /var/backups/weddingos/db-$(date +\%F).dump 2>> /var/backups/weddingos/backup.log && tar -czf /var/backups/weddingos/uploads-$(date +\%F).tar.gz -C /srv/weddingos uploads 2>> /var/backups/weddingos/backup.log

# 03:00 nightly — retention: delete backups older than 30 days
0 3 * * * find /var/backups/weddingos -name '*.dump' -o -name '*.tar.gz' -mtime +30 -delete
```

A backup you have never restored is not a backup. Test-restore once, right
after setting this up, against a throwaway database:

```bash
createdb -h localhost -p 5433 -U postgres weddingos_restoretest
pg_restore -h localhost -p 5433 -U postgres -d weddingos_restoretest --clean --if-exists /var/backups/weddingos/db-2026-01-01.dump
psql -h localhost -p 5433 -U postgres -d weddingos_restoretest -c 'select count(*) from "Wedding";'
dropdb -h localhost -p 5433 -U postgres weddingos_restoretest

# and verify the uploads archive lists and extracts
tar -tzf /var/backups/weddingos/uploads-2026-01-01.tar.gz | head
tar -xzf /var/backups/weddingos/uploads-2026-01-01.tar.gz -C /tmp/restoretest
```

## Scheduled notifications

The app runs as a single Node process with no queue or background worker, so
due-date notifications are produced by an authenticated endpoint that an
external scheduler calls:

`GET /api/cron/daily-notifications` creates `Notification` rows for

- leads whose `nextFollowUpDate` is today or overdue (notifies the assignee),
- client/vendor payments whose `dueDate` is today or overdue (notifies Owner
  and Finance users),
- vendor bookings still unconfirmed within 7 days of their `bookingDate`
  (notifies Owner/Vendor Manager users and the wedding's project manager).

It is guarded by the `CRON_SECRET` env var (see `app/.env.example`), passed
either as an `x-cron-secret` header or a `?secret=` query parameter, and it
skips any notification a user already received for the same link and type
since midnight — so calling it more than once a day is safe.

```cron
# 07:00 daily — generate follow-up / payment / vendor-booking notifications
0 7 * * * curl -fsS -H "x-cron-secret: $CRON_SECRET" https://weddingos.example.com/api/cron/daily-notifications > /dev/null 2>> /var/log/weddingos-cron.log
```

Run it hourly instead if the team wants same-day due items to surface sooner;
the de-duplication makes repeat calls harmless.

## Running under pm2 (no Docker)

`app/ecosystem.config.js` runs `next start` under pm2 with auto-restart:

```bash
cd app && npm run build
pm2 start ecosystem.config.js
pm2 save && pm2 startup   # print/install the boot service, then re-run `pm2 save`
```

`pm2 logs wedding-os` tails output; `pm2 reload wedding-os` restarts with no
downtime after a rebuild.

## Nginx reverse proxy

Terminate TLS at Nginx and proxy to the Node port:

```nginx
server {
    listen 443 ssl http2;
    server_name weddingos.example.com;

    ssl_certificate     /etc/letsencrypt/live/weddingos.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weddingos.example.com/privkey.pem;

    client_max_body_size 25M;  # must exceed the 20MB document upload limit

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}

server {
    listen 80;
    server_name weddingos.example.com;
    return 301 https://$host$request_uri;
}
```

## Rollback

Every deploy replaces `app/.next`. Keep the previous build so you can go back
without a rebuild:

```bash
cd app
mv .next .next.prev          # or: git tag deploy-$(date +%F) before pulling
git pull && npm ci && npx prisma migrate deploy && npm run build
pm2 reload wedding-os
curl -fsS http://127.0.0.1:3000/api/health || echo "HEALTH CHECK FAILED"
```

If the health check fails or the app misbehaves:

```bash
cd app
rm -rf .next && mv .next.prev .next
git checkout <previous-tag-or-commit> && npm ci
pm2 reload wedding-os
curl -fsS http://127.0.0.1:3000/api/health
```

Schema migrations are not rolled back automatically — if the failed deploy ran
`migrate deploy`, restore the pre-deploy `pg_dump` as well.

## Monitoring

`GET /api/health` returns `{"status":"ok"}` with a 200 when the app is up and
Postgres answers a trivial query, and a 503 otherwise. Point an external
uptime checker at it — UptimeRobot/Better Stack on a 1–5 minute interval, or a
cron one-liner such as
`*/5 * * * * curl -fsS https://weddingos.example.com/api/health > /dev/null || mail -s "WeddingOS down" ops@example.com < /dev/null`.

## Testing

Three tiers, all under `app/`:

**Unit tests** (Vitest, no database, no Next.js runtime) — pure logic like
`src/lib/payment-status.ts` and `src/lib/roles.ts`:

```bash
cd app
npm run test:unit
```

**Integration tests** (Vitest, real Postgres) — call the actual exported
server actions (with `@/auth` and `next/cache` mocked, since neither works
outside a real request) against a second, throwaway local database so
cascade-delete/constraint behavior is tested for real, not mocked. One-time
setup:

```bash
# once, against the same local Postgres instance the dev DB uses
"$HOME/scoop/apps/postgresql/18.6-1/bin/psql.exe" -h localhost -p 5433 -U postgres -c "CREATE DATABASE weddingos_test;"

cd app
DATABASE_URL="postgres://postgres@localhost:5433/weddingos_test?sslmode=disable" npx prisma migrate deploy
```

Then, any time:

```bash
cd app
npm run test:integration
```

This loads `app/.env.test` (already committed, points at `weddingos_test`)
via `dotenv-cli` and truncates the test database between tests — it never
touches the real `weddingos` database or `app/.env`.

**E2E smoke tests** (Playwright) — log in as the seeded Owner, check the
login page and dashboard render, and (best-effort) walk a Lead through
conversion to a Wedding. Runs against the real dev server and the real dev
database (`weddingos`) — read-mostly, no separate E2E database:

```bash
cd app
npm run dev            # if not already running
npm run test:e2e
```

Set `E2E_OWNER_EMAIL` / `E2E_OWNER_PASSWORD` if the seeded Owner account
doesn't use the defaults from `prisma/seed.ts`.

**Everything at once**: `npm run test:all` (unit, then integration, then
e2e — stops at the first failing tier).

CI (`.github/workflows/ci.yml`) runs unit tests in the main build job and
integration tests in a separate job with a Postgres service container. E2E
is not yet wired into CI (see the comment in that file) — run it locally.

## Production deployment checklist

- [ ] Provision a PostgreSQL instance (same version family as dev) and set
      `DATABASE_URL` in `app/.env` to point at it (`sslmode=require` if the
      DB is not on localhost)
- [ ] Set a strong `AUTH_SECRET` (`npx auth secret` or `openssl rand -base64 32`)
- [ ] Set `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD` to real values before
      running the seed script, then change the password after first login
- [ ] Run `npx prisma migrate deploy` (not `migrate dev`) to apply the
      schema in production
- [ ] Set `UPLOADS_DIR` to a persistent volume/disk path outside the app's
      deployment directory, so redeploys don't wipe uploaded documents
- [ ] `npm run build && npm start` (or your platform's Next.js runtime) —
      do not run `next dev` in production
- [ ] Put the app behind HTTPS (terminate TLS at a reverse proxy/load
      balancer if the Node process itself doesn't handle it)
- [ ] Schedule regular `pg_dump` backups (see above) and verify a restore
      at least once before relying on it
- [ ] Deactivate the seed Owner account's default password by rotating it
      immediately after first login
- [ ] Set `CRON_SECRET` and schedule the daily notifications cron
      (see "Scheduled notifications" above)
