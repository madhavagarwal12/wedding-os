import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import type { NotificationType } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const VENDOR_BOOKING_LEAD_DAYS = 7;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("x-cron-secret");
  const query = new URL(request.url).searchParams.get("secret");
  return header === secret || query === secret;
}

type PendingNotification = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
};

/**
 * The cron endpoint can be called more than once a day, so a notification is
 * only created when the same user does not already have one with the same
 * type and link created since midnight.
 */
async function createIfNew(pending: PendingNotification) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: pending.userId,
      type: pending.type,
      link: pending.link,
      createdAt: { gte: startOfToday() },
    },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.notification.create({ data: pending });
  return true;
}

async function followUpNotifications(): Promise<PendingNotification[]> {
  const leads = await prisma.lead.findMany({
    where: {
      archivedAt: null,
      status: { notIn: ["WON", "LOST"] },
      assignedToId: { not: null },
      nextFollowUpDate: { not: null, lte: endOfToday() },
    },
    select: {
      id: true,
      leadName: true,
      assignedToId: true,
      nextFollowUpDate: true,
    },
  });

  return leads.map((lead) => ({
    userId: lead.assignedToId!,
    type: "FOLLOW_UP" as NotificationType,
    title: `Follow-up due: ${lead.leadName}`,
    message: `Follow-up was scheduled for ${formatDate(lead.nextFollowUpDate)}.`,
    link: `/leads/${lead.id}`,
  }));
}

async function paymentNotifications(): Promise<PendingNotification[]> {
  const [financeUsers, clientPayments, vendorPayments] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["OWNER", "FINANCE"] } },
      select: { id: true },
    }),
    prisma.clientPayment.findMany({
      where: {
        dueDate: { lte: endOfToday() },
        status: { notIn: ["PAID", "CANCELLED"] },
      },
      include: { wedding: { select: { id: true, name: true } } },
    }),
    prisma.vendorPayment.findMany({
      where: {
        dueDate: { lte: endOfToday() },
        status: { notIn: ["PAID", "CANCELLED"] },
      },
      include: {
        wedding: { select: { id: true, name: true } },
        vendorBooking: { include: { vendor: { select: { name: true } } } },
      },
    }),
  ]);

  const pending: PendingNotification[] = [];

  for (const payment of clientPayments) {
    for (const user of financeUsers) {
      pending.push({
        userId: user.id,
        type: "PAYMENT",
        title: `Client payment due: ${payment.wedding.name}`,
        message: `Due ${formatDate(payment.dueDate)}.`,
        link: `/weddings/${payment.wedding.id}`,
      });
    }
  }

  for (const payment of vendorPayments) {
    for (const user of financeUsers) {
      pending.push({
        userId: user.id,
        type: "PAYMENT",
        title: `Vendor payment due: ${payment.vendorBooking.vendor.name}`,
        message: `${payment.wedding.name} · due ${formatDate(payment.dueDate)}.`,
        link: `/weddings/${payment.wedding.id}`,
      });
    }
  }

  return pending;
}

async function vendorBookingNotifications(): Promise<PendingNotification[]> {
  const horizon = new Date(endOfToday());
  horizon.setDate(horizon.getDate() + VENDOR_BOOKING_LEAD_DAYS);

  const [managers, bookings] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["OWNER", "VENDOR_MANAGER"] } },
      select: { id: true },
    }),
    prisma.vendorBooking.findMany({
      where: {
        bookingDate: { not: null, lte: horizon },
        status: { in: ["PLANNED", "CONTACTED", "QUOTATION_RECEIVED", "NEGOTIATION"] },
      },
      include: {
        vendor: { select: { name: true } },
        wedding: { select: { id: true, name: true, projectManagerId: true } },
      },
    }),
  ]);

  const pending: PendingNotification[] = [];

  for (const booking of bookings) {
    const recipients = new Set(managers.map((user) => user.id));
    if (booking.wedding.projectManagerId) {
      recipients.add(booking.wedding.projectManagerId);
    }
    for (const userId of recipients) {
      pending.push({
        userId,
        type: "VENDOR",
        title: `Vendor booking not confirmed: ${booking.vendor.name}`,
        message: `${booking.wedding.name} · booking date ${formatDate(booking.bookingDate)}.`,
        link: `/weddings/${booking.wedding.id}`,
      });
    }
  }

  return pending;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [followUps, payments, vendorBookings] = await Promise.all([
    followUpNotifications(),
    paymentNotifications(),
    vendorBookingNotifications(),
  ]);

  let created = 0;
  for (const pending of [...followUps, ...payments, ...vendorBookings]) {
    if (await createIfNew(pending)) created += 1;
  }

  return NextResponse.json({
    status: "ok",
    candidates: followUps.length + payments.length + vendorBookings.length,
    created,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
