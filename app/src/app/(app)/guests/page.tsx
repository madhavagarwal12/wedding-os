import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function GuestsOverviewPage() {
  const weddings = await prisma.wedding.findMany({
    where: { status: { notIn: ["CANCELLED"] } },
    orderBy: { startDate: "desc" },
    include: { guests: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Guests</h1>
        <p className="text-sm text-muted-foreground">
          Guest lists are managed per wedding — open a wedding&apos;s Guests tab to
          add guests and track RSVPs.
        </p>
      </div>

      {weddings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No weddings yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((wedding) => {
            const total = wedding.guests.reduce((s, g) => s + g.guestCount, 0);
            const confirmed = wedding.guests.filter((g) => g.rsvpStatus === "CONFIRMED").length;
            const pending = wedding.guests.filter(
              (g) => g.rsvpStatus === "PENDING" || g.rsvpStatus === "INVITED"
            ).length;
            const declined = wedding.guests.filter((g) => g.rsvpStatus === "DECLINED").length;
            const trackedTotal = confirmed + pending + declined || 1;

            return (
              <Link
                key={wedding.id}
                href={`/weddings/${wedding.id}`}
                className="group flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 ambient-shadow transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-heading text-base font-semibold group-hover:text-primary">
                    {wedding.name}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <Users className="size-3.5" />
                    {total}
                  </div>
                </div>

                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(confirmed / trackedTotal) * 100}%` }}
                  />
                  <div
                    className="h-full bg-tertiary-container"
                    style={{ width: `${(pending / trackedTotal) * 100}%` }}
                  />
                  <div
                    className="h-full bg-destructive/60"
                    style={{ width: `${(declined / trackedTotal) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted py-2">
                    <div className="font-heading text-lg font-bold text-primary">{confirmed}</div>
                    <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Confirmed</div>
                  </div>
                  <div className="rounded-lg bg-muted py-2">
                    <div className="font-heading text-lg font-bold text-on-tertiary-container">{pending}</div>
                    <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Pending</div>
                  </div>
                  <div className="rounded-lg bg-muted py-2">
                    <div className="font-heading text-lg font-bold text-destructive">{declined}</div>
                    <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Declined</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
