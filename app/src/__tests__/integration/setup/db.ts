import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Truncates every application table and restarts identity sequences.
 * CASCADE means table order doesn't matter here. Call in `beforeEach` so
 * every integration test starts from a clean, independent database.
 */
export async function resetDb() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog", "Notification", "CommunicationNote", "Document", "TimelineItem",
      "VendorPayment", "ClientPayment", "BudgetItem", "FunctionGuest", "Guest",
      "VendorBooking", "Task", "WeddingTeamMember", "Function", "Wedding", "Client",
      "Negotiation", "Proposal", "Meeting", "ContactAttempt", "Lead", "Vendor",
      "Session", "User", "Organization"
    RESTART IDENTITY CASCADE;
  `);
}

export async function seedOrganization() {
  return prisma.organization.create({
    data: { name: "Integration Test Co", currency: "INR" },
  });
}

export async function seedUser(organizationId: string, role: string, suffix = "") {
  return prisma.user.create({
    data: {
      name: `${role} User${suffix}`,
      email: `${role.toLowerCase()}${suffix}@integration.test`,
      passwordHash: "not-used-in-tests",
      role: role as never,
      organizationId,
    },
  });
}

export async function seedClient(overrides: Partial<Prisma.ClientUncheckedCreateInput> = {}) {
  return prisma.client.create({
    data: {
      name: "Test Client",
      phone: "9999999999",
      ...overrides,
    },
  });
}

export async function seedWedding(
  clientId: string,
  overrides: Partial<Prisma.WeddingUncheckedCreateInput> = {}
) {
  return prisma.wedding.create({
    data: {
      name: "Test Wedding",
      clientId,
      startDate: new Date("2027-01-15"),
      projectValue: 500000,
      ...overrides,
    },
  });
}
