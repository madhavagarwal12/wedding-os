import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationForm } from "./organization-form";

export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: session.user.organizationId },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground">
          Company name, contact details and business information.
        </p>
      </div>
      <OrganizationForm organization={organization} />
    </div>
  );
}
