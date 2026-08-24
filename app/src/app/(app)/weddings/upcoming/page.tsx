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
import { formatCurrency, formatDate } from "@/lib/format";
import { WEDDING_STATUS_LABELS } from "@/lib/wedding-status";

export default async function UpcomingWeddingsPage() {
  const weddings = await prisma.wedding.findMany({
    where: {
      startDate: { gte: new Date() },
      status: { notIn: ["CLOSED", "CANCELLED"] },
      archivedAt: null,
    },
    orderBy: { startDate: "asc" },
    include: { client: true, projectManager: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Upcoming Weddings</h1>
        <p className="text-sm text-muted-foreground">
          {weddings.length} weddings scheduled from today onward.
        </p>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wedding</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project Manager</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weddings.map((wedding) => (
              <TableRow key={wedding.id}>
                <TableCell className="font-medium">
                  <Link href={`/weddings/${wedding.id}`} className="hover:underline">
                    {wedding.name}
                  </Link>
                </TableCell>
                <TableCell>{wedding.client.name}</TableCell>
                <TableCell>{formatDate(wedding.startDate)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{WEDDING_STATUS_LABELS[wedding.status]}</Badge>
                </TableCell>
                <TableCell>{wedding.projectManager?.name ?? "Unassigned"}</TableCell>
                <TableCell className="text-right">{formatCurrency(wedding.projectValue)}</TableCell>
              </TableRow>
            ))}
            {weddings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No upcoming weddings.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
