"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VENDOR_CATEGORIES, VENDOR_BOOKING_STATUSES } from "@/lib/vendor-labels";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  businessName: z.string().optional(),
  category: z.enum(VENDOR_CATEGORIES as [string, ...string[]]),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  serviceDescription: z.string().optional(),
  pricingNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().or(z.nan().transform(() => undefined)),
});

function parseVendorForm(formData: FormData) {
  return vendorSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName") || undefined,
    category: formData.get("category"),
    contactPerson: formData.get("contactPerson") || undefined,
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    serviceDescription: formData.get("serviceDescription") || undefined,
    pricingNotes: formData.get("pricingNotes") || undefined,
    internalNotes: formData.get("internalNotes") || undefined,
    rating: formData.get("rating") || undefined,
  });
}

export async function createVendorAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseVendorForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.vendor.create({
    data: {
      ...data,
      category: data.category as never,
      email: data.email || undefined,
    },
  });

  revalidatePath("/vendors");
  return { success: true };
}

export async function updateVendorAction(
  vendorId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = parseVendorForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      ...data,
      category: data.category as never,
      email: data.email || null,
      rating: data.rating ?? null,
    },
  });

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}

export async function toggleVendorStatusAction(vendorId: string) {
  await requireUser();
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } });
  await prisma.vendor.update({
    where: { id: vendorId },
    data: { status: vendor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${vendorId}`);
}

const bookingSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  functionId: z.string().optional(),
  service: z.string().optional(),
  agreedAmount: z.coerce.number().min(0, "Agreed amount is required"),
  advanceAmount: z.coerce.number().min(0).optional().or(z.nan().transform(() => undefined)),
  bookingDate: z.string().optional(),
  deliverables: z.string().optional(),
  notes: z.string().optional(),
});

export async function createVendorBookingAction(
  weddingId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();
  const parsed = bookingSchema.safeParse({
    vendorId: formData.get("vendorId"),
    functionId: formData.get("functionId") || undefined,
    service: formData.get("service") || undefined,
    agreedAmount: formData.get("agreedAmount"),
    advanceAmount: formData.get("advanceAmount") || undefined,
    bookingDate: formData.get("bookingDate") || undefined,
    deliverables: formData.get("deliverables") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.vendorBooking.create({
    data: {
      weddingId,
      vendorId: data.vendorId,
      functionId: data.functionId || undefined,
      service: data.service,
      agreedAmount: data.agreedAmount,
      advanceAmount: data.advanceAmount,
      bookingDate: data.bookingDate ? new Date(data.bookingDate) : undefined,
      deliverables: data.deliverables,
      notes: data.notes,
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
  return { success: true };
}

export async function updateVendorBookingStatusAction(
  weddingId: string,
  bookingId: string,
  status: string
) {
  const session = await requireUser();
  if (!VENDOR_BOOKING_STATUSES.includes(status as never)) throw new Error("Invalid status");
  const previous = await prisma.vendorBooking.findUniqueOrThrow({ where: { id: bookingId } });
  await prisma.vendorBooking.update({
    where: { id: bookingId },
    data: { status: status as never },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "VendorBooking",
      entityId: bookingId,
      before: { status: previous.status },
      after: { status },
    },
  });

  revalidatePath(`/weddings/${weddingId}`);
}

export async function deleteVendorBookingAction(weddingId: string, bookingId: string) {
  const session = await requireUser();
  if (session.user.role !== "OWNER" && session.user.role !== "VENDOR_MANAGER") {
    throw new Error("You do not have permission to remove this booking.");
  }
  await prisma.vendorBooking.delete({ where: { id: bookingId } });
  revalidatePath(`/weddings/${weddingId}`);
}
