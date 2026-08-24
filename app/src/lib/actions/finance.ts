"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditSnapshot } from "@/lib/audit";
import { CLIENT_PAYMENT_STATUSES, VENDOR_PAYMENT_STATUSES } from "@/lib/finance-labels";
import { CAN_DELETE, type Role } from "@/lib/roles";
import { computePaymentStatus } from "@/lib/payment-status";

export type ActionState = { error?: string; success?: boolean };

async function requireFinanceAccess() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  const allowed = ["OWNER", "FINANCE", "PLANNER", "VENDOR_MANAGER"];
  if (!allowed.includes(session.user.role)) {
    throw new Error("You do not have permission to manage finances.");
  }
  return session;
}

async function requireOwner() {
  const session = await auth();
  if (!session?.user || !CAN_DELETE.includes(session.user.role as Role)) {
    throw new Error("Only an Owner can delete financial records.");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

const budgetItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  plannedAmount: z.coerce.number().min(0),
  committedAmount: z.coerce.number().min(0),
  actualAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export async function createBudgetItemAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireFinanceAccess();
  const parsed = budgetItemSchema.safeParse({
    category: formData.get("category"),
    plannedAmount: formData.get("plannedAmount") || 0,
    committedAmount: formData.get("committedAmount") || 0,
    actualAmount: formData.get("actualAmount") || 0,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const item = await prisma.budgetItem.create({ data: { weddingId, ...parsed.data } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "BudgetItem",
      entityId: item.id,
      after: auditSnapshot(item),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/budgets");
  return { success: true };
}

export async function updateBudgetItemAction(
  weddingId: string,
  itemId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireFinanceAccess();
  const parsed = budgetItemSchema.safeParse({
    category: formData.get("category"),
    plannedAmount: formData.get("plannedAmount") || 0,
    committedAmount: formData.get("committedAmount") || 0,
    actualAmount: formData.get("actualAmount") || 0,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const previous = await prisma.budgetItem.findUniqueOrThrow({ where: { id: itemId } });
  const item = await prisma.budgetItem.update({ where: { id: itemId }, data: parsed.data });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "BudgetItem",
      entityId: itemId,
      before: auditSnapshot(previous),
      after: auditSnapshot(item),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/budgets");
  return { success: true };
}

export async function deleteBudgetItemAction(weddingId: string, itemId: string) {
  const session = await requireOwner();
  const previous = await prisma.budgetItem.findUniqueOrThrow({ where: { id: itemId } });
  await prisma.budgetItem.delete({ where: { id: itemId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "BudgetItem",
      entityId: itemId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/budgets");
}

// ---------------------------------------------------------------------------
// Client payments
// ---------------------------------------------------------------------------

const clientPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentType: z.string().optional(),
  notes: z.string().optional(),
});

export async function createClientPaymentAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireFinanceAccess();
  const parsed = clientPaymentSchema.safeParse({
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    paymentType: formData.get("paymentType") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const payment = await prisma.clientPayment.create({
    data: {
      weddingId,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      paymentType: data.paymentType,
      notes: data.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "ClientPayment",
      entityId: payment.id,
      after: auditSnapshot(payment),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/client-payments");
  return { success: true };
}

const recordPaymentSchema = z.object({
  paidAmount: z.coerce.number().min(0),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
});

export async function recordClientPaymentAction(
  weddingId: string,
  paymentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireFinanceAccess();
  const parsed = recordPaymentSchema.safeParse({
    paidAmount: formData.get("paidAmount"),
    paymentDate: formData.get("paymentDate") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const payment = await prisma.clientPayment.findUniqueOrThrow({ where: { id: paymentId } });
  const status = computePaymentStatus(Number(payment.amount), data.paidAmount, payment.status);

  const updated = await prisma.clientPayment.update({
    where: { id: paymentId },
    data: {
      paidAmount: data.paidAmount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      status: status as never,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RECORD_PAYMENT",
      entityType: "ClientPayment",
      entityId: paymentId,
      before: auditSnapshot(payment),
      after: auditSnapshot(updated),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/client-payments");
  return { success: true };
}

export async function updateClientPaymentStatusAction(
  weddingId: string,
  paymentId: string,
  status: string
) {
  const session = await requireFinanceAccess();
  if (!CLIENT_PAYMENT_STATUSES.includes(status as never)) throw new Error("Invalid status");
  const previous = await prisma.clientPayment.findUniqueOrThrow({ where: { id: paymentId } });
  await prisma.clientPayment.update({
    where: { id: paymentId },
    data: { status: status as never },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "ClientPayment",
      entityId: paymentId,
      before: { status: previous.status },
      after: { status },
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/client-payments");
}

export async function deleteClientPaymentAction(weddingId: string, paymentId: string) {
  const session = await requireOwner();
  const previous = await prisma.clientPayment.findUniqueOrThrow({ where: { id: paymentId } });
  await prisma.clientPayment.delete({ where: { id: paymentId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "ClientPayment",
      entityId: paymentId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/client-payments");
}

// ---------------------------------------------------------------------------
// Vendor payments
// ---------------------------------------------------------------------------

const vendorPaymentSchema = z.object({
  vendorBookingId: z.string().min(1, "Vendor booking is required"),
  amount: z.coerce.number().positive("Amount is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

export async function createVendorPaymentAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireFinanceAccess();
  const parsed = vendorPaymentSchema.safeParse({
    vendorBookingId: formData.get("vendorBookingId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const payment = await prisma.vendorPayment.create({
    data: {
      weddingId,
      vendorBookingId: data.vendorBookingId,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      notes: data.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "VendorPayment",
      entityId: payment.id,
      after: auditSnapshot(payment),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/vendor-payments");
  return { success: true };
}

export async function recordVendorPaymentAction(
  weddingId: string,
  paymentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireFinanceAccess();
  const parsed = recordPaymentSchema.safeParse({
    paidAmount: formData.get("paidAmount"),
    paymentDate: formData.get("paymentDate") || undefined,
    paymentMethod: formData.get("paymentMethod") || undefined,
    reference: formData.get("reference") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const payment = await prisma.vendorPayment.findUniqueOrThrow({ where: { id: paymentId } });
  const status = computePaymentStatus(Number(payment.amount), data.paidAmount, payment.status);

  const updated = await prisma.vendorPayment.update({
    where: { id: paymentId },
    data: {
      paidAmount: data.paidAmount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      status: status as never,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RECORD_PAYMENT",
      entityType: "VendorPayment",
      entityId: paymentId,
      before: auditSnapshot(payment),
      after: auditSnapshot(updated),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/vendor-payments");
  return { success: true };
}

export async function updateVendorPaymentStatusAction(
  weddingId: string,
  paymentId: string,
  status: string
) {
  const session = await requireFinanceAccess();
  if (!VENDOR_PAYMENT_STATUSES.includes(status as never)) throw new Error("Invalid status");
  const previous = await prisma.vendorPayment.findUniqueOrThrow({ where: { id: paymentId } });
  await prisma.vendorPayment.update({
    where: { id: paymentId },
    data: { status: status as never },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "VendorPayment",
      entityId: paymentId,
      before: { status: previous.status },
      after: { status },
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/vendor-payments");
}

export async function deleteVendorPaymentAction(weddingId: string, paymentId: string) {
  const session = await requireOwner();
  const previous = await prisma.vendorPayment.findUniqueOrThrow({ where: { id: paymentId } });
  await prisma.vendorPayment.delete({ where: { id: paymentId } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "VendorPayment",
      entityId: paymentId,
      before: auditSnapshot(previous),
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  revalidatePath("/finance/vendor-payments");
}
