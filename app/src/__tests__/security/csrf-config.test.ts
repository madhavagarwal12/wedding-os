import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// SEC: CSRF protection on Server Actions. Next.js Server Actions enforce a
// same-origin check on the request `Origin`/`Host` headers by default; the
// only way to weaken it is `experimental.serverActions.allowedOrigins` in
// next.config.ts (to explicitly widen it) or setting `NODE_ENV` tricks that
// disable the check. This test statically confirms next.config.ts does not
// configure `allowedOrigins` (or otherwise touch `serverActions`), so the
// framework default (same-origin only) is what's actually deployed. This
// can't be verified by calling a Server Action directly in Vitest (there's
// no HTTP layer / Origin header to check in that context) — it has to be a
// config-source check.
describe("CSRF / Server Actions origin check is not weakened", () => {
  it("next.config.ts does not set experimental.serverActions.allowedOrigins", () => {
    const configPath = path.resolve(__dirname, "../../../next.config.ts");
    expect(existsSync(configPath)).toBe(true);
    const contents = readFileSync(configPath, "utf8");
    expect(contents).not.toMatch(/allowedOrigins/);
    expect(contents).not.toMatch(/serverActions\s*:/);
  });

  it("form-action CSP directive is restricted to 'self' (belt-and-suspenders against action hijacking)", () => {
    const configPath = path.resolve(__dirname, "../../../next.config.ts");
    const contents = readFileSync(configPath, "utf8");
    expect(contents).toMatch(/form-action 'self'/);
  });
});
