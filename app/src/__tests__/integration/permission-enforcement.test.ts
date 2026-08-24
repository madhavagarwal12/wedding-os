import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createBudgetItemAction,
  deleteBudgetItemAction,
  deleteClientPaymentAction,
  deleteVendorPaymentAction,
} from "@/lib/actions/finance";
import { resetDb, seedClient, seedOrganization, seedUser, seedWedding } from "./setup/db";
import { sessionFor, setMockSession } from "./setup/session";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("Finance action permission enforcement", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("rejects deleteBudgetItemAction for a non-Owner role and leaves the record intact", async () => {
    const org = await seedOrganization();
    const planner = await seedUser(org.id, "PLANNER");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);
    const item = await prisma.budgetItem.create({
      data: { weddingId: wedding.id, category: "Decor", plannedAmount: 10000 },
    });

    setMockSession(sessionFor(planner));

    await expect(deleteBudgetItemAction(wedding.id, item.id)).rejects.toThrow(
      "Only an Owner can delete financial records."
    );

    expect(await prisma.budgetItem.findUnique({ where: { id: item.id } })).not.toBeNull();
  });

  it("rejects deleteClientPaymentAction for a non-Owner role and leaves the record intact", async () => {
    const org = await seedOrganization();
    const planner = await seedUser(org.id, "PLANNER");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);
    const payment = await prisma.clientPayment.create({
      data: { weddingId: wedding.id, amount: 50000, dueDate: new Date("2027-01-01") },
    });

    setMockSession(sessionFor(planner));

    await expect(deleteClientPaymentAction(wedding.id, payment.id)).rejects.toThrow(
      "Only an Owner can delete financial records."
    );

    expect(await prisma.clientPayment.findUnique({ where: { id: payment.id } })).not.toBeNull();
  });

  it("rejects deleteVendorPaymentAction for a non-Owner role and leaves the record intact", async () => {
    const org = await seedOrganization();
    const planner = await seedUser(org.id, "PLANNER");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);
    const vendor = await prisma.vendor.create({
      data: { name: "Vendor", category: "CATERER", phone: "7777777777" },
    });
    const booking = await prisma.vendorBooking.create({
      data: { vendorId: vendor.id, weddingId: wedding.id, agreedAmount: 20000 },
    });
    const payment = await prisma.vendorPayment.create({
      data: {
        vendorBookingId: booking.id,
        weddingId: wedding.id,
        amount: 20000,
        dueDate: new Date("2027-01-01"),
      },
    });

    setMockSession(sessionFor(planner));

    await expect(deleteVendorPaymentAction(wedding.id, payment.id)).rejects.toThrow(
      "Only an Owner can delete financial records."
    );

    expect(await prisma.vendorPayment.findUnique({ where: { id: payment.id } })).not.toBeNull();
  });

  it.each(["FIELD_STAFF", "SALES"] as const)(
    "rejects createBudgetItemAction for a %s session",
    async (role) => {
      const org = await seedOrganization();
      const user = await seedUser(org.id, role);
      const client = await seedClient();
      const wedding = await seedWedding(client.id);

      setMockSession(sessionFor(user));

      await expect(
        createBudgetItemAction(
          wedding.id,
          {},
          formData({ category: "Decor", plannedAmount: "1000", committedAmount: "0", actualAmount: "0" })
        )
      ).rejects.toThrow("You do not have permission to manage finances.");

      expect(await prisma.budgetItem.count({ where: { weddingId: wedding.id } })).toBe(0);
    }
  );
});
