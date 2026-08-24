"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WEDDING_STATUSES } from "@/lib/wedding-status";
import { CAN_DELETE, type Role } from "@/lib/roles";
import { notifyUser } from "@/lib/actions/notifications";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const weddingSchema = z.object({
  name: z.string().min(1, "Wedding name is required"),
  clientId: z.string().min(1, "Client is required"),
  brideName: z.string().optional(),
  groomName: z.string().optional(),
  primaryContact: z.string().optional(),
  startDate: z.string().min(1, "Wedding date is required"),
  endDate: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  primaryVenue: z.string().optional(),
  estimatedGuestCount: z.coerce.number().int().positive().optional().or(z.nan().transform(() => undefined)),
  projectValue: z.coerce.number().positive("Project value is required"),
  projectManagerId: z.string().optional(),
  notes: z.string().optional(),
});

function parseWeddingForm(formData: FormData) {
  return weddingSchema.safeParse({
    name: formData.get("name"),
    clientId: formData.get("clientId"),
    brideName: formData.get("brideName") || undefined,
    groomName: formData.get("groomName") || undefined,
    primaryContact: formData.get("primaryContact") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    primaryVenue: formData.get("primaryVenue") || undefined,
    estimatedGuestCount: formData.get("estimatedGuestCount") || undefined,
    projectValue: formData.get("projectValue"),
    projectManagerId: formData.get("projectManagerId") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createWeddingAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseWeddingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const wedding = await prisma.wedding.create({
    data: {
      name: data.name,
      clientId: data.clientId,
      brideName: data.brideName,
      groomName: data.groomName,
      primaryContact: data.primaryContact,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      city: data.city,
      state: data.state,
      primaryVenue: data.primaryVenue,
      estimatedGuestCount: data.estimatedGuestCount,
      projectValue: data.projectValue,
      projectManagerId: data.projectManagerId || undefined,
      notes: data.notes,
    },
  });

  if (data.projectManagerId) {
    await prisma.weddingTeamMember.create({
      data: { weddingId: wedding.id, userId: data.projectManagerId },
    });
  }

  revalidatePath("/weddings");
  return { success: true };
}

export async function updateWeddingAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseWeddingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.wedding.update({
    where: { id: weddingId },
    data: {
      name: data.name,
      clientId: data.clientId,
      brideName: data.brideName,
      groomName: data.groomName,
      primaryContact: data.primaryContact,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      city: data.city,
      state: data.state,
      primaryVenue: data.primaryVenue,
      estimatedGuestCount: data.estimatedGuestCount ?? null,
      projectValue: data.projectValue,
      projectManagerId: data.projectManagerId || null,
      notes: data.notes,
    },
  });

  revalidatePath("/weddings");
  revalidatePath(`/weddings/${weddingId}`);
  return { success: true };
}

export async function updateWeddingStatusAction(weddingId: string, status: string) {
  const session = await requireUser();
  if (!WEDDING_STATUSES.includes(status as never)) throw new Error("Invalid status");
  const previous = await prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } });
  await prisma.wedding.update({
    where: { id: weddingId },
    data: { status: status as never },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "Wedding",
      entityId: weddingId,
      before: { status: previous.status },
      after: { status },
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/weddings");
}

export async function archiveWeddingAction(weddingId: string) {
  const session = await requireUser();
  if (!CAN_DELETE.includes(session.user.role as Role)) {
    throw new Error("Only an Owner can archive a wedding.");
  }
  const previous = await prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } });
  const archivedAt = new Date();
  await prisma.wedding.update({ where: { id: weddingId }, data: { archivedAt } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ARCHIVE",
      entityType: "Wedding",
      entityId: weddingId,
      before: { archivedAt: previous.archivedAt?.toISOString() ?? null },
      after: { archivedAt: archivedAt.toISOString() },
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/weddings");
}

export async function restoreWeddingAction(weddingId: string) {
  const session = await requireUser();
  if (!CAN_DELETE.includes(session.user.role as Role)) {
    throw new Error("Only an Owner can restore a wedding.");
  }
  await prisma.wedding.update({ where: { id: weddingId }, data: { archivedAt: null } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RESTORE",
      entityType: "Wedding",
      entityId: weddingId,
      after: { archivedAt: null },
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/weddings");
}

export async function addTeamMemberAction(weddingId: string, userId: string) {
  const session = await requireUser();
  await prisma.weddingTeamMember.upsert({
    where: { weddingId_userId: { weddingId, userId } },
    update: {},
    create: { weddingId, userId },
  });
  if (userId !== session.user.id) {
    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
    if (wedding) {
      await notifyUser({
        userId,
        type: "WEDDING",
        title: `Added to wedding team: ${wedding.name}`,
        link: `/weddings/${weddingId}`,
      });
    }
  }
  revalidatePath(`/weddings/${weddingId}`);
}

export async function removeTeamMemberAction(weddingId: string, userId: string) {
  await requireUser();
  await prisma.weddingTeamMember.deleteMany({ where: { weddingId, userId } });
  revalidatePath(`/weddings/${weddingId}`);
}

const functionSchema = z.object({
  name: z.string().min(1, "Function name is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  guestCount: z.coerce.number().int().positive().optional().or(z.nan().transform(() => undefined)),
  description: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

function parseFunctionForm(formData: FormData, date: string) {
  const startTimeRaw = formData.get("startTime");
  const endTimeRaw = formData.get("endTime");
  return functionSchema.safeParse({
    name: formData.get("name"),
    date,
    startTime: startTimeRaw ? `${date}T${startTimeRaw}` : undefined,
    endTime: endTimeRaw ? `${date}T${endTimeRaw}` : undefined,
    venue: formData.get("venue") || undefined,
    guestCount: formData.get("guestCount") || undefined,
    description: formData.get("description") || undefined,
    requirements: formData.get("requirements") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createFunctionAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const date = formData.get("date") as string;
  const parsed = parseFunctionForm(formData, date);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.function.create({
    data: {
      weddingId,
      name: data.name,
      date: new Date(data.date),
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      venue: data.venue,
      guestCount: data.guestCount,
      description: data.description,
      requirements: data.requirements,
      notes: data.notes,
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  return { success: true };
}

export async function updateFunctionAction(
  weddingId: string,
  functionId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const date = formData.get("date") as string;
  const parsed = parseFunctionForm(formData, date);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.function.update({
    where: { id: functionId },
    data: {
      name: data.name,
      date: new Date(data.date),
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      venue: data.venue,
      guestCount: data.guestCount ?? null,
      description: data.description,
      requirements: data.requirements,
      notes: data.notes,
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  return { success: true };
}

export async function deleteFunctionAction(weddingId: string, functionId: string) {
  const session = await requireUser();
  if (session.user.role !== "OWNER" && session.user.role !== "PLANNER") {
    throw new Error("You do not have permission to delete functions.");
  }
  await prisma.function.delete({ where: { id: functionId } });
  revalidatePath(`/weddings/${weddingId}`);
}

const timelineSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export async function createTimelineItemAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = timelineSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    date: formData.get("date"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const functionId = formData.get("functionId") as string | null;

  await prisma.timelineItem.create({
    data: {
      weddingId,
      functionId: functionId || undefined,
      title: data.title,
      type: data.type as never,
      date: new Date(data.date),
      notes: data.notes,
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  return { success: true };
}

export async function deleteTimelineItemAction(weddingId: string, itemId: string) {
  await requireUser();
  await prisma.timelineItem.delete({ where: { id: itemId } });
  revalidatePath(`/weddings/${weddingId}`);
}
