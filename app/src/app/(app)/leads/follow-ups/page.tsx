import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { LEAD_STATUS_LABELS, OPEN_LEAD_STATUSES } from "@/lib/lead-status";
import type { LeadModel, UserModel } from "@/generated/prisma/models";

type LeadWithAssignee = LeadModel & { assignedTo: UserModel | null };

export default async function FollowUpsPage() {
  const now = new Date();
  const leads = await prisma.lead.findMany({
    where: {
      status: { in: OPEN_LEAD_STATUSES },
      nextFollowUpDate: { not: null },
      archivedAt: null,
    },
    orderBy: { nextFollowUpDate: "asc" },
    include: { assignedTo: true },
  });

  const overdue = leads.filter((l) => l.nextFollowUpDate! < now);
  const dueToday = leads.filter(
    (l) =>
      l.nextFollowUpDate! >= new Date(now.toDateString()) &&
      l.nextFollowUpDate! < new Date(new Date(now.toDateString()).getTime() + 86400000)
  );
  const upcoming = leads.filter(
    (l) => l.nextFollowUpDate! >= new Date(new Date(now.toDateString()).getTime() + 86400000)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">
          {overdue.length} overdue · {dueToday.length} due today · {upcoming.length} upcoming
        </p>
      </div>

      <Section title="Overdue" leads={overdue} tone="destructive" />
      <Section title="Due today" leads={dueToday} tone="default" />
      <Section title="Upcoming" leads={upcoming} tone="secondary" />
    </div>
  );
}

function Section({
  title,
  leads,
  tone,
}: {
  title: string;
  leads: LeadWithAssignee[];
  tone: "destructive" | "default" | "secondary";
}) {
  if (leads.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background">
      <div className="border-b p-3 text-sm font-medium">
        {title} <Badge variant={tone}>{leads.length}</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Follow-up date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                  {lead.leadName}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{LEAD_STATUS_LABELS[lead.status]}</Badge>
              </TableCell>
              <TableCell>{lead.assignedTo?.name ?? "Unassigned"}</TableCell>
              <TableCell>{formatDate(lead.nextFollowUpDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
