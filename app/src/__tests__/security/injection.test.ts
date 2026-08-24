import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createLeadAction } from "@/lib/actions/leads";
import { createClientAction } from "@/lib/actions/clients";
import { resetDb, seedOrganization, seedUser } from "../integration/setup/db";
import { sessionFor, setMockSession } from "../integration/setup/session";

// SEC: SQL-injection-style payloads through real text fields, via the real
// server actions (Prisma parameterizes all queries here — there is no raw
// SQL / $queryRawUnsafe with user input anywhere in src/lib/actions). Confirms
// the payload is stored verbatim as a harmless string (not executed, no
// syntax error) and that no raw Postgres/Prisma error ever reaches the
// caller in the returned ActionState.
describe("Injection resistance", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  const payloads = [
    `'; DROP TABLE "Lead"; --`,
    `' OR '1'='1`,
    `Robert'); DROP TABLE "User";--`,
    `${"a".repeat(5)}' UNION SELECT * FROM "User" --`,
  ];

  function formData(fields: Record<string, string>) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) fd.set(key, value);
    return fd;
  }

  it.each(payloads)("createLeadAction stores %s verbatim in notes with no DB error leaking", async (payload) => {
    const org = await seedOrganization();
    const user = await seedUser(org.id, "SALES");
    setMockSession(sessionFor(user));

    const result = await createLeadAction(
      {},
      formData({
        leadName: "Injection Test Lead",
        primaryContact: "Test Contact",
        phone: "9999999999",
        notes: payload,
      })
    );

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);

    const lead = await prisma.lead.findFirst({ where: { leadName: "Injection Test Lead" } });
    expect(lead?.notes).toBe(payload);

    // The tables targeted by the payloads must still exist and be intact.
    const userCount = await prisma.user.count();
    expect(userCount).toBeGreaterThan(0);
    const leadCount = await prisma.lead.count();
    expect(leadCount).toBeGreaterThan(0);
  });

  it.each(payloads)("createClientAction stores %s verbatim in name with no DB error leaking", async (payload) => {
    const org = await seedOrganization();
    const user = await seedUser(org.id, "SALES");
    setMockSession(sessionFor(user));

    const result = await createClientAction(
      {},
      formData({
        name: payload,
        phone: "8888888888",
      })
    );

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);

    const client = await prisma.client.findFirst({ where: { phone: "8888888888" } });
    expect(client?.name).toBe(payload);

    const clientTableStillExists = await prisma.client.count();
    expect(clientTableStillExists).toBeGreaterThan(0);
  });
});
