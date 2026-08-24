"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditSnapshot } from "@/lib/audit";
import { COMMUNICATION_CHANNELS } from "@/lib/communication-labels";
import type { RecordScope } from "@/lib/actions/meetings";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

function scopeToRelation(scope: RecordScope) {
  switch (scope.type) {
    case "lead":
      return { leadId: scope.id };
    case "client":
      return { clientId: scope.id };
    case "wedding":
      return { weddingId: scope.id };
  }
}

function scopePath(scope: RecordScope) {
  switch (scope.type) {
    case "lead":
      return `/leads/${scope.id}`;
    case "client":
      return `/clients/${scope.id}`;
    case "wedding":
      return `/weddings/${scope.id}`;
  }
}

const noteSchema = z.object({
  contactPerson: z.string().optional(),
  channel: z.enum(COMMUNICATION_CHANNELS as [string, ...string[]]),
  summary: z.string().min(1, "Summary is required"),
  outcome: z.string().optional(),
  followUpRequired: z.boolean(),
  followUpDate: z.string().optional(),
});

export async function createCommunicationNoteAction(
  scope: RecordScope,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = noteSchema.safeParse({
    contactPerson: formData.get("contactPerson") || undefined,
    channel: formData.get("channel"),
    summary: formData.get("summary"),
    outcome: formData.get("outcome") || undefined,
    followUpRequired: formData.get("followUpRequired") === "on",
    followUpDate: formData.get("followUpDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const note = await prisma.communicationNote.create({
    data: {
      ...scopeToRelation(scope),
      contactPerson: data.contactPerson,
      channel: data.channel as never,
      summary: data.summary,
      outcome: data.outcome,
      followUpRequired: data.followUpRequired,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "CommunicationNote",
      entityId: note.id,
      after: auditSnapshot(note),
    },
  });

  revalidatePath(scopePath(scope));
  return { success: true };
}

export async function deleteCommunicationNoteAction(
  scope: RecordScope,
  noteId: string
) {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    throw new Error("Only an Owner can delete a communication note.");
  }
  const previous = await prisma.communicationNote.findUniqueOrThrow({
    where: { id: noteId },
  });
  await prisma.communicationNote.delete({ where: { id: noteId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "CommunicationNote",
      entityId: noteId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(scopePath(scope));
}
