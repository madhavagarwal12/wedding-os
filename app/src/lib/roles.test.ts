import { describe, expect, it } from "vitest";
import { Role } from "@/generated/prisma/enums";
import { ALL_ROLES, CAN_DELETE, CAN_MANAGE_FINANCE, CAN_VIEW_FINANCE, roleHomePath } from "@/lib/roles";

// The full set of Role enum values, read from the generated Prisma enum
// (prisma/schema.prisma `enum Role`) rather than hardcoded, so this test
// fails loudly if the schema grows a new role that isn't accounted for
// below.
const ALL_ROLE_VALUES = Object.values(Role);

describe("ALL_ROLES", () => {
  it("contains exactly the 7 roles defined in the Prisma schema", () => {
    expect(ALL_ROLES.sort()).toEqual([...ALL_ROLE_VALUES].sort());
    expect(ALL_ROLES).toHaveLength(7);
  });
});

describe("CAN_DELETE", () => {
  // doc comment: "Roles allowed to permanently delete records (PRD §29)."
  it("contains only OWNER", () => {
    expect(CAN_DELETE).toEqual(["OWNER"]);
  });

  it("excludes every non-Owner role", () => {
    for (const role of ALL_ROLE_VALUES) {
      if (role === "OWNER") continue;
      expect(CAN_DELETE).not.toContain(role);
    }
  });
});

describe("CAN_MANAGE_FINANCE", () => {
  // doc comment: "Roles allowed to view/manage financial records by default (PRD §29)."
  it("contains OWNER and FINANCE", () => {
    expect(CAN_MANAGE_FINANCE.sort()).toEqual(["FINANCE", "OWNER"]);
  });

  it("excludes SALES, PLANNER, OPERATIONS, VENDOR_MANAGER, FIELD_STAFF", () => {
    for (const role of ["SALES", "PLANNER", "OPERATIONS", "VENDOR_MANAGER", "FIELD_STAFF"] as const) {
      expect(CAN_MANAGE_FINANCE).not.toContain(role);
    }
  });
});

describe("CAN_VIEW_FINANCE", () => {
  // doc comment: mirrors the Finance nav section and finance action guards
  it("contains OWNER, FINANCE, PLANNER, VENDOR_MANAGER", () => {
    expect(CAN_VIEW_FINANCE.sort()).toEqual(["FINANCE", "OWNER", "PLANNER", "VENDOR_MANAGER"].sort());
  });

  it("excludes SALES, OPERATIONS, FIELD_STAFF", () => {
    for (const role of ["SALES", "OPERATIONS", "FIELD_STAFF"] as const) {
      expect(CAN_VIEW_FINANCE).not.toContain(role);
    }
  });

  it("is a superset of CAN_MANAGE_FINANCE", () => {
    for (const role of CAN_MANAGE_FINANCE) {
      expect(CAN_VIEW_FINANCE).toContain(role);
    }
  });
});

describe("roleHomePath", () => {
  it("returns the correct path for every Role enum value", () => {
    const expected: Record<Role, string> = {
      OWNER: "/dashboard",
      SALES: "/dashboard/sales",
      PLANNER: "/dashboard/planner",
      OPERATIONS: "/dashboard/planner",
      VENDOR_MANAGER: "/vendors",
      FINANCE: "/dashboard/finance",
      FIELD_STAFF: "/tasks/mine",
    };

    for (const role of ALL_ROLE_VALUES) {
      expect(roleHomePath(role)).toBe(expected[role]);
    }
  });
});
