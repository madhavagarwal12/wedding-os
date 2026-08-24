import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function FinanceDashboardPage() {
  const [
    clientAgg,
    vendorAgg,
    overdueClientPayments,
    overdueVendorPayments,
    dueSoonClientPayments,
    dueSoonVendorPayments,
  ] = await Promise.all([
    prisma.clientPayment.aggregate({ _sum: { amount: true, paidAmount: true } }),
    prisma.vendorPayment.aggregate({ _sum: { amount: true, paidAmount: true } }),
    prisma.clientPayment.count({ where: { status: "OVERDUE" } }),
    prisma.vendorPayment.count({ where: { status: "OVERDUE" } }),
    prisma.clientPayment.findMany({
      where: { status: { in: ["DUE", "OVERDUE", "PARTIALLY_PAID"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: { wedding: true },
    }),
    prisma.vendorPayment.findMany({
      where: { status: { in: ["DUE", "OVERDUE", "PARTIALLY_PAID"] } },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: { wedding: true, vendorBooking: { include: { vendor: true } } },
    }),
  ]);

  const outstandingFromClients =
    Number(clientAgg._sum.amount ?? 0) - Number(clientAgg._sum.paidAmount ?? 0);
  const outstandingToVendors =
    Number(vendorAgg._sum.amount ?? 0) - Number(vendorAgg._sum.paidAmount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Finance Dashboard</h1>
        <p className="text-sm text-muted-foreground">Receivables, payables and overdue items.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Outstanding from Clients" value={formatCurrency(outstandingFromClients)} />
        <StatCard label="Outstanding to Vendors" value={formatCurrency(outstandingToVendors)} />
        <StatCard label="Overdue Client Payments" value={overdueClientPayments} />
        <StatCard label="Overdue Vendor Payments" value={overdueVendorPayments} />
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Client payments due</span>
          <Link href="/finance/client-payments" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {dueSoonClientPayments.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Nothing due.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wedding</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dueSoonClientPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/weddings/${p.weddingId}`} className="hover:underline">
                      {p.wedding.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(p.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(p.amount) - Number(p.paidAmount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "OVERDUE" ? "destructive" : "outline"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Vendor payments due</span>
          <Link href="/finance/vendor-payments" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {dueSoonVendorPayments.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Nothing due.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Wedding</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dueSoonVendorPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.vendorBooking.vendor.name}</TableCell>
                  <TableCell>
                    <Link href={`/weddings/${p.weddingId}`} className="hover:underline">
                      {p.wedding.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(p.dueDate)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(p.amount) - Number(p.paidAmount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "OVERDUE" ? "destructive" : "outline"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
