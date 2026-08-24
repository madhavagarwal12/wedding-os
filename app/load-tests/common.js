// Shared helpers for the k6 scripts in this directory. Auth.js v5 credentials
// login needs: GET /api/auth/csrf (grab csrfToken + cookies) then POST
// /api/auth/callback/credentials with that token + the cookie jar, which
// returns a session cookie on success. k6's cookie jar (per-VU, per-http.CookieJar)
// handles this automatically as long as you reuse the same `jar`/http client
// across requests within one VU iteration.
import http from "k6/http";
import { check } from "k6";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
export const OWNER_EMAIL = __ENV.OWNER_EMAIL || "owner@weddingops.local";
export const OWNER_PASSWORD = __ENV.OWNER_PASSWORD || "ChangeMe123!";

/**
 * Logs in as the seeded Owner and returns a k6 http.CookieJar with the
 * resulting session cookie, for use as `{ jar }` in subsequent requests.
 */
export function login() {
  const jar = http.cookieJar();

  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, { jar });
  check(csrfRes, { "csrf status 200": (r) => r.status === 200 });
  const csrfToken = JSON.parse(csrfRes.body).csrfToken;

  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    {
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      csrfToken,
      callbackUrl: `${BASE_URL}/dashboard`,
      json: "true",
    },
    { jar, redirects: 0 }
  );
  check(loginRes, {
    "login redirected (302)": (r) => r.status === 302,
    "login did not return to /login with an error": (r) =>
      !(r.headers.Location || "").includes("error="),
  });

  return jar;
}
