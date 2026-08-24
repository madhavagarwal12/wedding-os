"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditSnapshot } from "@/lib/audit";
import { PROPOSAL_STATUSES } from "@/lib/communication-labels";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const proposalSchema = z.object({
  amount: z.coerce.number().positive("Amount is required"),
  scope: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(PROPOSAL_STATUSES as [string, ...string[]]),
  notes: z.string().optional(),
});

function parseProposalForm(formData: FormData) {
  return proposalSchema.safeParse({
    amount: formData.get("amount"),
    scope: formData.get("scope") || undefined,
    validUntil: formData.get("validUntil") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
}

export async function createProposalAction(
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = parseProposalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const proposal = await prisma.proposal.create({
    data: {
      leadId,
      amount: data.amount,
      scope: data.scope,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      status: data.status as never,
      notes: data.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Proposal",
      entityId: proposal.id,
      after: auditSnapshot(proposal),
    },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function updateProposalAction(
  leadId: string,
  proposalId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = parseProposalForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const previous = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      amount: data.amount,
      scope: data.scope ?? null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      status: data.status as never,
      notes: data.notes ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Proposal",
      entityId: proposalId,
      before: auditSnapshot(previous),
      after: auditSnapshot(proposal),
    },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function deleteProposalAction(leadId: string, proposalId: string) {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    throw new Error("Only an Owner can delete a proposal.");
  }
  const previous = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  await prisma.proposal.delete({ where: { id: proposalId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "Proposal",
      entityId: proposalId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(`/leads/${leadId}`);
}
