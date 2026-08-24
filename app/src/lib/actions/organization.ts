"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const orgSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  currency: z.string().min(1),
});

export type OrgFormState = { error?: string; success?: boolean };

export async function updateOrganizationAction(
  _prevState: OrgFormState,
  formData: FormData
): Promise<OrgFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return { error: "You do not have permission to do this." };
  }

  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    currency: formData.get("currency") || "INR",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Organization",
      entityId: session.user.organizationId,
      after: parsed.data,
    },
  });

  revalidatePath("/settings/organization");
  return { success: true };
}
