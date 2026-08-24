import type {
  CommunicationChannel,
  MeetingType,
  ProposalStatus,
} from "@/generated/prisma/enums";

export const MEETING_TYPES: MeetingType[] = [
  "DISCOVERY",
  "REQUIREMENTS",
  "PROPOSAL",
  "NEGOTIATION",
  "PLANNING",
  "SITE_VISIT",
  "OTHER",
];

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  DISCOVERY: "Discovery",
  REQUIREMENTS: "Requirements",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  PLANNING: "Planning",
  SITE_VISIT: "Site Visit",
  OTHER: "Other",
};

export const COMMUNICATION_CHANNELS: CommunicationChannel[] = [
  "WHATSAPP",
  "PHONE",
  "EMAIL",
  "IN_PERSON",
  "OTHER",
];

export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Phone",
  EMAIL: "Email",
  IN_PERSON: "In Person",
  OTHER: "Other",
};

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  "DRAFT",
  "SENT",
  "UNDER_REVIEW",
  "NEGOTIATION",
  "ACCEPTED",
  "REJECTED",
];

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  UNDER_REVIEW: "Under Review",
  NEGOTIATION: "Negotiation",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};
