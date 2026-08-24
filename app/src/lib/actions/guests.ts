"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RSVP_STATUSES } from "@/lib/guest-labels";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const guestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  familyGroup: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1),
  notes: z.string().optional(),
});

function parseGuestForm(formData: FormData) {
  return guestSchema.safeParse({
    name: formData.get("name"),
    familyGroup: formData.get("familyGroup") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    guestCount: formData.get("guestCount") || 1,
    notes: formData.get("notes") || undefined,
  });
}

export async function createGuestAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseGuestForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const functionIds = formData.getAll("functionIds") as string[];

  await prisma.guest.create({
    data: {
      weddingId,
      name: data.name,
      familyGroup: data.familyGroup,
      phone: data.phone,
      email: data.email || undefined,
      guestCount: data.guestCount,
      notes: data.notes,
      functionAttendance: functionIds.length
        ? { create: functionIds.map((functionId) => ({ functionId })) }
        : undefined,
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/guests");
  return { success: true };
}

export async function updateGuestAction(
  weddingId: string,
  guestId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseGuestForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const functionIds = formData.getAll("functionIds") as string[];

  await prisma.$transaction([
    prisma.guest.update({
      where: { id: guestId },
      data: {
        name: data.name,
        familyGroup: data.familyGroup,
        phone: data.phone,
        email: data.email || null,
        guestCount: data.guestCount,
        notes: data.notes,
      },
    }),
    prisma.functionGuest.deleteMany({ where: { guestId } }),
    ...(functionIds.length
      ? [
          prisma.functionGuest.createMany({
            data: functionIds.map((functionId) => ({ guestId, functionId })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/guests");
  return { success: true };
}

export async function updateGuestRsvpAction(
  weddingId: string,
  guestId: string,
  status: string
) {
  await requireUser();
  if (!RSVP_STATUSES.includes(status as never)) throw new Error("Invalid status");
  await prisma.guest.update({
    where: { id: guestId },
    data: { rsvpStatus: status as never },
  });
  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/guests");
}

export async function deleteGuestAction(weddingId: string, guestId: string) {
  await requireUser();
  await prisma.guest.delete({ where: { id: guestId } });
  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/guests");
}
