import { beforeAll, describe, expect, it } from "vitest";
import { LIVE_BASE_URL, isServerReachable } from "./live-server";

// SEC: unauthenticated access to protected routes and API endpoints.
// Confirms proxy.ts (Auth.js middleware, matcher excludes only
// /api, /_next/*, /login, /uploads) actually redirects every protected page
// to /login, and that protected API routes return 401 rather than data, when
// called with no session cookie at all.
describe("Unauthenticated access is blocked", () => {
  let reachable = false;

  beforeAll(async () => {
    reachable = await isServerReachable();
    if (!reachable) {
      console.warn(
        `[security] Skipping live unauthenticated-access checks — no server reachable at ${LIVE_BASE_URL}. ` +
          "Run `npm run dev` (or `npm run start`) in another terminal and re-run `npm run test:security` for a real result."
      );
    }
  });

  const protectedPages = [
    "/dashboard",
    "/leads",
    "/leads/pipeline",
    "/weddings",
    "/tasks",
    "/finance/client-payments",
    "/finance/vendor-payments",
    "/finance/budgets",
    "/settings/users",
    "/settings/audit-log",
    "/reports",
  ];

  it.each(protectedPages)("redirects %s to /login with no session cookie", async (path) => {
    if (!reachable) return;
    const res = await fetch(LIVE_BASE_URL + path, { redirect: "manual" });
    expect([307, 302]).toContain(res.status);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/login");
    // The redirect body must not contain page data.
    const body = await res.text();
    expect(body.length).toBeLessThan(2000);
  });

  const protectedApiRoutes = [
    "/api/export/leads",
    "/api/export/client-payments",
    "/api/export/vendor-payments",
    "/api/documents/00000000-0000-0000-0000-000000000000",
  ];

  it.each(protectedApiRoutes)("returns 401 (not data) for %s with no session cookie", async (path) => {
    if (!reachable) return;
    const res = await fetch(LIVE_BASE_URL + path, { redirect: "manual" });
    expect(res.status).toBe(401);
    const body = await res.text();
    expect(body.toLowerCase()).not.toContain("leadname");
    expect(body.toLowerCase()).not.toContain("amount");
  });

  it("the cron endpoint rejects requests without the correct CRON_SECRET", async () => {
    if (!reachable) return;
    const res = await fetch(LIVE_BASE_URL + "/api/cron/daily-notifications", {
      method: "POST",
      redirect: "manual",
    });
    expect([401, 403]).toContain(res.status);
  });
});
