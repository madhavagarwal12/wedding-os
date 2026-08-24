import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { LIVE_BASE_URL, isServerReachable } from "./live-server";

// SEC: audit log integrity + login rate limiting, verified against the real
// running dev server (see live-server.ts) and the real dev database it
// writes to. Deliberately bypasses the `@/lib/prisma` singleton (which in
// this Vitest process is wired to DATABASE_URL from .env.test / the test DB)
// and instead reads the *app's actual* `.env` DATABASE_URL directly with a
// throwaway `pg` client, because the live server writes AuditLog rows to the
// real dev database (weddingos), not the integration test database
// (weddingos_test).
function readRealDatabaseUrl(): string | null {
  try {
    const envPath = path.resolve(__dirname, "../../../.env");
    const contents = readFileSync(envPath, "utf8");
    const match = contents.match(/^DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/m);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function attemptLogin(email: string, password: string) {
  const csrfRes = await fetch(LIVE_BASE_URL + "/api/auth/csrf");
  const setCookie = csrfRes.headers.get("set-cookie") ?? "";
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const cookieHeader = setCookie
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.split(";")[0])
    .join("; ");

  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: LIVE_BASE_URL + "/dashboard",
    json: "true",
  });

  return fetch(LIVE_BASE_URL + "/api/auth/callback/credentials", {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader,
    },
    body,
  });
}

describe("Login audit logging and rate limiting (live server)", () => {
  let reachable = false;
  let db: Client | null = null;

  beforeAll(async () => {
    reachable = await isServerReachable();
    if (!reachable) {
      console.warn(
        `[security] Skipping live login/audit checks — no server reachable at ${LIVE_BASE_URL}.`
      );
      return;
    }
    const url = readRealDatabaseUrl();
    if (!url) {
      console.warn("[security] Could not read real DATABASE_URL from .env — skipping DB assertions.");
      return;
    }
    db = new Client({ connectionString: url });
    await db.connect();
  });

  afterAll(async () => {
    await db?.end();
  });

  it("a failed login writes a LOGIN_FAILURE audit row without leaking email-vs-password in the client response", async () => {
    if (!reachable) return;
    const email = `sec-test-${Date.now()}@example.com`;
    const res = await attemptLogin(email, "whatever-wrong-password");
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    // Generic error only — must not say "no such user" / "unknown email" etc.
    expect(location).toContain("error=CredentialsSignin");
    expect(location.toLowerCase()).not.toContain("unknown");
    expect(location.toLowerCase()).not.toContain("no such");

    if (!db) return;
    const { rows } = await db.query(
      `SELECT "action", "after" FROM "AuditLog" WHERE "entityId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [email]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe("LOGIN_FAILURE");
    // The server-side audit row IS allowed to record the real reason
    // (UNKNOWN_EMAIL) for operator forensics — only the client response must
    // stay generic, which was asserted above.
    expect(rows[0].after.reason).toBe("UNKNOWN_EMAIL");
  });

  it("locks out after 5 failed attempts for the same email within the attempt window", async () => {
    if (!reachable) return;
    const email = `sec-lockout-${Date.now()}@example.com`;
    const results: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const res = await attemptLogin(email, "still-wrong");
      const location = res.headers.get("location") ?? "";
      const code = new URL(location).searchParams.get("code") ?? "";
      results.push(code);
    }
    // First 5 attempts are plain "credentials" failures; the 6th should hit
    // the in-memory rate limiter (MAX_FAILED_ATTEMPTS = 5 in src/auth.ts) and
    // come back with the distinct "Too many attempts" code.
    expect(results[5]).toContain("Too many attempts");

    if (!db) return;
    const { rows } = await db.query(
      `SELECT "after" FROM "AuditLog" WHERE "entityId" = $1 AND "action" = 'LOGIN_FAILURE' ORDER BY "createdAt" DESC LIMIT 1`,
      [email]
    );
    expect(rows[0]?.after?.reason).toBe("RATE_LIMITED");
  });

  it("other write-heavy endpoints (CSV export, document upload) have no rate limiting — documented gap, not a pass", async () => {
    if (!reachable) return;
    // This isn't a pass/fail assertion — it's here so the gap shows up in
    // the test report rather than only in prose. See load-tests/README.md /
    // final report for the recommendation (per-IP/per-user token bucket on
    // /api/export/* and uploadDocumentAction).
    expect(true).toBe(true);
  });
});
