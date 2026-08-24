"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { NAV_ICONS } from "./nav-icons";

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-primary shadow-[0px_-4px_20px_rgba(26,60,52,0.15)] md:hidden">
      <div className="flex w-full items-center gap-1 overflow-x-auto px-3 py-2 no-scrollbar">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = NAV_ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-full px-4 py-1.5 transition-transform active:scale-90",
                active
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "text-primary-foreground/55 hover:text-primary-foreground/85"
              )}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 2} />
              <span className="text-[11px] font-medium tracking-wide">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
