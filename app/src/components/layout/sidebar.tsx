import Link from "next/link";
import { Plus, HeartHandshake, HelpCircle, LogOut } from "lucide-react";
import { signOut } from "@/auth";
import type { NavItem } from "@/lib/nav";
import { NavLinks } from "./nav-links";

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-6 md:flex">
      <div className="mb-8 flex items-center gap-3 px-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary">
          <HeartHandshake className="size-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-base font-bold tracking-tight text-primary">
            Wedding Ops
          </h1>
          <p className="truncate text-xs text-sidebar-foreground/70">Premium Planner</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 no-scrollbar">
        <NavLinks items={items} />
      </nav>
      <div className="mt-6 flex flex-col gap-4 px-6">
        <Link
          href="/weddings"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="size-[18px]" />
          New Event
        </Link>
        <div className="flex flex-col gap-1 border-t border-sidebar-border/70 pt-4">
          <Link
            href="/settings/organization"
            className="flex items-center gap-3 rounded-md py-2 text-sm text-sidebar-foreground/80 transition-colors hover:text-primary"
          >
            <HelpCircle className="size-[18px]" />
            Support
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md py-2 text-left text-sm text-sidebar-foreground/80 transition-colors hover:text-primary"
            >
              <LogOut className="size-[18px]" />
              Log Out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
