import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb, seedClient, seedOrganization, seedUser, seedWedding } from "./setup/db";

// There is no exported "delete a wedding" server action in the app (only
// archive/restore soft-delete) — deleting a Wedding row happens directly
// via Prisma, relying on the `onDelete: Cascade` relations declared in
// prisma/schema.prisma. This test proves that cascade actually removes
// every dependent row across the tree, matching what the schema promises.
describe("Wedding delete cascade", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("removes every dependent record when the Wedding is deleted", async () => {
    const org = await seedOrganization();
    const owner = await seedUser(org.id, "OWNER");
    const client = await seedClient();
    const wedding = await seedWedding(client.id, { projectManagerId: owner.id });

    await prisma.weddingTeamMember.create({
      data: { weddingId: wedding.id, userId: owner.id },
    });

    const func = await prisma.function.create({
      data: { weddingId: wedding.id, name: "Sangeet", date: new Date("2027-01-14") },
    });

    const vendor = await prisma.vendor.create({
      data: { name: "Test Vendor", category: "CATERER", phone: "8888888888" },
    });

    const vendorBooking = await prisma.vendorBooking.create({
      data: {
        vendorId: vendor.id,
        weddingId: wedding.id,
        functionId: func.id,
        agreedAmount: 100000,
      },
    });

    const guest = await prisma.guest.create({
      data: { weddingId: wedding.id, name: "Guest One" },
    });

    await prisma.functionGuest.create({
      data: { guestId: guest.id, functionId: func.id },
    });

    const budgetItem = await prisma.budgetItem.create({
      data: { weddingId: wedding.id, category: "Catering", plannedAmount: 100000 },
    });

    const clientPayment = await prisma.clientPayment.create({
      data: { weddingId: wedding.id, amount: 200000, dueDate: new Date("2027-01-01") },
    });

    const vendorPayment = await prisma.vendorPayment.create({
      data: {
        vendorBookingId: vendorBooking.id,
        weddingId: wedding.id,
        amount: 50000,
        dueDate: new Date("2027-01-01"),
      },
    });

    const timelineItem = await prisma.timelineItem.create({
      data: { weddingId: wedding.id, title: "Book caterer", date: new Date("2026-12-01") },
    });

    // Sanity check: everything actually got created before we delete.
    expect(await prisma.function.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.vendorBooking.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.guest.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.budgetItem.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.clientPayment.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.vendorPayment.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.timelineItem.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.weddingTeamMember.count({ where: { weddingId: wedding.id } })).toBe(1);
    expect(await prisma.functionGuest.count({ where: { functionId: func.id } })).toBe(1);

    await prisma.wedding.delete({ where: { id: wedding.id } });

    expect(await prisma.wedding.findUnique({ where: { id: wedding.id } })).toBeNull();
    expect(await prisma.function.findUnique({ where: { id: func.id } })).toBeNull();
    expect(await prisma.vendorBooking.findUnique({ where: { id: vendorBooking.id } })).toBeNull();
    expect(await prisma.guest.findUnique({ where: { id: guest.id } })).toBeNull();
    expect(await prisma.budgetItem.findUnique({ where: { id: budgetItem.id } })).toBeNull();
    expect(await prisma.clientPayment.findUnique({ where: { id: clientPayment.id } })).toBeNull();
    expect(await prisma.vendorPayment.findUnique({ where: { id: vendorPayment.id } })).toBeNull();
    expect(await prisma.timelineItem.findUnique({ where: { id: timelineItem.id } })).toBeNull();
    expect(await prisma.weddingTeamMember.count({ where: { weddingId: wedding.id } })).toBe(0);
    expect(await prisma.functionGuest.count({ where: { functionId: func.id } })).toBe(0);

    // Rows outside the Wedding's ownership tree must survive.
    expect(await prisma.vendor.findUnique({ where: { id: vendor.id } })).not.toBeNull();
    expect(await prisma.client.findUnique({ where: { id: client.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: owner.id } })).not.toBeNull();
  });
});
