import { beforeEach, vi } from "vitest";

// Server actions under test are "use server" files that call Auth.js's
// `auth()` (needs an HTTP request context) and Next's `revalidatePath` /
// `redirect` (need a Next.js request scope). None of that exists in a
// plain Vitest/Node process, so both are mocked here. This file is loaded
// via `test.setupFiles` in vitest.integration.config.ts, which registers
// the mocks before any test file's own imports run.
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => globalThis.__mockSession ?? null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

beforeEach(() => {
  globalThis.__mockSession = null;
});
