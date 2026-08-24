import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/format";
import { LEAD_STATUS_LABELS, OPEN_LEAD_STATUSES } from "@/lib/lead-status";

export default async function SalesDashboardPage() {
  const session = await auth();
  const userId = session?.user.id;

  const now = new Date();
  const [newLeads, openLeads, wonThisMonth, pipelineValueAgg, followUpsDue, myLeads] =
    await Promise.all([
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: { in: OPEN_LEAD_STATUSES } } }),
      prisma.lead.count({
        where: {
          status: "WON",
          updatedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
      prisma.lead.aggregate({
        where: { status: { in: OPEN_LEAD_STATUSES } },
        _sum: { estimatedBudget: true },
      }),
      prisma.lead.findMany({
        where: {
          status: { in: OPEN_LEAD_STATUSES },
          nextFollowUpDate: { lte: now },
        },
        orderBy: { nextFollowUpDate: "asc" },
        take: 10,
      }),
      prisma.lead.findMany({
        where: userId ? { assignedToId: userId, status: { in: OPEN_LEAD_STATUSES } } : { id: "" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sales Dashboard</h1>
        <p className="text-sm text-muted-foreground">Pipeline health and follow-ups.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="New Leads" value={newLeads} />
        <StatCard label="Open Leads" value={openLeads} />
        <StatCard label="Won This Month" value={wonThisMonth} />
        <StatCard
          label="Open Pipeline Value"
          value={formatCurrency(pipelineValueAgg._sum.estimatedBudget ?? 0)}
        />
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Follow-ups due</span>
          <Link href="/leads/follow-ups" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {followUpsDue.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Nothing due right now.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Follow-up date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followUpsDue.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.leadName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(lead.nextFollowUpDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">My open leads</span>
          <Link href="/leads" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {myLeads.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No leads assigned to you.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estimated budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.leadName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(lead.estimatedBudget)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
