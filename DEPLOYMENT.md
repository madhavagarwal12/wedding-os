# Deploying Wedding OS to the Hostinger VPS

Concrete, project-specific version of `from-local-app-to-live-website.md`,
adjusted for two things that differ from the generic guide:

- **Traefik is already running on the VPS** (other containers use it) — we
  join it instead of standing up a second reverse proxy.
- **Postgres runs in its own dedicated container** for this app, isolated
  from anything else on the box.

Repo: `github.com/madhavagarwal12/wedding-os` · Domain:
`weddingos.autopilot-studio.com`

---

## 0. One-time local step: push the repo

```bash
git add -A
git commit -m "Initial commit: Wedding OS app + deploy config"
git remote add origin https://github.com/madhavagarwal12/wedding-os.git
git push -u origin main
```

(`.gitignore` already keeps `node_modules`, `.next`, `.env*`, `/pgdata`,
`/pglog.txt` etc. out of the repo — verify with `git status` before
committing that nothing secret got staged.)

---

## 1. Find your existing Traefik setup on the VPS

SSH in first (`ssh root@YOUR_VPS_IP`), then:

```bash
docker network ls          # note the network Traefik's other containers join
docker ps                  # find the traefik container
docker inspect <traefik_container> | grep -i certresolver   # or check its compose file / static config
```

You need two values before continuing:

1. **The Traefik docker network name** — [docker-compose.vps.yml](docker-compose.vps.yml) currently assumes it's called `traefik`. If yours is different, edit the `networks.traefik.name` value and the `traefik.docker.network` label to match.
2. **The certresolver name** Traefik uses for Let's Encrypt — [docker-compose.vps.yml](docker-compose.vps.yml) currently assumes `letsencrypt`. Check one of your other running services' labels for the name actually in use, and update `traefik.http.routers.weddingos.tls.certresolver` if it differs.

Get these two values right before starting the app — a mismatch here is
exactly the "HTTPS connects but the page never loads" failure mode the
playbook warns about.

---

## 2. Point the domain at the VPS

In your DNS provider for `autopilot-studio.com`, add an **A record**:
`weddingos` → `YOUR_VPS_IP`. Give it a few minutes to propagate before
testing `https://weddingos.autopilot-studio.com`.

---

## 3. Get the code onto the server

```bash
cd ~
git clone https://github.com/madhavagarwal12/wedding-os.git
cd wedding-os
```

---

## 4. Create the production env file on the server

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in every blank — see comments in the file for how to generate each
value. In particular:

- `POSTGRES_PASSWORD`: `openssl rand -hex 24` (hex, not base64 — a `+`/`/`/`=`
  in the password breaks the connection URL docker-compose builds from it)
- `AUTH_SECRET`: `npx auth secret` (run this on your laptop inside `app/`,
  or `openssl rand -base64 32`)
- `CRON_SECRET`: `openssl rand -hex 32`
- `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`: the first login you'll actually
  use — change the password after first login

`.env.production` is created by hand on the server and is already covered
by `.gitignore` — it must never be committed.

---

## 5. First boot: migrate, seed, start

```bash
docker compose -f docker-compose.vps.yml --profile tools run --rm migrate
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml ps
```

The `migrate` step applies the Prisma schema and creates the first Owner
account from `SEED_OWNER_EMAIL`/`SEED_OWNER_PASSWORD`. Then check
`https://weddingos.autopilot-studio.com` — should load with a padlock.

---

## 6. Automate future deploys (CI/CD)

[.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml) is
already wired up: it runs after CI passes on `main`, SSHes into the VPS,
pulls, re-runs migrations, and rebuilds. To activate it:

```bash
# on the VPS
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
base64 -w0 ~/.ssh/deploy_key   # copy this single-line output
```

Then in GitHub: repo **Settings → Secrets and variables → Actions**, add:

- `VPS_HOST` — your VPS IP
- `VPS_USER` — the SSH user (`root` or whichever you use)
- `VPS_DEPLOY_KEY` — the base64 string from above (paste as one line, not
  the raw multi-line key — this avoids the "silently corrupted key" problem
  from copy-pasting multi-line secrets into web forms)

From then on: push to `main` → CI runs → on success, deploy runs
automatically. No manual server work for routine updates.

---

## Files this plan added/changed

| File | Purpose |
| --- | --- |
| [app/Dockerfile](app/Dockerfile) | Multi-stage build: deps → build (also used for migrate/seed) → minimal runtime image |
| [app/.dockerignore](app/.dockerignore) | Now also excludes `.env*` so secrets never get baked into the image |
| [app/next.config.ts](app/next.config.ts) | Added `output: "standalone"` — required for the lean Docker runtime stage |
| [docker-compose.vps.yml](docker-compose.vps.yml) | Postgres + app + one-off migrate service, joins your existing Traefik network |
| [.env.production.example](.env.production.example) | Template — copy to `.env.production` **on the VPS only** |
| [.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml) | Auto-deploy after CI passes on `main` |

## If something breaks

Same checklist as the general playbook:

1. `docker compose -f docker-compose.vps.yml ps` — is postgres healthy, is app running?
2. `docker compose -f docker-compose.vps.yml logs app` — read the actual error.
3. TLS handshake succeeds but page hangs → check `traefik.docker.network` matches your real network name (step 1).
4. Uploads disappearing after a redeploy → confirm the `uploads_data` volume is still mounted (it is, by default, in `docker-compose.vps.yml`).
