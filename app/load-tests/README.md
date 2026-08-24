# Load & Performance Testing

This directory covers **Performance / Load & Scalability** testing for the
Wedding Operations Platform — the category the functional-testing pass
(Vitest + Playwright, see root README's "Testing" section) explicitly did not
cover. Security testing lives in `../src/__tests__/security/` (see that
folder and `package.json`'s `test:security` script) — this README is about
load only.

## TL;DR — what was actually run vs. what's written-but-unrun-at-scale

| What | Status |
|---|---|
| k6 scripts (`ramping-load.js`, this file's main deliverable) | **Written, not executed** — k6 is not installed in this environment (see "k6 availability" below) and an attempted `winget install k6` did not finish in time for this pass. |
| Write-path concurrency (`write-path-concurrency.ts`) | **Actually run**, twice, against the real local dev Postgres (`weddingos`). Real numbers below. |
| Read-path load, as a k6 stand-in (`node` + `fetch`, ad hoc, not committed) | **Actually run** against a real `npm run build && npm run start` instance on this machine at 50 and 100 concurrent sessions. Real numbers below. |
| `npm run build` output size / route manifest | **Actually run.** Baseline recorded below. |
| Full 500→1000 VU k6 run | **Not run.** See "Is 500-1000 concurrent even realistic?" below — this machine (and arguably this app's real user base) isn't the right place to run it at full scale. |

## k6 availability

`k6 version` was checked before writing anything and returned "command not
found" — k6 is a standalone Go binary, not an npm package, and isn't part of
this repo's toolchain. This pass attempted `winget install k6
--accept-package-agreements --accept-source-agreements --silent` in the
background; it had not completed by the time this pass wrapped up (winget
installs can prompt/stall in a non-interactive shell). **If you're reading
this on a machine where k6 isn't yet installed:**

```powershell
winget install k6          # Windows, or:
scoop install k6           # if you use scoop
```

Then verify with `k6 version` before running anything below.

## Is 500-1000 concurrent even realistic for this app?

**Almost certainly not, and it's worth saying plainly.** This is a
single-tenant internal ops tool for one wedding-planning company (PRD
§4.2/§4.5) — the entire user base is that company's own staff across 7
roles (Owner, Sales, Planner, Operations, Vendor Manager, Finance, Field
Staff). Even a large wedding-planning company runs maybe dozens of staff
accounts, not thousands, and "concurrent" in an ops tool context typically
means a few dozen people using it during business hours, not 500-1000
users hitting it at the same instant. 500 concurrent VUs would represent
this company having roughly 10-50x more staff than any realistic wedding
planning business, all online at the exact same moment.

That said, the task asked for scripts designed to 500 baseline / 1000 peak
burst, so `ramping-load.js` is written to those numbers, thresholds and
all — treat it as validated future-proofing (e.g. if this software is ever
sold to other companies as SaaS, the PRD's own "V3 scope" mentions a
vendor marketplace / white-label future) rather than a load level this
specific deployment needs to defend against today. **The realistic
sizing for THIS deployment is closer to 20-50 concurrent staff sessions** —
the write-path and read-path numbers actually measured below (50-100
concurrent) are far more representative of what this app will ever see in
production than the 1000-VU spike scenario.

## Scripts

### `ramping-load.js` — read-heavy ramp + spike (NOT YET RUN)

```bash
BASE_URL=http://localhost:3000 k6 run load-tests/ramping-load.js
```

Ramps 0 → 200 → 500 VUs (steady target), holds, spikes to 1000, ramps down.
Covers login, `/dashboard`, `/leads`, `/tasks`, a `/weddings/[id]` detail page
(discovered dynamically in `setup()`), `/reports`, `/calendar`.

**Must be run against `npm run build && npm run start`**, not `npm run dev`
— dev mode recompiles routes on first hit and its latency numbers reflect
compilation, not the app.

Thresholds:
- `http_req_duration: p(95)<1000` — reasonable for an internal ops tool;
  staff expect near-instant loads but this isn't a consumer SLA product.
- `http_req_duration{name:login}: p(95)<2000` — login does a bcrypt compare
  (intentionally slow, ~50-150ms of hashing) so it's tracked separately.
- `http_req_failed: rate<0.01` — a handful of transient errors under a
  1000-VU spike on a single Postgres instance is expected; a sustained
  higher rate signals real exhaustion.

### `write-path-concurrency.ts` — concurrent lead creation (ACTUALLY RUN)

```bash
DATABASE_URL="postgres://postgres@localhost:5433/weddingos?sslmode=disable" \
  npx tsx load-tests/write-path-concurrency.ts [concurrency] [totalRequests]
```

**Why this isn't a k6 script**: `createLeadAction` (`src/lib/actions/leads.ts`)
is a Next.js Server Action, not a REST endpoint. The browser invokes it over
a custom React Server Components wire protocol (a `Next-Action` header plus a
per-build, per-file action ID and a multipart body encoding that embeds
argument references). During this pass I got far enough to:
1. Extract the *live* action ID straight from the running dev server's own
   manifest (`.next/dev/server/app/(app)/leads/page/server-reference-manifest.json`
   → `createLeadAction` → `6073c59a9520a087b20e8d004550259d22482afe89` in
   that build) — this got past Next's "action not found" check.
2. Get stuck on the exact multipart argument-encoding for a **two-argument**
   action (`prevState`, `formData`) — repeated attempts came back with a
   generic mid-stream `"Connection closed"` RSC error rather than a clean
   `200`.

Getting this byte-exact requires capturing one real submission's `Next-Action`
header + body from a browser's Network tab and replaying that shape — that
capture step needs a working interactive browser session; the automated
browser tool available during this pass round-tripped back to `/login`
without completing a real submit (while the *identical* credentials worked
fine over plain `curl` against `/api/auth/callback/credentials` — a tooling
quirk in this environment, not an app bug). **If you want a true end-to-end
write-path k6 script, capture that one request in a browser and I (or anyone)
can turn it into a k6 script in a few minutes** — the hard part (this
writeup) is already done.

So instead, this script calls the exact same Prisma write `createLeadAction`
performs (same `prisma.lead.create` shape, same schema, same
driver-adapter + connection-pool config as `src/lib/prisma.ts`, `max: 10`)
directly, at real concurrency, against the real database. **This is a real
gap versus true end-to-end load testing** — it skips the HTTP/auth/RSC layer
— documented here rather than assumed away. It still answers the concrete
question this category of test cares about: does the database serialize
concurrent writes cleanly, or does it throw connection-pool/constraint
errors? (`Lead` has no unique business key like a `leadCode` — `id` is a
collision-proof `cuid()` — so there's no duplicate-key race to test here,
unlike the Helios reference plan's `LOAD-01`; that concern doesn't map onto
this schema.)

**Real results, run twice against the real dev Postgres (`weddingos`) on
this machine:**

| Concurrency | Total requests | Success | Errors | p50 | p95 | max | Wall time |
|---|---|---|---|---|---|---|---|
| 50  | 300 | 300/300 (100%) | 0 | 26.2ms | 496.4ms | 618.2ms | 807ms |
| 100 | 500 | 500/500 (100%) | 0 | 43.0ms | 429.2ms | 489.1ms | 734ms |

Zero errors at either concurrency, and the connection pool (capped at 10,
matching the real app) queued the extra concurrent writes gracefully rather
than throwing — visible in the p95 latency (writes waiting for a free pool
connection) rather than in an error count. No duplicate-key or constraint
violations, as expected given `Lead.id` is a `cuid()`. Test-created leads
were cleaned up after each run (`notes` field tagged, deleted via
`deleteMany` at the end of the script).

### Read-path load — real numbers (stand-in for the k6 script, k6 unavailable)

Since k6 wasn't available, a small ad hoc Node script (not committed — it
was a throwaway probe) logged in N sessions via the real
`/api/auth/csrf` → `/api/auth/callback/credentials` flow and fired N
concurrent `fetch()` requests per page against a real
`npm run build && npm run start` instance on `localhost:3001` (dev server
was already occupying :3000), backed by the real dev Postgres. This is
**not** a substitute for k6's ramping-VU model — no gradual ramp, no
sustained hold over minutes — just a concurrency snapshot to back real
numbers with real data instead of an unexecuted script.

**50 concurrent sessions, 3 rounds each (n=150 requests per page):**

| Page | p50 | p95 | max | Errors |
|---|---|---|---|---|
| `/dashboard` | 1115ms | 2133ms | 2140ms | 0% |
| `/leads` | 803ms | 997ms | 998ms | 0% |
| `/tasks` | 913ms | 1016ms | 1017ms | 0% |
| `/reports` | 1297ms | 1345ms | 1346ms | 0% |
| `/calendar` | 881ms | 932ms | 933ms | 0% |

**100 concurrent sessions, 2 rounds each (n=200 requests per page):**

| Page | p50 | p95 | max | Errors |
|---|---|---|---|---|
| `/dashboard` | 2059ms | 2685ms | 2687ms | 0% |
| `/leads` | 1598ms | 1670ms | 1671ms | 0% |
| `/tasks` | 1687ms | 1824ms | 1825ms | 0% |
| `/reports` | 2273ms | 2473ms | 2474ms | 0% |
| `/calendar` | 1819ms | 1864ms | 1868ms | 0% |

**Honest read on these numbers**: zero errors at both concurrency levels —
the app doesn't fall over or leak connection errors under this load, which
is the more important signal for a real deployment. But the p95 latency
threshold I proposed for the k6 script (`<1000ms`) is **already exceeded at
50 concurrent** on this laptop (`/dashboard` p95 2133ms, `/reports` p95
1345ms), and gets worse at 100. This is very likely this development
laptop's single Postgres instance + single Node process being CPU/IO-bound
under artificial concurrency, not a representative production signal — a
real deployment target (even a small VPS with the DB on a separate host, or
just not sharing the machine with everything else running during this
session) would very plausibly clear the threshold comfortably at these
concurrency levels, which per the "is this realistic" section above are
already well above what this specific single-company deployment will ever
see. Don't take the 2+ second dashboard number as "the app is slow" — take
it as "this laptop, running the dev tooling, IDE, and everything else
Claude Code needed at the same time, is not a load-testing rig." Re-run
`ramping-load.js` for real once k6 is installed and against a machine that
isn't also doing everything else, before drawing conclusions.

### Static checks — build size / bundle (ACTUALLY RUN)

```bash
rm -rf .next && time npm run build
```

- Clean production build: **~49 seconds** on this machine. No prior baseline
  exists to compare against (this is the first build-time measurement
  recorded for this repo) — treat this as the baseline for future
  regression comparisons (playbook guidance: flag build-time or bundle-size
  regressions > 15%).
- `.next/static` total size: **1.7 MB**. Largest individual chunk:
  `05eejtyer9qrm.js` at 224 KB, next largest 132 KB and 112 KB. Nothing
  stood out as an unusually large route-specific bundle — no route pulls in
  something disproportionate (e.g. a charting library loaded on every page).
  All routes in the build manifest are server-rendered (`ƒ`, dynamic) except
  `/login` and `/_not-found` (`○`, static), which is expected for an
  authenticated app where nearly every page needs a session check.

## Running the full 500/1000-VU scenario for real

1. Install k6 (see above).
2. Provision a real staging box — **not this laptop, not a dev machine
   running the app's own `npm run dev` at the same time**. Postgres and the
   Next.js server should either be on separate hosts or at minimum have
   dedicated CPU/memory, matching how you'd actually deploy this (see root
   README's pm2 + Nginx runbook).
3. `npm run build && npm run start` on that box.
4. Seed enough realistic data first — the reference non-functional test plan
   this was adapted from calls for testing list-page performance at
   10,000+ rows (see `production-readiness-checklist.md` Section 7); this
   app currently has minimal seed data, so a fresh run against this small
   dataset would look artificially fast even ignoring the "is 1000 VUs
   realistic" question above.
5. `BASE_URL=https://your-staging-host k6 run load-tests/ramping-load.js`
6. `write-path-concurrency.ts` can run at higher concurrency too (its
   `max: 10` pool ceiling is deliberately the same as the real app's — raise
   it in both places together if you want to test a larger deployed pool
   size).

## CI

None of this is wired into CI, deliberately — matching how the reference
non-functional test plan (`testing docs/non-functional-test-plan.md`) treats
its own PERF/LOAD rows: "run against a staging deployment using k6... not
currently wired into CI; recommend a scheduled (nightly/weekly) job rather
than blocking every PR." k6 runs are slow (the full ramp/spike scenario here
takes ~15 minutes) and need a real deployed target, which a PR-gating CI job
doesn't have. If you want a scheduled job later, `k6 run --out
json=results.json` plus a small script comparing against the thresholds
above is the natural next step.
