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
import { LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { formatDate } from "@/lib/format";
import { Pagination, PAGE_SIZE, pageFromSearchParams } from "@/components/pagination";
import { PhoneLink } from "@/components/contact-links";
import { ExportCsvButton } from "@/components/export-csv-button";
import { CreateLeadDialog } from "./create-lead-dialog";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const page = pageFromSearchParams((await searchParams).page);
  const where = { archivedAt: null };
  const [leads, total, users] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { assignedTo: true },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["OWNER", "SALES"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            All enquiries, from first contact through conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsvButton dataset="leads" />
          <CreateLeadDialog users={users} />
        </div>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Event Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Next Follow-up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">
                  <Link href={`/leads/${lead.id}`} className="hover:underline">
                    {lead.leadName}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {lead.primaryContact}
                  </div>
                </TableCell>
                <TableCell>
                  <PhoneLink phone={lead.phone} />
                </TableCell>
                <TableCell>{formatDate(lead.eventDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {LEAD_STATUS_LABELS[lead.status]}
                  </Badge>
                </TableCell>
                <TableCell>{lead.assignedTo?.name ?? "Unassigned"}</TableCell>
                <TableCell>{formatDate(lead.nextFollowUpDate)}</TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No leads yet. Add your first lead to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination basePath="/leads" page={page} total={total} />
    </div>
  );
}
