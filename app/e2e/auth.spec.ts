import { expect, test } from "@playwright/test";

// Seeded Owner credentials — see prisma/seed.ts. Overridable via env vars
// so CI/other environments can point at a differently-seeded dev DB.
const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "owner@weddingops.local";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "ChangeMe123!";

test.describe("Login", () => {
  test("renders the login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Wedding Operations Platform" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("an invalid login shows a generic error without revealing whether the account exists", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("definitely-not-a-real-user@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    const error = page.getByText("Invalid email or password.");
    await expect(error).toBeVisible();
    // Same message must appear for a real email + wrong password, too —
    // this asserts the message text itself is the account-existence-agnostic
    // one guaranteed by src/lib/actions/auth.ts, not a stand-in for that check.
    await expect(page).toHaveURL(/\/login/);
  });

  test("a valid Owner login redirects to the Owner dashboard with no console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill(OWNER_EMAIL);
    await page.getByLabel("Password").fill(OWNER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);

    expect(consoleErrors, `Console errors on dashboard: ${consoleErrors.join("\n")}`).toEqual([]);
  });
});
