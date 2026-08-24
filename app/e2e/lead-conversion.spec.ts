import { expect, test } from "@playwright/test";

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "owner@weddingops.local";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "ChangeMe123!";

// Best-effort core-workflow smoke path: create a Lead, convert it, land on
// the resulting Wedding page. Lower priority than auth.spec.ts — if the UI
// shifts (dialog copy, field labels), fix here rather than in auth.spec.ts.
test("create a Lead, convert it, and land on the Wedding page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OWNER_EMAIL);
  await page.getByLabel("Password").fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

  const leadName = `Playwright Smoke Lead ${Date.now()}`;

  await page.goto("/leads");
  await page.getByRole("button", { name: "New lead" }).click();

  await page.getByLabel("Lead / family name").fill(leadName);
  await page.getByLabel("Primary contact").fill("Smoke Test Contact");
  await page.getByLabel("Phone", { exact: true }).fill("9000000000");

  await page.getByRole("button", { name: "Create lead" }).click();
  await expect(page.getByText("Lead created.")).toBeVisible({ timeout: 10_000 });

  await page.goto("/leads");
  await page.getByRole("link", { name: leadName }).click();
  await page.waitForURL(/\/leads\/[^/]+$/);

  await page.getByRole("button", { name: "Mark Won & convert" }).click();

  const weddingName = `${leadName} Wedding`;
  await page.getByLabel("Wedding name").fill(weddingName);
  await page.getByLabel("Wedding date").fill("2027-06-15");
  await page.getByLabel("Project value").fill("500000");

  await page.getByRole("button", { name: "Convert to wedding" }).click();

  await page.waitForURL(/\/weddings\/[^/]+$/, { timeout: 15_000 });
  await expect(page.getByText(weddingName)).toBeVisible();
});
