import type { Role } from "@/generated/prisma/enums";

export type MockUser = {
  id: string;
  role: Role;
  email: string;
  name: string;
  organizationId: string;
};

export type MockSession = { user: MockUser } | null;

declare global {
  var __mockSession: MockSession;
}

/**
 * Sets the session that the mocked `auth()` (see ./vitest.setup.ts) returns
 * for the rest of the current test. Server actions under test call
 * `auth()` internally to determine the current user's role.
 */
export function setMockSession(session: MockSession) {
  globalThis.__mockSession = session;
}

export function clearMockSession() {
  globalThis.__mockSession = null;
}

export function sessionFor(user: MockUser): MockSession {
  return { user };
}
