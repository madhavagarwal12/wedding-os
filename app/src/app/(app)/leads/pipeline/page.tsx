import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { OPEN_LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/lead-status";

export default async function LeadPipelinePage() {
  const leads = await prisma.lead.findMany({
    where: { status: { in: OPEN_LEAD_STATUSES }, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: true },
  });

  const pipelineValue = leads.reduce(
    (sum, l) => sum + Number(l.estimatedBudget ?? 0),
    0
  );

  const byStatus = OPEN_LEAD_STATUSES.map((status) => ({
    status,
    leads: leads.filter((l) => l.status === status),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {leads.length} open leads · {formatCurrency(pipelineValue)} estimated pipeline value
        </p>
      </div>

      <div className="grid gap-4 overflow-x-auto md:grid-cols-3 lg:grid-cols-6">
        {byStatus.map(({ status, leads: statusLeads }) => (
          <div key={status} className="min-w-[220px] rounded-lg border bg-background">
            <div className="border-b p-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{LEAD_STATUS_LABELS[status]}</span>
                <Badge variant="secondary">{statusLeads.length}</Badge>
              </div>
            </div>
            <div className="space-y-2 p-2">
              {statusLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block rounded-md border p-2 text-sm hover:bg-accent"
                >
                  <div className="font-medium">{lead.leadName}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead.assignedTo?.name ?? "Unassigned"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(lead.estimatedBudget)}
                  </div>
                  {lead.nextFollowUpDate && (
                    <div className="text-xs text-muted-foreground">
                      Follow-up: {formatDate(lead.nextFollowUpDate)}
                    </div>
                  )}
                </Link>
              ))}
              {statusLeads.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground">No leads</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
