import {
  LayoutDashboard,
  Handshake,
  Heart,
  Users,
  Store,
  ClipboardList,
  UserPlus,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  sales: Handshake,
  weddings: Heart,
  clients: Users,
  vendors: Store,
  tasks: ClipboardList,
  guests: UserPlus,
  finance: Wallet,
  documents: FileText,
  reports: BarChart3,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type NavIconKey = keyof typeof NAV_ICONS;
