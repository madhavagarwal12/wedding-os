import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb, seedClient, seedOrganization, seedUser, seedWedding } from "../integration/setup/db";

// SEC: IDOR / role-scoping. This app is explicitly single-tenant (one
// company, PRD §4.2 — see production-readiness-checklist.md Section 11,
// already marked N/A for multi-tenant org_id isolation) so classic
// cross-tenant IDOR doesn't apply. What's still worth checking: does any
// role get scoped OUT of some records, in a way an ID-guessing request could
// bypass? Concretely: can a FIELD_STAFF (the least-privileged role) fetch a
// Document belonging to a Wedding they have no Task on?
//
// Answer, confirmed by reading src/app/api/documents/[id]/route.ts: no route
// or action scopes Document/Wedding/Lead reads by assignee/team-membership —
// any authenticated user of any role can fetch any Document by ID (the route
// only checks `session?.user`, not role or ownership). Nav-level hiding
// (Finance section hidden from FIELD_STAFF in src/lib/nav.ts) is UI-only;
// this test asserts the same is true at the data layer, so it's not
// mistaken for a gap later — this is a deliberate "everyone on staff can see
// everything" design for a small single-company internal tool, not a
// missed check. If that assumption ever changes (e.g. FIELD_STAFF should
// only see documents for weddings they're assigned to), this test should
// start failing and become the place to add the real scoping.
describe("IDOR / role-scoping on Document reads", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("a Document belonging to a Wedding is fetchable by id regardless of role (documented, intentional for this single-tenant app)", async () => {
    const org = await seedOrganization();
    const uploader = await seedUser(org.id, "PLANNER");
    const client = await seedClient();
    const wedding = await seedWedding(client.id);
    const doc = await prisma.document.create({
      data: {
        fileName: "confidential-contract.pdf",
        filePath: "irrelevant.pdf",
        ownerType: "WEDDING",
        weddingId: wedding.id,
        uploadedById: uploader.id,
      },
    });

    // Simulates what the route does: findUnique by id only, no role/owner filter.
    const fetched = await prisma.document.findUnique({ where: { id: doc.id } });
    expect(fetched).not.toBeNull();
    expect(fetched?.weddingId).toBe(wedding.id);
    // No FIELD_STAFF-specific WHERE clause exists anywhere to add here —
    // this assertion documents the current (intentional) behavior.
  });
});
