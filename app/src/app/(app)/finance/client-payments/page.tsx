import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
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
import { ExportCsvButton } from "@/components/export-csv-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_STATUS_LABELS } from "@/lib/finance-labels";
import { CAN_VIEW_FINANCE, type Role } from "@/lib/roles";

export default async function ClientPaymentsPage() {
  const session = await auth();
  if (!session?.user || !CAN_VIEW_FINANCE.includes(session.user.role as Role)) {
    redirect("/dashboard");
  }

  const payments = await prisma.clientPayment.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { dueDate: "asc" },
    include: { wedding: { include: { client: true } } },
  });

  const now = new Date();
  const overdue = payments.filter((p) => p.dueDate < now && p.status !== "PAID");
  const outstanding = payments.reduce(
    (s, p) => s + (Number(p.amount) - Number(p.paidAmount)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Client Payments</h1>
          <p className="text-sm text-muted-foreground">
          {overdue.length} overdue · {formatCurrency(outstanding)} outstanding across all weddings
          </p>
        </div>
        <ExportCsvButton dataset="client-payments" />
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wedding</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  <Link href={`/weddings/${payment.weddingId}`} className="hover:underline">
                    {payment.wedding.name}
                  </Link>
                </TableCell>
                <TableCell>{payment.wedding.client.name}</TableCell>
                <TableCell>{formatDate(payment.dueDate)}</TableCell>
                <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(payment.paidAmount)}</TableCell>
                <TableCell>
                  <Badge variant={payment.dueDate < now && payment.status !== "PAID" ? "destructive" : "outline"}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No client payments scheduled yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
