import Link from "next/link";
import { CalendarDays, User, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { WEDDING_STATUS_LABELS } from "@/lib/wedding-status";
import { Pagination, PAGE_SIZE, pageFromSearchParams } from "@/components/pagination";
import { CreateWeddingDialog } from "./create-wedding-dialog";
import type { WeddingStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASS: Record<WeddingStatus, string> = {
  PLANNING: "bg-secondary-container text-on-secondary-container",
  VENDOR_BOOKING: "bg-secondary-container text-on-secondary-container",
  PRE_EVENT: "bg-tertiary-container text-on-tertiary-container",
  EVENT_IN_PROGRESS: "bg-primary text-primary-foreground",
  COMPLETED: "bg-primary text-primary-foreground",
  CLOSED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export default async function WeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const page = pageFromSearchParams((await searchParams).page);
  const where = { archivedAt: null };
  const [weddings, total, clients, users] = await Promise.all([
    prisma.wedding.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: { client: true, projectManager: true },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.wedding.count({ where }),
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Weddings</h1>
          <p className="text-sm text-muted-foreground">
            Every wedding project the company is managing.
          </p>
        </div>
        <CreateWeddingDialog clients={clients} users={users} />
      </div>

      {weddings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No weddings yet. Convert a lead or create one directly.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((wedding) => (
            <Link
              key={wedding.id}
              href={`/weddings/${wedding.id}`}
              className="group flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 ambient-shadow transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-base font-semibold group-hover:text-primary">
                    {wedding.name}
                  </h3>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{wedding.client.name}</p>
                </div>
                <Badge className={cn("shrink-0 rounded-full px-3 py-1 text-[10px] tracking-wider uppercase", STATUS_BADGE_CLASS[wedding.status])}>
                  {WEDDING_STATUS_LABELS[wedding.status]}
                </Badge>
              </div>

              <div className="flex flex-col gap-2 border-t border-border/40 pt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-outline" />
                  {formatDate(wedding.startDate)}
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-outline" />
                  {wedding.projectManager?.name ?? "Unassigned"}
                </div>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Wallet className="size-4 text-outline" />
                  {formatCurrency(wedding.projectValue)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination basePath="/weddings" page={page} total={total} />
    </div>
  );
}
