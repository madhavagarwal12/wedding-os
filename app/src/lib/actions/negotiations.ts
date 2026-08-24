"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditSnapshot } from "@/lib/audit";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const negotiationSchema = z.object({
  originalValue: z.coerce.number().positive("Original value is required"),
  revisedValue: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  finalValue: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  notes: z.string().optional(),
  decisionDate: z.string().optional(),
});

export async function createNegotiationAction(
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = negotiationSchema.safeParse({
    originalValue: formData.get("originalValue"),
    revisedValue: formData.get("revisedValue") || undefined,
    finalValue: formData.get("finalValue") || undefined,
    notes: formData.get("notes") || undefined,
    decisionDate: formData.get("decisionDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const negotiation = await prisma.negotiation.create({
    data: {
      leadId,
      originalValue: data.originalValue,
      revisedValue: data.revisedValue,
      finalValue: data.finalValue,
      notes: data.notes,
      decisionDate: data.decisionDate ? new Date(data.decisionDate) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Negotiation",
      entityId: negotiation.id,
      after: auditSnapshot(negotiation),
    },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function deleteNegotiationAction(leadId: string, negotiationId: string) {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    throw new Error("Only an Owner can delete a negotiation.");
  }
  const previous = await prisma.negotiation.findUniqueOrThrow({
    where: { id: negotiationId },
  });
  await prisma.negotiation.delete({ where: { id: negotiationId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "Negotiation",
      entityId: negotiationId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(`/leads/${leadId}`);
}
