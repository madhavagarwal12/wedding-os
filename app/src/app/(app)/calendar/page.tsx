import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

type CalendarEvent = {
  date: Date;
  label: string;
  href: string;
  kind: "wedding" | "function" | "task" | "client-payment" | "vendor-payment";
};

const KIND_STYLES: Record<CalendarEvent["kind"], { chip: string; dot: string }> = {
  wedding: { chip: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  function: { chip: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  task: { chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  "client-payment": { chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  "vendor-payment": { chip: "bg-sky-50 text-sky-700", dot: "bg-sky-500" },
};

const KIND_LABELS: Record<CalendarEvent["kind"], string> = {
  wedding: "Wedding date",
  function: "Function",
  task: "Task due",
  "client-payment": "Client payment due",
  "vendor-payment": "Vendor payment due",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const year = params.year ? parseInt(params.year, 10) : today.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : today.getMonth(); // 0-indexed

  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 1);

  const [weddings, functions, tasks, clientPayments, vendorPayments] = await Promise.all([
    prisma.wedding.findMany({
      where: { startDate: { gte: rangeStart, lt: rangeEnd } },
      select: { id: true, name: true, startDate: true },
    }),
    prisma.function.findMany({
      where: { date: { gte: rangeStart, lt: rangeEnd } },
      select: { id: true, name: true, date: true, weddingId: true },
    }),
    prisma.task.findMany({
      where: {
        dueDate: { gte: rangeStart, lt: rangeEnd },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      select: { id: true, name: true, dueDate: true, weddingId: true },
    }),
    prisma.clientPayment.findMany({
      where: {
        dueDate: { gte: rangeStart, lt: rangeEnd },
        status: { in: ["DUE", "OVERDUE", "PARTIALLY_PAID"] },
      },
      select: { id: true, weddingId: true, dueDate: true, amount: true },
    }),
    prisma.vendorPayment.findMany({
      where: {
        dueDate: { gte: rangeStart, lt: rangeEnd },
        status: { in: ["DUE", "OVERDUE", "PARTIALLY_PAID"] },
      },
      select: { id: true, weddingId: true, dueDate: true, amount: true },
    }),
  ]);

  const events: CalendarEvent[] = [
    ...weddings.map((w) => ({
      date: w.startDate,
      label: w.name,
      href: `/weddings/${w.id}`,
      kind: "wedding" as const,
    })),
    ...functions.map((f) => ({
      date: f.date,
      label: f.name,
      href: `/weddings/${f.weddingId}`,
      kind: "function" as const,
    })),
    ...tasks
      .filter((t) => t.dueDate)
      .map((t) => ({
        date: t.dueDate as Date,
        label: t.name,
        href: t.weddingId ? `/weddings/${t.weddingId}` : "/tasks/mine",
        kind: "task" as const,
      })),
    ...clientPayments.map((p) => ({
      date: p.dueDate,
      label: `Client payment due`,
      href: `/weddings/${p.weddingId}`,
      kind: "client-payment" as const,
    })),
    ...vendorPayments.map((p) => ({
      date: p.dueDate,
      label: `Vendor payment due`,
      href: `/weddings/${p.weddingId}`,
      kind: "vendor-payment" as const,
    })),
  ];

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dateKey(event.date);
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  const firstWeekday = rangeStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const monthLabel = rangeStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Wedding dates, functions, task due dates and payment due dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prevMonth}&year=${prevYear}`}
            className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-40 rounded-full border border-border bg-card px-4 py-2 text-center text-sm font-semibold">
            {monthLabel}
          </div>
          <Link
            href={`/calendar?month=${nextMonth}&year=${nextYear}`}
            className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Link>
          {!isCurrentMonth && (
            <Link
              href="/calendar"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Today
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_LABELS) as CalendarEvent["kind"][]).map((kind) => (
          <span
            key={kind}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              KIND_STYLES[kind].chip
            )}
          >
            <span className={cn("size-1.5 rounded-full", KIND_STYLES[kind].dot)} />
            {KIND_LABELS[kind]}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card ambient-shadow">
        <div className="grid min-w-[840px] grid-cols-7 border-b border-border/60 bg-surface-bright">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid min-w-[840px] grid-cols-7">
          {cells.map((date, i) => {
            const key = date ? dateKey(date) : `empty-${i}`;
            const dayEvents = date ? eventsByDay.get(key) ?? [] : [];
            const isToday = date && dateKey(date) === dateKey(today);
            const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6);
            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-28 flex-col gap-1 border-r border-b border-border/40 p-2 transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !date && "bg-muted/30",
                  date && isWeekend && "bg-surface-bright",
                  date && "hover:bg-muted/40"
                )}
              >
                {date && (
                  <>
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday
                          ? "bg-primary font-bold text-primary-foreground shadow-sm"
                          : "text-foreground/80"
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <Link
                          key={idx}
                          href={event.href}
                          className={cn(
                            "flex items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80",
                            KIND_STYLES[event.kind].chip
                          )}
                          title={event.label}
                        >
                          <span className={cn("size-1.5 shrink-0 rounded-full", KIND_STYLES[event.kind].dot)} />
                          <span className="truncate">{event.label}</span>
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="px-1.5 text-[11px] font-medium text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
