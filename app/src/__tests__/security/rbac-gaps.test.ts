import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUserAction, toggleUserActiveAction } from "@/lib/actions/users";
import { updateOrganizationAction } from "@/lib/actions/organization";
import { deleteDocumentAction } from "@/lib/actions/documents";
import { deleteCommunicationNoteAction } from "@/lib/actions/communication-notes";
import { deleteMeetingAction } from "@/lib/actions/meetings";
import { deleteVendorBookingAction } from "@/lib/actions/vendors";
import { deleteFunctionAction } from "@/lib/actions/weddings";
import {
  resetDb,
  seedClient,
  seedOrganization,
  seedUser,
  seedWedding,
} from "../integration/setup/db";
import { sessionFor, setMockSession } from "../integration/setup/session";

// SEC: RBAC enforcement for role-gated server actions NOT already covered by
// src/__tests__/integration/permission-enforcement.test.ts (which only
// covers the Finance actions). This file fills the remaining gaps: user
// management (Owner-only), organization settings (Owner-only), document
// delete (uploader-or-Owner), and the Owner-only delete actions on
// Communication Notes / Meetings, plus the mixed Owner-or-role deletes on
// Vendor Bookings and Functions.
function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("RBAC enforcement on non-finance server actions", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("createUserAction rejects a non-Owner session and creates no user", async () => {
    const org = await seedOrganization();
    const planner = await seedUser(org.id, "PLANNER");
    setMockSession(sessionFor(planner));

    const result = await createUserAction(
      {},
      formData({
        name: "New Hire",
        email: "newhire@test.local",
        role: "SALES",
        password: "SomePassword123",
      })
    );

    expect(result.error).toBe("You do not have permission to do this.");
    expect(await prisma.user.findUnique({ where: { email: "newhire@test.local" } })).toBeNull();
  });

  it("toggleUserActiveAction throws for a non-Owner session and leaves the user active", async () => {
    const org = await seedOrganization();
    const planner = await seedUser(org.id, "PLANNER");
    const target = await seedUser(org.id, "SALES", "-target");
    setMockSession(sessionFor(planner));

    await expect(toggleUserActiveAction(target.id)).rejects.toThrow("Forbidden");
    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(reloaded.isActive).toBe(true);
  });

  it("updateOrganizationAction rejects a non-Owner session", async () => {
    const org = await seedOrganization();
    const finance = await seedUser(org.id, "FINANCE");
    setMockSession(sessionFor(finance));

    const result = await updateOrganizationAction(
      {},
      formData({ name: "Hacked Co", currency: "INR" })
    );

    expect(result.error).toBe("You do not have permission to do this.");
    const reloaded = await prisma.organization.findUniqueOrThrow({ where: { id: org.id } });
    expect(reloaded.name).not.toBe("Hacked Co");
  });

  it("deleteDocumentAction rejects a non-uploader, non-Owner session", async () => {
    const org = await seedOrganization();
    const uploader = await seedUser(org.id, "SALES", "-uploader");
    const outsider = await seedUser(org.id, "FIELD_STAFF", "-outsider");
    const lead = await prisma.lead.create({
      data: { leadName: "Doc Target", primaryContact: "X", phone: "1234567890" },
    });
    const doc = await prisma.document.create({
      data: {
        fileName: "contract.pdf",
        filePath: "irrelevant-for-this-test.pdf",
        ownerType: "LEAD",
        leadId: lead.id,
        uploadedById: uploader.id,
      },
    });

    setMockSession(sessionFor(outsider));
    await expect(deleteDocumentAction(doc.id, `/leads/${lead.id}`)).rejects.toThrow(
      "Only the uploader or an Owner can delete this document."
    );
    expect(await prisma.document.findUnique({ where: { id: doc.id } })).not.toBeNull();
  });

  it("deleteCommunicationNoteAction rejects a non-Owner session", async () => {
    const org = await seedOrganization();
    const sales = await seedUser(org.id, "SALES");
    const lead = await prisma.lead.create({
      data: { leadName: "Note Target", primaryContact: "X", phone: "1234567890" },
    });
    const note = await prisma.communicationNote.create({
      data: { leadId: lead.id, channel: "PHONE", summary: "Called client", createdById: sales.id },
    });

    setMockSession(sessionFor(sales));
    await expect(
      deleteCommunicationNoteAction({ type: "lead", id: lead.id }, note.id)
    ).rejects.toThrow("Only an Owner can delete a communication note.");
    expect(await prisma.communicationNote.findUnique({ where: { id: note.id } })).not.toBeNull();
  });

  it("deleteMeetingAction rejects a non-Owner session", async () => {
    const org = await seedOrganization();
    const sales = await seedUser(org.id, "SALES");
    const lead = await prisma.lead.create({
      data: { leadName: "Meeting Target", primaryContact: "X", phone: "1234567890" },
    });
    const meeting = await prisma.meeting.create({
      data: {
        leadId: lead.id,
        type: "DISCOVERY",
        scheduledAt: new Date("2027-02-01T10:00:00Z"),
        createdById: sales.id,
      },
    });

    setMockSession(sessionFor(sales));
    await expect(deleteMeetingAction({ type: "lead", id: lead.id }, meeting.id)).rejects.toThrow(
      "Only an Owner can"
    );
    expect(await prisma.meeting.findUnique({ where: { id: meeting.id } })).not.toBeNull();
  });

  it("deleteVendorBookingAction rejects roles other than Owner/Vendor Manager", async () => {
    const org = await seedOrganization();
    const fieldStaff = await seedUser(org.id, "FIELD_STAFF");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);
    const vendor = await prisma.vendor.create({
      data: { name: "Caterer Co", category: "CATERER", phone: "7777777777" },
    });
    const booking = await prisma.vendorBooking.create({
      data: { vendorId: vendor.id, weddingId: wedding.id, agreedAmount: 10000 },
    });

    setMockSession(sessionFor(fieldStaff));
    await expect(deleteVendorBookingAction(wedding.id, booking.id)).rejects.toThrow();
    expect(await prisma.vendorBooking.findUnique({ where: { id: booking.id } })).not.toBeNull();
  });

  it("deleteFunctionAction rejects roles other than Owner/Planner", async () => {
    const org = await seedOrganization();
    const fieldStaff = await seedUser(org.id, "FIELD_STAFF");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);
    const fn = await prisma.function.create({
      data: { weddingId: wedding.id, name: "Sangeet", date: new Date("2027-01-14") },
    });

    setMockSession(sessionFor(fieldStaff));
    await expect(deleteFunctionAction(wedding.id, fn.id)).rejects.toThrow();
    expect(await prisma.function.findUnique({ where: { id: fn.id } })).not.toBeNull();
  });
});
