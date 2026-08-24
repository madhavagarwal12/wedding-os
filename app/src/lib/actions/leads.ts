"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUSES } from "@/lib/lead-status";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const leadSchema = z.object({
  leadName: z.string().min(1, "Lead name is required"),
  primaryContact: z.string().min(1, "Primary contact is required"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  eventDate: z.string().optional(),
  location: z.string().optional(),
  estimatedGuestCount: z.coerce.number().int().positive().optional().or(z.nan().transform(() => undefined)),
  estimatedBudget: z.coerce.number().positive().optional().or(z.nan().transform(() => undefined)),
  expectedFunctions: z.string().optional(),
  source: z.string().optional(),
  requirements: z.string().optional(),
  assignedToId: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  notes: z.string().optional(),
});

function parseLeadForm(formData: FormData) {
  return leadSchema.safeParse({
    leadName: formData.get("leadName"),
    primaryContact: formData.get("primaryContact"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    eventDate: formData.get("eventDate") || undefined,
    location: formData.get("location") || undefined,
    estimatedGuestCount: formData.get("estimatedGuestCount") || undefined,
    estimatedBudget: formData.get("estimatedBudget") || undefined,
    expectedFunctions: formData.get("expectedFunctions") || undefined,
    source: formData.get("source") || undefined,
    requirements: formData.get("requirements") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    nextFollowUpDate: formData.get("nextFollowUpDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createLeadAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = parseLeadForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const lead = await prisma.lead.create({
    data: {
      leadName: data.leadName,
      primaryContact: data.primaryContact,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email || undefined,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      location: data.location,
      estimatedGuestCount: data.estimatedGuestCount,
      estimatedBudget: data.estimatedBudget,
      expectedFunctions: data.expectedFunctions,
      source: data.source,
      requirements: data.requirements,
      assignedToId: data.assignedToId || undefined,
      nextFollowUpDate: data.nextFollowUpDate
        ? new Date(data.nextFollowUpDate)
        : undefined,
      notes: data.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Lead",
      entityId: lead.id,
    },
  });

  revalidatePath("/leads");
  return { success: true };
}

export async function updateLeadAction(
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseLeadForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      leadName: data.leadName,
      primaryContact: data.primaryContact,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email || null,
      eventDate: data.eventDate ? new Date(data.eventDate) : null,
      location: data.location,
      estimatedGuestCount: data.estimatedGuestCount ?? null,
      estimatedBudget: data.estimatedBudget ?? null,
      expectedFunctions: data.expectedFunctions,
      source: data.source,
      requirements: data.requirements,
      assignedToId: data.assignedToId || null,
      nextFollowUpDate: data.nextFollowUpDate
        ? new Date(data.nextFollowUpDate)
        : null,
      notes: data.notes,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

export async function updateLeadStatusAction(
  leadId: string,
  status: string,
  lostReason?: string
) {
  await requireUser();
  if (!LEAD_STATUSES.includes(status as never)) {
    throw new Error("Invalid status");
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: status as never, lostReason: status === "LOST" ? lostReason : null },
  });

  revalidatePath("/leads");
  revalidatePath("/leads/pipeline");
  revalidatePath(`/leads/${leadId}`);
}

const contactAttemptSchema = z.object({
  outcome: z.string().min(1, "Outcome is required"),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  nextFollowUp: z.string().optional(),
});

export async function recordContactAttemptAction(
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = contactAttemptSchema.safeParse({
    outcome: formData.get("outcome"),
    notes: formData.get("notes") || undefined,
    nextAction: formData.get("nextAction") || undefined,
    nextFollowUp: formData.get("nextFollowUp") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.contactAttempt.create({
      data: {
        leadId,
        outcome: data.outcome,
        notes: data.notes,
        nextAction: data.nextAction,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp) : undefined,
      },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "CONTACTED",
        nextFollowUpDate: data.nextFollowUp ? new Date(data.nextFollowUp) : undefined,
      },
    }),
  ]);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads/follow-ups");
  return { success: true };
}

export async function deleteLeadAction(leadId: string) {
  const session = await requireUser();
  if (session.user.role !== "OWNER") {
    throw new Error("Only an Owner can delete a lead.");
  }
  await prisma.lead.delete({ where: { id: leadId } });
  revalidatePath("/leads");
}

const convertSchema = z.object({
  clientId: z.string().optional(),
  newClientName: z.string().optional(),
  newClientPhone: z.string().optional(),
  weddingName: z.string().min(1, "Wedding name is required"),
  startDate: z.string().min(1, "Wedding date is required"),
  projectValue: z.coerce.number().positive("Project value is required"),
  primaryVenue: z.string().optional(),
});

export async function convertLeadAction(
  leadId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = convertSchema.safeParse({
    clientId: formData.get("clientId") || undefined,
    newClientName: formData.get("newClientName") || undefined,
    newClientPhone: formData.get("newClientPhone") || undefined,
    weddingName: formData.get("weddingName"),
    startDate: formData.get("startDate"),
    projectValue: formData.get("projectValue"),
    primaryVenue: formData.get("primaryVenue") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  let clientId = data.clientId;

  const wedding = await prisma.$transaction(async (tx) => {
    if (!clientId) {
      const client = await tx.client.create({
        data: {
          leadId: lead.id,
          name: data.newClientName || lead.primaryContact,
          phone: data.newClientPhone || lead.phone,
          whatsapp: lead.whatsapp,
          email: lead.email,
        },
      });
      clientId = client.id;
    }

    const created = await tx.wedding.create({
      data: {
        name: data.weddingName,
        clientId: clientId!,
        startDate: new Date(data.startDate),
        primaryVenue: data.primaryVenue || lead.location,
        estimatedGuestCount: lead.estimatedGuestCount,
        projectValue: data.projectValue,
        projectManagerId: lead.assignedToId,
        city: undefined,
      },
    });

    if (lead.assignedToId) {
      await tx.weddingTeamMember.create({
        data: { weddingId: created.id, userId: lead.assignedToId },
      });
    }

    await tx.lead.update({
      where: { id: leadId },
      data: { status: "WON" },
    });

    return created;
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CONVERT",
      entityType: "Lead",
      entityId: leadId,
      after: { weddingId: wedding.id, clientId },
    },
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
  revalidatePath("/weddings");
  redirect(`/weddings/${wedding.id}`);
}
