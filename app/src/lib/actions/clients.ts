"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string; success?: boolean };

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  familyInfo: z.string().optional(),
  notes: z.string().optional(),
});

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    familyInfo: formData.get("familyInfo") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createClientAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.client.create({
    data: { ...parsed.data, email: parsed.data.email || undefined },
  });

  revalidatePath("/clients");
  return { success: true };
}

export async function updateClientAction(
  clientId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const parsed = parseClientForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
