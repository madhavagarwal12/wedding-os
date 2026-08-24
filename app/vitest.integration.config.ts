import { defineConfig } from "vitest/config";
import path from "node:path";

// Integration tests hit a real local Postgres database (weddingos_test).
// They're run with `npm run test:integration`, which loads .env.test via
// dotenv-cli so DATABASE_URL already points at the test DB before this
// config (and src/lib/prisma.ts's module-level connection pool) is
// evaluated. Kept in a separate config/script from unit tests so
// `npm run test:unit` never needs Postgres running.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/__tests__/integration/**/*.test.ts"],
    setupFiles: ["./src/__tests__/integration/setup/vitest.setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Integration tests share one physical database and truncate it
    // between tests; run test files sequentially in a single process to
    // avoid cross-file races on that shared state (otherwise Vitest
    // interleaves multiple test files' beforeEach/resetDb calls even with
    // a single worker fork).
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
