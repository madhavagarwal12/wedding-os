import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleHomePath } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  redirect(roleHomePath(session.user.role as Role));
}
