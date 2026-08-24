import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
  CalendarClock,
  UserPlus2,
  AlarmClockCheck,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Filter,
  Heart,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { WEDDING_STATUS_LABELS } from "@/lib/wedding-status";
import { roleHomePath, type Role } from "@/lib/roles";
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

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default async function OwnerDashboardPage() {
  const session = await auth();
  if (session?.user && session.user.role !== "OWNER") {
    const target = roleHomePath(session.user.role as Role);
    if (target !== "/dashboard") redirect(target);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const chartStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const chartEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1);

  const [
    activeWeddings,
    newWeddingsThisMonth,
    upcomingWeddings,
    newLeads,
    followUpsDue,
    upcomingSchedule,
    chartWeddings,
    clientPaymentAgg,
    vendorPaymentAgg,
  ] = await Promise.all([
    prisma.wedding.count({
      where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
    }),
    prisma.wedding.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.wedding.count({ where: { startDate: { gte: now } } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({
      where: { nextFollowUpDate: { lte: now }, status: { notIn: ["WON", "LOST"] } },
    }),
    prisma.wedding.findMany({
      where: { startDate: { gte: now }, status: { notIn: ["CLOSED", "CANCELLED"] } },
      orderBy: { startDate: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        startDate: true,
        primaryVenue: true,
        projectValue: true,
        status: true,
      },
    }),
    prisma.wedding.findMany({
      where: { startDate: { gte: chartStart, lt: chartEnd } },
      select: { startDate: true },
    }),
    prisma.clientPayment.aggregate({ _sum: { amount: true, paidAmount: true } }),
    prisma.vendorPayment.aggregate({ _sum: { paidAmount: true } }),
  ]);

  const months: { key: string; label: string; count: number; isCurrent: boolean }[] = [];
  for (let i = -3; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString("en-US", { month: "short" }),
      count: 0,
      isCurrent: i === 0,
    });
  }
  for (const w of chartWeddings) {
    const key = monthKey(w.startDate);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.count += 1;
  }
  const maxCount = Math.max(1, ...months.map((m) => m.count));

  const totalBillable = Number(clientPaymentAgg._sum.amount ?? 0);
  const totalCollected = Number(clientPaymentAgg._sum.paidAmount ?? 0);
  const collectionPct = totalBillable > 0 ? Math.round((totalCollected / totalBillable) * 100) : 0;
  const vendorOutflows = Number(vendorPaymentAgg._sum.paidAmount ?? 0);

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - collectionPct / 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[32px]">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Here is what&apos;s happening across your events today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          tone="primary"
          label="Active Weddings"
          value={activeWeddings}
          icon={Sparkles}
          hint={`+${newWeddingsThisMonth} new this month`}
        />
        <Link href="/weddings/upcoming">
          <StatCard
            label="Upcoming Schedule"
            value={upcomingWeddings}
            icon={CalendarClock}
            hint="Next 30 days"
          />
        </Link>
        <Link href="/leads">
          <StatCard label="New Leads" value={newLeads} icon={UserPlus2} hint="Pending review" />
        </Link>
        <Link href="/leads/follow-ups">
          <StatCard
            label="Follow-ups Due"
            value={followUpsDue}
            icon={AlarmClockCheck}
            hint="Require attention"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col rounded-xl border border-border/60 bg-card ambient-shadow lg:col-span-8">
          <div className="flex items-center justify-between border-b border-border/40 p-5">
            <h3 className="font-heading text-lg font-semibold">Wedding Analytics</h3>
            <Link
              href="/reports"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              View Report
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="flex min-h-[260px] flex-1 items-end gap-3 p-5 pt-10 md:gap-4">
            {months.map((m) => (
              <div key={m.key} className="group flex h-full w-full flex-col items-end gap-2">
                <div
                  className={cn(
                    "relative w-full rounded-t-sm transition-colors",
                    m.isCurrent ? "bg-primary" : "bg-secondary-container group-hover:bg-primary-container"
                  )}
                  style={{ height: `${Math.max(6, (m.count / maxCount) * 100)}%` }}
                >
                  {m.count > 0 && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {m.count}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-label-md text-[10px] tracking-wide text-muted-foreground uppercase",
                    m.isCurrent && "font-bold text-primary"
                  )}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card p-5 ambient-shadow lg:col-span-4">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Financial Overview</h3>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </div>
          <div className="relative mx-auto mb-6 flex size-40 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--color-surface-container-high)"
                strokeWidth="12"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="font-heading text-2xl font-bold">{collectionPct}%</span>
              <span className="text-[10px] tracking-wide text-muted-foreground uppercase">Collected</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-sm">Client Payments</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(totalCollected)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-outline-variant" />
                <span className="text-sm">Vendor Outflows</span>
              </div>
              <span className="text-sm font-bold">{formatCurrency(vendorOutflows)}</span>
            </div>
          </div>
          <Link
            href="/finance/client-payments"
            className="mt-4 w-full pt-2 text-center text-sm font-medium text-primary hover:underline"
          >
            View Full Ledger
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card ambient-shadow lg:col-span-12">
          <div className="flex items-center justify-between border-b border-border/40 bg-surface-bright p-5">
            <h3 className="font-heading text-lg font-semibold">Upcoming Schedule</h3>
            <div className="hidden items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground sm:flex">
              <Filter className="size-4" />
              Filter
            </div>
          </div>
          {upcomingSchedule.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No upcoming weddings scheduled.</p>
          ) : (
            <div className="divide-y divide-border/40">
              {upcomingSchedule.map((w) => (
                <Link
                  key={w.id}
                  href={`/weddings/${w.id}`}
                  className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
                      <Heart className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold">{w.name}</h4>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        {formatDate(w.startDate)}
                        {w.primaryVenue ? ` • ${w.primaryVenue}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                    <div className="hidden flex-col text-right md:flex">
                      <span className="text-[11px] tracking-wide text-muted-foreground uppercase">Budget</span>
                      <span className="text-sm font-medium">{formatCurrency(w.projectValue)}</span>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] tracking-wider uppercase",
                        STATUS_BADGE_CLASS[w.status]
                      )}
                    >
                      {WEDDING_STATUS_LABELS[w.status]}
                    </Badge>
                    <MoreVertical className="size-[18px] text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="border-t border-border/40 bg-card p-4 text-center">
            <Link href="/weddings/upcoming" className="text-sm font-medium text-primary hover:underline">
              View All Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
