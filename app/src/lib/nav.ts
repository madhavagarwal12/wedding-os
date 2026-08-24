import type { Role } from "@/generated/prisma/enums";
import type { NavIconKey } from "@/components/layout/nav-icons";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconKey;
  roles?: Role[]; // undefined = visible to all roles
  children?: { label: string; href: string; roles?: Role[] }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  {
    label: "Sales",
    href: "/leads",
    icon: "sales",
    roles: ["OWNER", "SALES"],
    children: [
      { label: "Leads", href: "/leads" },
      { label: "Pipeline", href: "/leads/pipeline" },
      { label: "Follow-ups", href: "/leads/follow-ups" },
    ],
  },
  {
    label: "Weddings",
    href: "/weddings",
    icon: "weddings",
    children: [
      { label: "All Weddings", href: "/weddings" },
      { label: "Upcoming", href: "/weddings/upcoming" },
      { label: "Calendar", href: "/calendar" },
    ],
  },
  { label: "Clients", href: "/clients", icon: "clients" },
  { label: "Vendors", href: "/vendors", icon: "vendors" },
  {
    label: "Tasks",
    href: "/tasks/mine",
    icon: "tasks",
    children: [
      { label: "My Tasks", href: "/tasks/mine" },
      { label: "Team Tasks", href: "/tasks" },
      { label: "Calendar", href: "/calendar" },
    ],
  },
  { label: "Guests", href: "/guests", icon: "guests" },
  {
    label: "Finance",
    href: "/finance/client-payments",
    icon: "finance",
    roles: ["OWNER", "FINANCE", "PLANNER", "VENDOR_MANAGER"],
    children: [
      { label: "Client Payments", href: "/finance/client-payments" },
      { label: "Vendor Payments", href: "/finance/vendor-payments" },
      { label: "Budgets", href: "/finance/budgets" },
    ],
  },
  { label: "Documents", href: "/documents", icon: "documents" },
  {
    label: "Reports",
    href: "/reports",
    icon: "reports",
    roles: ["OWNER", "SALES", "FINANCE", "PLANNER", "VENDOR_MANAGER"],
  },
  {
    label: "Settings",
    href: "/settings/organization",
    icon: "settings",
    roles: ["OWNER"],
    children: [
      { label: "Organization", href: "/settings/organization" },
      { label: "Users", href: "/settings/users" },
      { label: "Profile", href: "/settings/profile" },
      { label: "Audit Log", href: "/settings/audit-log", roles: ["OWNER"] },
    ],
  },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
