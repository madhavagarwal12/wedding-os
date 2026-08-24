"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditSnapshot } from "@/lib/audit";
import { MEETING_TYPES } from "@/lib/communication-labels";

export type ActionState = { error?: string; success?: boolean };

export type RecordScope = { type: "lead" | "client" | "wedding"; id: string };

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

const meetingSchema = z.object({
  scheduledAt: z.string().min(1, "Date and time is required"),
  type: z.enum(MEETING_TYPES as [string, ...string[]]),
  participants: z.string().optional(),
  notes: z.string().optional(),
  requirementsDiscovered: z.string().optional(),
  decisions: z.string().optional(),
  followUpAction: z.string().optional(),
  followUpDate: z.string().optional(),
});

export async function createMeetingAction(
  scope: RecordScope,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = meetingSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    type: formData.get("type"),
    participants: formData.get("participants") || undefined,
    notes: formData.get("notes") || undefined,
    requirementsDiscovered: formData.get("requirementsDiscovered") || undefined,
    decisions: formData.get("decisions") || undefined,
    followUpAction: formData.get("followUpAction") || undefined,
    followUpDate: formData.get("followUpDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const meeting = await prisma.meeting.create({
    data: {
      ...scopeToRelation(scope),
      scheduledAt: new Date(data.scheduledAt),
      type: data.type as never,
      participants: data.participants,
      notes: data.notes,
      requirementsDiscovered: data.requirementsDiscovered,
      decisions: data.decisions,
      followUpAction: data.followUpAction,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Meeting",
      entityId: meeting.id,
      after: auditSnapshot(meeting),
    },
  });

  revalidatePath(scopePath(scope));
  return { success: true };
}

export async function deleteMeetingAction(scope: RecordScope, meetingId: string) {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    throw new Error("Only an Owner can delete a meeting.");
  }
  const previous = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
  await prisma.meeting.delete({ where: { id: meetingId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "Meeting",
      entityId: meetingId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(scopePath(scope));
}
