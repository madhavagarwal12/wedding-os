import { defineConfig, devices } from "@playwright/test";

// E2E smoke tests run against the real dev server + real dev database
// (weddingos on localhost:5433) — this is intentionally read-mostly, no
// throwaway third database. `npm run dev` is started automatically by the
// `webServer` block below if nothing is already listening on port 3000.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
