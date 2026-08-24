"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { NAV_ICONS } from "./nav-icons";

export function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = NAV_ICONS[item.icon];
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
              <span className="truncate">{item.label}</span>
            </Link>
            {item.children && active && (
              <div className="mt-1 ml-[34px] flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                {item.children.map((child) => {
                  const childActive = pathname === child.href;
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-sm transition-colors",
                        childActive
                          ? "font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
