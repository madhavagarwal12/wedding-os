import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv, type CsvColumn } from "@/lib/csv";
import { CAN_VIEW_FINANCE, type Role } from "@/lib/roles";
import { LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { WEDDING_STATUS_LABELS } from "@/lib/wedding-status";
import { PAYMENT_STATUS_LABELS } from "@/lib/finance-labels";
import { VENDOR_CATEGORY_LABELS } from "@/lib/vendor-labels";

export const dynamic = "force-dynamic";

type Dataset = {
  columns: CsvColumn[];
  financeOnly?: boolean;
  load: () => Promise<Record<string, unknown>[]>;
};

function isoDate(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

const DATASETS: Record<string, Dataset> = {
  leads: {
    columns: [
      { key: "leadName", label: "Lead" },
      { key: "primaryContact", label: "Primary Contact" },
      { key: "phone", label: "Phone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "source", label: "Source" },
      { key: "eventDate", label: "Event Date" },
      { key: "location", label: "Location" },
      { key: "estimatedGuestCount", label: "Estimated Guests" },
      { key: "estimatedBudget", label: "Estimated Budget" },
      { key: "assignedTo", label: "Assigned To" },
      { key: "nextFollowUpDate", label: "Next Follow-up" },
      { key: "createdAt", label: "Created" },
    ],
    load: async () => {
      const leads = await prisma.lead.findMany({
        where: { archivedAt: null },
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      return leads.map((lead) => ({
        leadName: lead.leadName,
        primaryContact: lead.primaryContact,
        phone: lead.phone,
        whatsapp: lead.whatsapp ?? "",
        email: lead.email ?? "",
        status: LEAD_STATUS_LABELS[lead.status],
        source: lead.source ?? "",
        eventDate: isoDate(lead.eventDate),
        location: lead.location ?? "",
        estimatedGuestCount: lead.estimatedGuestCount ?? "",
        estimatedBudget: lead.estimatedBudget ? lead.estimatedBudget.toString() : "",
        assignedTo: lead.assignedTo?.name ?? "",
        nextFollowUpDate: isoDate(lead.nextFollowUpDate),
        createdAt: isoDate(lead.createdAt),
      }));
    },
  },
  weddings: {
    columns: [
      { key: "name", label: "Wedding" },
      { key: "client", label: "Client" },
      { key: "status", label: "Status" },
      { key: "startDate", label: "Start Date" },
      { key: "endDate", label: "End Date" },
      { key: "city", label: "City" },
      { key: "primaryVenue", label: "Primary Venue" },
      { key: "estimatedGuestCount", label: "Estimated Guests" },
      { key: "projectValue", label: "Project Value" },
      { key: "projectManager", label: "Project Manager" },
    ],
    load: async () => {
      const weddings = await prisma.wedding.findMany({
        where: { archivedAt: null },
        include: {
          client: { select: { name: true } },
          projectManager: { select: { name: true } },
        },
        orderBy: { startDate: "desc" },
      });
      return weddings.map((wedding) => ({
        name: wedding.name,
        client: wedding.client.name,
        status: WEDDING_STATUS_LABELS[wedding.status],
        startDate: isoDate(wedding.startDate),
        endDate: isoDate(wedding.endDate),
        city: wedding.city ?? "",
        primaryVenue: wedding.primaryVenue ?? "",
        estimatedGuestCount: wedding.estimatedGuestCount ?? "",
        projectValue: wedding.projectValue.toString(),
        projectManager: wedding.projectManager?.name ?? "",
      }));
    },
  },
  vendors: {
    columns: [
      { key: "name", label: "Vendor" },
      { key: "businessName", label: "Business Name" },
      { key: "category", label: "Category" },
      { key: "contactPerson", label: "Contact Person" },
      { key: "phone", label: "Phone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "email", label: "Email" },
      { key: "city", label: "City" },
      { key: "rating", label: "Rating" },
      { key: "status", label: "Status" },
      { key: "bookings", label: "Bookings" },
      { key: "businessValue", label: "Total Business Value" },
    ],
    load: async () => {
      const vendors = await prisma.vendor.findMany({
        include: { bookings: { select: { agreedAmount: true } } },
        orderBy: { name: "asc" },
      });
      return vendors.map((vendor) => ({
        name: vendor.name,
        businessName: vendor.businessName ?? "",
        category: VENDOR_CATEGORY_LABELS[vendor.category],
        contactPerson: vendor.contactPerson ?? "",
        phone: vendor.phone,
        whatsapp: vendor.whatsapp ?? "",
        email: vendor.email ?? "",
        city: vendor.city ?? "",
        rating: vendor.rating ?? "",
        status: vendor.status === "ACTIVE" ? "Active" : "Inactive",
        bookings: vendor.bookings.length,
        businessValue: vendor.bookings
          .reduce((sum, booking) => sum + Number(booking.agreedAmount), 0)
          .toString(),
      }));
    },
  },
  "client-payments": {
    financeOnly: true,
    columns: [
      { key: "wedding", label: "Wedding" },
      { key: "client", label: "Client" },
      { key: "paymentType", label: "Payment Type" },
      { key: "amount", label: "Amount" },
      { key: "paidAmount", label: "Paid Amount" },
      { key: "outstanding", label: "Outstanding" },
      { key: "dueDate", label: "Due Date" },
      { key: "status", label: "Status" },
      { key: "paymentDate", label: "Payment Date" },
      { key: "paymentMethod", label: "Payment Method" },
      { key: "reference", label: "Reference" },
    ],
    load: async () => {
      const payments = await prisma.clientPayment.findMany({
        include: { wedding: { include: { client: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
      });
      return payments.map((payment) => ({
        wedding: payment.wedding.name,
        client: payment.wedding.client.name,
        paymentType: payment.paymentType ?? "",
        amount: payment.amount.toString(),
        paidAmount: payment.paidAmount.toString(),
        outstanding: (Number(payment.amount) - Number(payment.paidAmount)).toString(),
        dueDate: isoDate(payment.dueDate),
        status: PAYMENT_STATUS_LABELS[payment.status],
        paymentDate: isoDate(payment.paymentDate),
        paymentMethod: payment.paymentMethod ?? "",
        reference: payment.reference ?? "",
      }));
    },
  },
  "vendor-payments": {
    financeOnly: true,
    columns: [
      { key: "wedding", label: "Wedding" },
      { key: "vendor", label: "Vendor" },
      { key: "service", label: "Service" },
      { key: "amount", label: "Amount" },
      { key: "paidAmount", label: "Paid Amount" },
      { key: "outstanding", label: "Outstanding" },
      { key: "dueDate", label: "Due Date" },
      { key: "status", label: "Status" },
      { key: "paymentDate", label: "Payment Date" },
      { key: "paymentMethod", label: "Payment Method" },
      { key: "reference", label: "Reference" },
    ],
    load: async () => {
      const payments = await prisma.vendorPayment.findMany({
        include: {
          wedding: { select: { name: true } },
          vendorBooking: { include: { vendor: { select: { name: true } } } },
        },
        orderBy: { dueDate: "asc" },
      });
      return payments.map((payment) => ({
        wedding: payment.wedding.name,
        vendor: payment.vendorBooking.vendor.name,
        service: payment.vendorBooking.service ?? "",
        amount: payment.amount.toString(),
        paidAmount: payment.paidAmount.toString(),
        outstanding: (Number(payment.amount) - Number(payment.paidAmount)).toString(),
        dueDate: isoDate(payment.dueDate),
        status: PAYMENT_STATUS_LABELS[payment.status],
        paymentDate: isoDate(payment.paymentDate),
        paymentMethod: payment.paymentMethod ?? "",
        reference: payment.reference ?? "",
      }));
    },
  },
  tasks: {
    columns: [
      { key: "name", label: "Task" },
      { key: "wedding", label: "Wedding" },
      { key: "function", label: "Function" },
      { key: "assignedTo", label: "Assigned To" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "startDate", label: "Start Date" },
      { key: "dueDate", label: "Due Date" },
      { key: "completionDate", label: "Completed" },
    ],
    load: async () => {
      const tasks = await prisma.task.findMany({
        include: {
          wedding: { select: { name: true } },
          function: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return tasks.map((task) => ({
        name: task.name,
        wedding: task.wedding?.name ?? "",
        function: task.function?.name ?? "",
        assignedTo: task.assignedTo?.name ?? "",
        priority: task.priority,
        status: task.status.replaceAll("_", " "),
        startDate: isoDate(task.startDate),
        dueDate: isoDate(task.dueDate),
        completionDate: isoDate(task.completionDate),
      }));
    },
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { dataset } = await params;
  const definition = DATASETS[dataset];
  if (!definition) {
    return new NextResponse("Unknown dataset", { status: 404 });
  }

  if (
    definition.financeOnly &&
    !CAN_VIEW_FINANCE.includes(session.user.role as Role)
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rows = await definition.load();
  const csv = toCsv(rows, definition.columns);
  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(csv, `${dataset}-${stamp}.csv`);
}
