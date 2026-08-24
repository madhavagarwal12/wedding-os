import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { createLeadAction } from "@/lib/actions/leads";
import { createCommunicationNoteAction } from "@/lib/actions/communication-notes";
import { resetDb, seedOrganization, seedUser } from "../integration/setup/db";
import { sessionFor, setMockSession } from "../integration/setup/session";

// SEC: stored XSS. Payloads are persisted as-is (Prisma/Postgres don't
// sanitize strings, by design — that's the app's job at render time). React
// JSX escapes all interpolated text by default, so the actual XSS risk is
// only real if something uses `dangerouslySetInnerHTML`, a raw HTML email
// template, or writes unescaped user text into an API response with an HTML
// content-type. A full source grep found zero uses of
// `dangerouslySetInnerHTML` anywhere in src/ (checked separately) and no HTML
// email templates exist in this app (no /api/email routes). So the
// remaining verifiable claim here is: (a) the payload round-trips through
// the DB unmodified — nothing crashes or corrupts it — and (b) nothing in
// the source tree renders arbitrary user text as raw HTML.
describe("XSS payload handling", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  const payloads = [
    `<script>alert(1)</script>`,
    `<img src=x onerror=alert(1)>`,
    `"><svg onload=alert(1)>`,
  ];

  function formData(fields: Record<string, string>) {
    const fd = new FormData();
    for (const [key, value] of Object.entries(fields)) fd.set(key, value);
    return fd;
  }

  it.each(payloads)("createLeadAction stores %s verbatim (escaping is a render-time concern)", async (payload) => {
    const org = await seedOrganization();
    const user = await seedUser(org.id, "SALES");
    setMockSession(sessionFor(user));

    const result = await createLeadAction(
      {},
      formData({
        leadName: "XSS Test Lead",
        primaryContact: "Test Contact",
        phone: "9999999999",
        notes: payload,
      })
    );

    expect(result.success).toBe(true);
    const lead = await prisma.lead.findFirst({ where: { leadName: "XSS Test Lead" } });
    expect(lead?.notes).toBe(payload);
  });

  it.each(payloads)(
    "createCommunicationNoteAction stores %s verbatim in summary",
    async (payload) => {
      const org = await seedOrganization();
      const user = await seedUser(org.id, "SALES");
      const lead = await prisma.lead.create({
        data: { leadName: "Note Target", primaryContact: "X", phone: "1234567890" },
      });
      setMockSession(sessionFor(user));

      const result = await createCommunicationNoteAction(
        { type: "lead", id: lead.id },
        {},
        formData({ channel: "PHONE", summary: payload })
      );

      expect(result.success).toBe(true);
      const note = await prisma.communicationNote.findFirst({ where: { leadId: lead.id } });
      expect(note?.summary).toBe(payload);
    }
  );

  it("no source file uses dangerouslySetInnerHTML with request-derived data", () => {
    // Static verification, run for real here rather than assumed: walk
    // src/ and confirm zero occurrences. If this ever fires, the failure
    // message names every offending file so it's actionable.
    const srcDir = path.resolve(__dirname, "../../");
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "generated" || entry.name === "__tests__") continue;
          walk(full);
        } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
          const content = readFileSync(full, "utf8");
          if (content.includes("dangerouslySetInnerHTML")) {
            offenders.push(full);
          }
        }
      }
    }
    walk(srcDir);
    expect(offenders).toEqual([]);
  });
});
