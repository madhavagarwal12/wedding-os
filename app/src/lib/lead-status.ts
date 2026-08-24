import type { LeadStatus } from "@/generated/prisma/enums";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "REQUIREMENTS_COLLECTED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  MEETING_SCHEDULED: "Meeting Scheduled",
  REQUIREMENTS_COLLECTED: "Requirements Collected",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const OPEN_LEAD_STATUSES: LeadStatus[] = LEAD_STATUSES.filter(
  (s) => s !== "WON" && s !== "LOST"
);
