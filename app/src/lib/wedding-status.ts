import type { WeddingStatus, TaskStatus, TaskPriority } from "@/generated/prisma/enums";

export const WEDDING_STATUSES: WeddingStatus[] = [
  "PLANNING",
  "VENDOR_BOOKING",
  "PRE_EVENT",
  "EVENT_IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
];

export const WEDDING_STATUS_LABELS: Record<WeddingStatus, string> = {
  PLANNING: "Planning",
  VENDOR_BOOKING: "Vendor Booking",
  PRE_EVENT: "Pre-Event",
  EVENT_IN_PROGRESS: "Event in Progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const TASK_STATUSES: TaskStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};
