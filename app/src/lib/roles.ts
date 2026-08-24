import { Role } from "@/generated/prisma/enums";

export { Role };

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner / Admin",
  SALES: "Sales",
  PLANNER: "Wedding Planner",
  OPERATIONS: "Operations / Coordinator",
  VENDOR_MANAGER: "Vendor Manager",
  FINANCE: "Finance",
  FIELD_STAFF: "Field Staff",
};

export const ALL_ROLES: Role[] = [
  "OWNER",
  "SALES",
  "PLANNER",
  "OPERATIONS",
  "VENDOR_MANAGER",
  "FINANCE",
  "FIELD_STAFF",
];

/** Roles allowed to permanently delete records (PRD §29). */
export const CAN_DELETE: Role[] = ["OWNER"];

/** Roles allowed to view/manage financial records by default (PRD §29). */
export const CAN_MANAGE_FINANCE: Role[] = ["OWNER", "FINANCE"];

/** Roles allowed to view (not necessarily edit) financial records. Mirrors the Finance nav section and finance action guards. */
export const CAN_VIEW_FINANCE: Role[] = ["OWNER", "FINANCE", "PLANNER", "VENDOR_MANAGER"];

export function roleHomePath(role: Role): string {
  switch (role) {
    case "OWNER":
      return "/dashboard";
    case "SALES":
      return "/dashboard/sales";
    case "PLANNER":
    case "OPERATIONS":
      return "/dashboard/planner";
    case "VENDOR_MANAGER":
      return "/vendors";
    case "FINANCE":
      return "/dashboard/finance";
    case "FIELD_STAFF":
      return "/tasks/mine";
    default:
      return "/dashboard";
  }
}
