import type {
  ClientPaymentStatus,
  VendorPaymentStatus,
} from "@/generated/prisma/enums";

export const CLIENT_PAYMENT_STATUSES: ClientPaymentStatus[] = [
  "UPCOMING",
  "DUE",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
];

export const PAYMENT_STATUS_LABELS: Record<
  ClientPaymentStatus | VendorPaymentStatus,
  string
> = {
  UPCOMING: "Upcoming",
  DUE: "Due",
  PAID: "Paid",
  PARTIALLY_PAID: "Partially Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const VENDOR_PAYMENT_STATUSES: VendorPaymentStatus[] = [
  "UPCOMING",
  "DUE",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
  "CANCELLED",
];

export const DEFAULT_BUDGET_CATEGORIES = [
  "Decor",
  "Photography",
  "Catering",
  "Venue",
  "Entertainment",
  "Transportation",
  "Accommodation",
  "Hospitality",
  "Invitations",
  "Gifts",
  "Miscellaneous",
];
