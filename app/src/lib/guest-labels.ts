import type { RsvpStatus } from "@/generated/prisma/enums";

export const RSVP_STATUSES: RsvpStatus[] = [
  "PENDING",
  "INVITED",
  "CONFIRMED",
  "DECLINED",
  "MAYBE",
];

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  PENDING: "Pending",
  INVITED: "Invited",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  MAYBE: "Maybe",
};
