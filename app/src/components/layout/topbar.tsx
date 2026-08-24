import Link from "next/link";
import { Bell, HeartHandshake, Search } from "lucide-react";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type Role } from "@/lib/roles";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function Topbar() {
  const session = await auth();
  const user = session?.user;
  const unreadCount = user
    ? await prisma.notification.count({ where: { userId: user.id, isRead: false } })
    : 0;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-surface px-4 shadow-sm md:px-8">
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <HeartHandshake className="size-4 text-primary-foreground" />
        </div>
        <span className="font-heading text-lg font-semibold text-primary">Wedding Ops</span>
      </Link>

      <form
        action="/search"
        className="relative hidden w-full max-w-[320px] sm:block"
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-outline" />
        <input
          type="search"
          name="q"
          placeholder="Search events, clients, or tasks..."
          className="w-full rounded-lg border-none bg-muted py-2 pr-4 pl-10 text-sm text-foreground placeholder:text-outline-variant focus:ring-2 focus:ring-primary focus:outline-none"
        />
      </form>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="flex items-center gap-1">
          {user && (
            <Link
              href="/notifications"
              className="relative flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container-high hover:text-primary"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex size-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border-l border-border/60 pl-3 md:pl-4">
              <div className="hidden text-right md:block">
                <p className="text-sm leading-tight font-medium text-foreground">{user.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {ROLE_LABELS[user.role as Role]}
                </p>
              </div>
              <Avatar className="size-9 border-2 border-surface-container-high">
                <AvatarFallback className="bg-primary-container text-on-primary-container">
                  {initials(user.name ?? user.email ?? "U")}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings/profile" />}>
                Profile &amp; password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <DropdownMenuItem
                  nativeButton
                  render={<button type="submit" className="w-full text-left" />}
                >
                  Sign out
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
