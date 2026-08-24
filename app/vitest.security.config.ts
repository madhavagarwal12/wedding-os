import { defineConfig } from "vitest/config";
import path from "node:path";

// Security tests reuse the same real-Postgres + mocked-auth harness as the
// integration suite (src/__tests__/integration/setup) because RBAC/audit/
// injection/XSS checks need to call the real server actions end-to-end
// against a real database, not a mocked Prisma client. Kept as its own
// config/script (`npm run test:security`) so `npm run test:unit` stays
// DB-free and `npm run test:integration` stays scoped to functional
// coverage — this suite is explicitly about attack-surface verification.
//
// A couple of tests in this suite (unauthenticated-access, rate-limiting)
// additionally make real HTTP requests to a running server on
// http://localhost:3000 (or $SECURITY_TEST_BASE_URL). They skip themselves
// with a clear console note if nothing is listening there — see
// src/__tests__/security/live-server.ts.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/__tests__/security/**/*.test.ts"],
    setupFiles: ["./src/__tests__/integration/setup/vitest.setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
