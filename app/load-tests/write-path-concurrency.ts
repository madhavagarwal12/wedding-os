#!/usr/bin/env node
// Concurrent lead-creation stress test — the write-path equivalent of
// ramping-load.js's read-path coverage.
//
// WHY THIS ISN'T A k6 SCRIPT: createLeadAction (src/lib/actions/leads.ts) is
// a Next.js Server Action, not a REST endpoint. The client invokes it over
// HTTP via React Server Components' "Next-Action" wire protocol, which
// encodes arguments (including the FormData) into a custom multipart body
// keyed to a per-build, per-file action ID. That ID and body encoding were
// reverse engineered far enough during this task to locate the live ID from
// `.next/dev/server/app/(app)/leads/page/server-reference-manifest.json`
// (`createLeadAction` → `6073c59a9520a087b20e8d004550259d22482afe89` in this
// build) and to get past "action not found," but the exact multipart
// argument-reference encoding React Server Components expects for a
// two-argument action (`prevState`, `formData`) could not be reliably
// reproduced from raw curl/k6 in the time available for this pass — it kept
// failing with a generic mid-stream "Connection closed" RSC error rather
// than a clean 200. Getting a byte-exact request requires capturing one real
// submission from a browser's Network tab (Next-Action header value +
// multipart body) and replaying that shape in k6; that capture step needs a
// human with a working browser session (the automated browser tool used
// during this task session round-tripped back to /login without submitting,
// even though the exact same credentials worked fine over plain curl against
// /api/auth/callback/credentials — a tooling quirk, not an app bug).
//
// So: this script exercises the actual Prisma write path createLeadAction
// performs (same shape of prisma.lead.create call, same schema, same
// database) directly, at real concurrency, against the real dev Postgres.
// It skips the HTTP/auth/RSC layer, which is a real gap versus a true
// end-to-end load test — documented here rather than silently assumed away.
// It still answers the concrete question LOAD-01-style tests care about for
// this app: does the database serialize/queue concurrent writes cleanly, or
// does it throw connection-pool/constraint errors under concurrency? (Lead
// has no unique business key like Helios's `leadCode` — id is a
// collision-proof cuid — so there is no "duplicate key" race to test here;
// that specific Helios concern doesn't map onto this schema.)
//
// Usage:
//   DATABASE_URL=postgres://postgres@localhost:5433/weddingos?sslmode=disable \
//     npx tsx load-tests/write-path-concurrency.ts [concurrency] [totalRequests]
//
// Defaults: concurrency=50, totalRequests=300 (matches the "lower VU count
// for the write path" guidance — writes are heavier/rarer than reads here).
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const concurrency = Number(process.argv[2]) || 50;
const totalRequests = Number(process.argv[3]) || 300;

// Mirrors src/lib/prisma.ts exactly (Prisma 7 requires a driver adapter, no
// bundled query engine) including its max:10 pool size — deliberately kept
// the same as the real app so this test reflects the actual deployed
// connection-pool ceiling, not an artificially large one.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomPhone(): string {
  return String(9000000000 + Math.floor(Math.random() * 99999999));
}

type Outcome = { ok: boolean; ms: number; error?: string };

async function createOne(i: number): Promise<Outcome> {
  const start = performance.now();
  try {
    await prisma.lead.create({
      data: {
        leadName: `Load Test Lead ${i} ${Date.now()}`,
        primaryContact: "Load Test Contact",
        phone: randomPhone(),
        notes: "Created by load-tests/write-path-concurrency.ts — safe to delete.",
      },
    });
    return { ok: true, ms: performance.now() - start };
  } catch (err) {
    return {
      ok: false,
      ms: performance.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runBatch(ids: number[]): Promise<Outcome[]> {
  return Promise.all(ids.map(createOne));
}

async function main() {
  console.log(
    `Write-path concurrency test: ${totalRequests} lead creates at concurrency=${concurrency}`
  );
  const results: Outcome[] = [];
  const overallStart = performance.now();

  for (let offset = 0; offset < totalRequests; offset += concurrency) {
    const batchIds = Array.from(
      { length: Math.min(concurrency, totalRequests - offset) },
      (_, k) => offset + k
    );
    const batchResults = await runBatch(batchIds);
    results.push(...batchResults);
  }

  const overallMs = performance.now() - overallStart;
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const durations = ok.map((r) => r.ms).sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
  const max = durations[durations.length - 1] ?? 0;

  console.log(`\nTotal wall time: ${overallMs.toFixed(0)}ms`);
  console.log(`Success: ${ok.length}/${results.length} (${((ok.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`Failed:  ${failed.length}/${results.length}`);
  if (failed.length) {
    const sample = new Map<string, number>();
    for (const f of failed) sample.set(f.error ?? "unknown", (sample.get(f.error ?? "unknown") ?? 0) + 1);
    console.log("Failure reasons:", Object.fromEntries(sample));
  }
  console.log(`Latency (create call only): p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms max=${max.toFixed(1)}ms`);

  const errorRate = failed.length / results.length;
  console.log(`\nPass/fail vs threshold (error rate < 1%): ${errorRate < 0.01 ? "PASS" : "FAIL"} (${(errorRate * 100).toFixed(2)}% observed)`);

  await prisma.lead.deleteMany({ where: { notes: { contains: "load-tests/write-path-concurrency.ts" } } });
  console.log("Cleaned up test-created leads.");

  await prisma.$disconnect();
  await pool.end();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
