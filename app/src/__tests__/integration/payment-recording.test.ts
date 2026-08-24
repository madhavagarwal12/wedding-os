import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { recordClientPaymentAction } from "@/lib/actions/finance";
import { resetDb, seedClient, seedOrganization, seedUser, seedWedding } from "./setup/db";
import { sessionFor, setMockSession } from "./setup/session";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("recordClientPaymentAction", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("transitions PARTIALLY_PAID -> PAID as amounts are recorded, and audit-logs each record", async () => {
    const org = await seedOrganization();
    const finance = await seedUser(org.id, "FINANCE");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);

    const payment = await prisma.clientPayment.create({
      data: { weddingId: wedding.id, amount: 100000, dueDate: new Date("2027-01-01") },
    });
    expect(payment.status).toBe("UPCOMING");

    setMockSession(sessionFor(finance));

    const firstResult = await recordClientPaymentAction(
      wedding.id,
      payment.id,
      {},
      formData({ paidAmount: "40000" })
    );
    expect(firstResult.success).toBe(true);

    const afterFirst = await prisma.clientPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(afterFirst.status).toBe("PARTIALLY_PAID");
    expect(Number(afterFirst.paidAmount)).toBe(40000);

    const secondResult = await recordClientPaymentAction(
      wedding.id,
      payment.id,
      {},
      formData({ paidAmount: "100000" })
    );
    expect(secondResult.success).toBe(true);

    const afterSecond = await prisma.clientPayment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(afterSecond.status).toBe("PAID");
    expect(Number(afterSecond.paidAmount)).toBe(100000);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "ClientPayment", entityId: payment.id, action: "RECORD_PAYMENT" },
      orderBy: { createdAt: "asc" },
    });
    expect(auditLogs).toHaveLength(2);
    expect(auditLogs[0].userId).toBe(finance.id);
  });
});
