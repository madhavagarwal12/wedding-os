import type { VendorCategory, VendorBookingStatus } from "@/generated/prisma/enums";

export const VENDOR_CATEGORIES: VendorCategory[] = [
  "VENUE",
  "DECORATOR",
  "CATERER",
  "PHOTOGRAPHER",
  "VIDEOGRAPHER",
  "MAKEUP_ARTIST",
  "MEHENDI_ARTIST",
  "DJ",
  "BAND",
  "ARTIST_ENTERTAINMENT",
  "FLORIST",
  "LIGHTING",
  "SOUND",
  "FURNITURE",
  "TRANSPORTATION",
  "HOSPITALITY",
  "INVITATION_PRINTING",
  "GIFTS",
  "SECURITY",
  "OTHER",
];

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  VENUE: "Venue",
  DECORATOR: "Decorator",
  CATERER: "Caterer",
  PHOTOGRAPHER: "Photographer",
  VIDEOGRAPHER: "Videographer",
  MAKEUP_ARTIST: "Makeup Artist",
  MEHENDI_ARTIST: "Mehendi Artist",
  DJ: "DJ",
  BAND: "Band",
  ARTIST_ENTERTAINMENT: "Artist / Entertainment",
  FLORIST: "Florist",
  LIGHTING: "Lighting",
  SOUND: "Sound",
  FURNITURE: "Furniture",
  TRANSPORTATION: "Transportation",
  HOSPITALITY: "Hospitality",
  INVITATION_PRINTING: "Invitation / Printing",
  GIFTS: "Gifts",
  SECURITY: "Security",
  OTHER: "Other",
};

export const VENDOR_BOOKING_STATUSES: VendorBookingStatus[] = [
  "PLANNED",
  "CONTACTED",
  "QUOTATION_RECEIVED",
  "NEGOTIATION",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const VENDOR_BOOKING_STATUS_LABELS: Record<VendorBookingStatus, string> = {
  PLANNED: "Planned",
  CONTACTED: "Contacted",
  QUOTATION_RECEIVED: "Quotation Received",
  NEGOTIATION: "Negotiation",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
