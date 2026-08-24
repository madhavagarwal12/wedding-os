import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { convertLeadAction } from "@/lib/actions/leads";
import { resetDb, seedOrganization, seedUser } from "./setup/db";
import { sessionFor, setMockSession } from "./setup/session";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("convertLeadAction", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("creates a Client + Wedding carrying over Lead data, without requiring re-entry, and links the Lead back", async () => {
    const org = await seedOrganization();
    const sales = await seedUser(org.id, "SALES");

    const lead = await prisma.lead.create({
      data: {
        leadName: "Sharma Wedding",
        primaryContact: "Rohit Sharma",
        phone: "9123456780",
        whatsapp: "9123456780",
        email: "rohit@example.com",
        location: "Jaipur",
        estimatedGuestCount: 300,
        estimatedBudget: 1500000,
        assignedToId: sales.id,
        status: "NEGOTIATION",
      },
    });

    setMockSession(sessionFor(sales));

    const result = await convertLeadAction(
      lead.id,
      {},
      formData({
        weddingName: "Sharma Wedding 2027",
        startDate: "2027-02-10",
        projectValue: "1500000",
        // newClientName / newClientPhone / primaryVenue intentionally
        // omitted: convertLeadAction should fall back to the Lead's own
        // primaryContact/phone/location instead of requiring re-entry.
      })
    );

    // convertLeadAction calls redirect() as its last statement; it's
    // mocked to a no-op in setup/vitest.setup.ts, so on success the
    // function simply returns without a value.
    expect(result).toBeUndefined();

    const client = await prisma.client.findUnique({ where: { leadId: lead.id } });
    expect(client).not.toBeNull();
    expect(client?.name).toBe(lead.primaryContact);
    expect(client?.phone).toBe(lead.phone);
    expect(client?.whatsapp).toBe(lead.whatsapp);
    expect(client?.email).toBe(lead.email);

    const wedding = await prisma.wedding.findFirstOrThrow({ where: { clientId: client!.id } });
    expect(wedding.name).toBe("Sharma Wedding 2027");
    expect(wedding.primaryVenue).toBe(lead.location); // carried over, not re-entered
    expect(wedding.estimatedGuestCount).toBe(lead.estimatedGuestCount);
    expect(Number(wedding.projectValue)).toBe(1500000);
    expect(wedding.projectManagerId).toBe(sales.id); // carried over from lead.assignedToId

    const teamMember = await prisma.weddingTeamMember.findFirst({
      where: { weddingId: wedding.id, userId: sales.id },
    });
    expect(teamMember).not.toBeNull();

    const updatedLead = await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } });
    expect(updatedLead.status).toBe("WON");

    const auditLog = await prisma.auditLog.findFirst({
      where: { entityType: "Lead", entityId: lead.id, action: "CONVERT" },
    });
    expect(auditLog).not.toBeNull();
  });
});
