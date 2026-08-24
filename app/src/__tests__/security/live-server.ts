/**
 * A couple of security tests need a real running HTTP server (unauthenticated
 * route access needs real middleware/proxy.ts behavior; rate limiting needs
 * real repeated requests hitting the real in-memory limiter in src/auth.ts).
 * Neither is meaningfully testable by calling server actions directly in a
 * Vitest/Node process the way the rest of this suite does.
 *
 * Point SECURITY_TEST_BASE_URL at a running instance (defaults to
 * http://localhost:3000, i.e. `npm run dev` or `npm run start`). If nothing
 * answers, the tests using this helper skip themselves with a clear message
 * rather than failing the whole suite — CI doesn't run test:security today
 * (see load-tests/README.md and package.json), so this only matters for local
 * runs.
 */
export const LIVE_BASE_URL = process.env.SECURITY_TEST_BASE_URL ?? "http://localhost:3000";

export async function isServerReachable(): Promise<boolean> {
  try {
    const res = await fetch(LIVE_BASE_URL + "/login", {
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}
