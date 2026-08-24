import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { navItemsForRole } from "@/lib/nav";
import type { Role } from "@/generated/prisma/enums";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const items = navItemsForRole(session.user.role as Role);

  return (
    <div className="flex min-h-screen w-full bg-surface">
      <Sidebar items={items} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>
      <MobileNav items={items} />
    </div>
  );
}
