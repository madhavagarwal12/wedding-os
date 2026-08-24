"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ALL_ROLES } from "@/lib/roles";

export type UserFormState = { error?: string; success?: boolean };

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

async function requireOwner() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return null;
  }
  return session;
}

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await requireOwner();
  if (!session) return { error: "You do not have permission to do this." };

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, phone, role, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      role: role as never,
      passwordHash,
      organizationId: session.user.organizationId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      after: { name, email, role },
    },
  });

  revalidatePath("/settings/users");
  return { success: true };
}

const TEMP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generateTemporaryPassword(length = 14) {
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length];
  }
  return password;
}

export async function resetUserPasswordAction(
  userId: string
): Promise<{ error?: string; temporaryPassword?: string }> {
  const session = await requireOwner();
  if (!session) return { error: "You do not have permission to do this." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RESET_PASSWORD",
      entityType: "User",
      entityId: userId,
      after: { email: user.email },
    },
  });

  revalidatePath("/settings/users");
  return { temporaryPassword };
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export async function changeOwnPasswordAction(
  _prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found." };

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CHANGE_PASSWORD",
      entityType: "User",
      entityId: user.id,
    },
  });

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string) {
  const session = await requireOwner();
  if (!session) throw new Error("Forbidden");
  if (userId === session.user.id) {
    throw new Error("You cannot deactivate your own account.");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
      entityType: "User",
      entityId: userId,
    },
  });

  revalidatePath("/settings/users");
}
