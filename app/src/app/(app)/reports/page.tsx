import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { WEDDING_STATUSES, WEDDING_STATUS_LABELS } from "@/lib/wedding-status";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from "@/lib/vendor-labels";
import { ExportCsvButton } from "@/components/export-csv-button";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 ambient-shadow">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function TileGrid({
  title,
  items,
}: {
  title: string;
  items: { key: string; label: string; value: number }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h3>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/60 p-4"
          >
            <span className="font-heading text-xl font-bold text-primary">{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

async function SalesReport() {
  const [leadsByStatus, totalLeads, wonLeads, pipelineValue] = await Promise.all([
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.lead.aggregate({
      where: { status: { notIn: ["WON", "LOST"] } },
      _sum: { estimatedBudget: true },
    }),
  ]);
  const countByStatus = new Map(leadsByStatus.map((r) => [r.status, r._count._all]));
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportCsvButton dataset="leads" label="Export leads CSV" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total leads" value={totalLeads} />
        <StatTile label="Conversion rate" value={`${conversionRate}%`} />
        <StatTile
          label="Open pipeline value"
          value={formatCurrency(pipelineValue._sum.estimatedBudget ?? 0)}
        />
      </div>
      <TileGrid
        title="Leads by status"
        items={LEAD_STATUSES.map((status) => ({
          key: status,
          label: LEAD_STATUS_LABELS[status],
          value: countByStatus.get(status) ?? 0,
        }))}
      />
    </div>
  );
}

async function WeddingsReport() {
  const [weddingsByStatus, totalWeddings, contractValueAgg] = await Promise.all([
    prisma.wedding.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.wedding.count(),
    prisma.wedding.aggregate({
      where: { status: { notIn: ["CANCELLED"] } },
      _sum: { projectValue: true },
    }),
  ]);
  const countByStatus = new Map(weddingsByStatus.map((r) => [r.status, r._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportCsvButton dataset="weddings" label="Export weddings CSV" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Total weddings" value={totalWeddings} />
        <StatTile
          label="Total contract value"
          value={formatCurrency(contractValueAgg._sum.projectValue ?? 0)}
        />
      </div>
      <TileGrid
        title="Weddings by status"
        items={WEDDING_STATUSES.map((status) => ({
          key: status,
          label: WEDDING_STATUS_LABELS[status],
          value: countByStatus.get(status) ?? 0,
        }))}
      />
    </div>
  );
}

async function VendorsReport() {
  const [vendorsByCategory, totalVendors, activeVendors, bookingValueByVendor] = await Promise.all([
    prisma.vendor.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.vendor.count(),
    prisma.vendor.count({ where: { status: "ACTIVE" } }),
    prisma.vendorBooking.groupBy({
      by: ["vendorId"],
      _sum: { agreedAmount: true },
      orderBy: { _sum: { agreedAmount: "desc" } },
      take: 10,
    }),
  ]);
  const countByCategory = new Map(vendorsByCategory.map((r) => [r.category, r._count._all]));
  const vendorIds = bookingValueByVendor.map((b) => b.vendorId);
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } } });
  const vendorById = new Map(vendors.map((v) => [v.id, v]));

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportCsvButton dataset="vendors" label="Export vendors CSV" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Total vendors" value={totalVendors} />
        <StatTile label="Active vendors" value={activeVendors} />
      </div>
      <TileGrid
        title="Vendors by category"
        items={VENDOR_CATEGORIES.filter((c) => (countByCategory.get(c) ?? 0) > 0).map((category) => ({
          key: category,
          label: VENDOR_CATEGORY_LABELS[category],
          value: countByCategory.get(category) ?? 0,
        }))}
      />
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Top vendors by business value</h3>
        {bookingValueByVendor.length === 0 && (
          <p className="text-sm text-muted-foreground">No vendor bookings yet.</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bookingValueByVendor.map((row) => (
            <div
              key={row.vendorId}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/60 p-4"
            >
              <span className="truncate text-sm font-medium">
                {vendorById.get(row.vendorId)?.name ?? "—"}
              </span>
              <span className="shrink-0 pl-2 text-sm font-bold text-primary">
                {formatCurrency(row._sum.agreedAmount ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function FinanceReport() {
  const [
    budgetAgg,
    clientPaymentAgg,
    vendorPaymentAgg,
    overdueClientPayments,
    overdueVendorPayments,
  ] = await Promise.all([
    prisma.budgetItem.aggregate({
      _sum: { plannedAmount: true, actualAmount: true },
    }),
    prisma.clientPayment.aggregate({ _sum: { amount: true, paidAmount: true } }),
    prisma.vendorPayment.aggregate({ _sum: { amount: true, paidAmount: true } }),
    prisma.clientPayment.count({ where: { status: "OVERDUE" } }),
    prisma.vendorPayment.count({ where: { status: "OVERDUE" } }),
  ]);

  const plannedCost = Number(budgetAgg._sum.plannedAmount ?? 0);
  const actualCost = Number(budgetAgg._sum.actualAmount ?? 0);
  const totalClientScheduled = Number(clientPaymentAgg._sum.amount ?? 0);
  const totalClientReceived = Number(clientPaymentAgg._sum.paidAmount ?? 0);
  const totalVendorScheduled = Number(vendorPaymentAgg._sum.amount ?? 0);
  const totalVendorPaid = Number(vendorPaymentAgg._sum.paidAmount ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-2">
        <ExportCsvButton dataset="client-payments" label="Export client payments CSV" />
        <ExportCsvButton dataset="vendor-payments" label="Export vendor payments CSV" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total planned cost" value={formatCurrency(plannedCost)} />
        <StatTile label="Total actual cost" value={formatCurrency(actualCost)} />
        <StatTile
          label="Client receivables outstanding"
          value={formatCurrency(totalClientScheduled - totalClientReceived)}
        />
        <StatTile
          label="Vendor payables outstanding"
          value={formatCurrency(totalVendorScheduled - totalVendorPaid)}
        />
        <StatTile label="Overdue client payments" value={overdueClientPayments} />
        <StatTile label="Overdue vendor payments" value={overdueVendorPayments} />
      </div>
    </div>
  );
}

async function OperationsReport() {
  const [
    tasksByStatus,
    overdueTasks,
    tasksByPriority,
    guestStats,
  ] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.count({
      where: { dueDate: { lt: new Date() }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      _count: { _all: true },
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    }),
    prisma.guest.groupBy({ by: ["rsvpStatus"], _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportCsvButton dataset="tasks" label="Export tasks CSV" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Overdue tasks" value={overdueTasks} />
        <StatTile
          label="Total guests tracked"
          value={guestStats.reduce((s, r) => s + r._count._all, 0)}
        />
      </div>
      <TileGrid
        title="Tasks by status"
        items={tasksByStatus.map((row) => ({
          key: row.status,
          label: row.status,
          value: row._count._all,
        }))}
      />
      <TileGrid
        title="Open tasks by priority"
        items={tasksByPriority.map((row) => ({
          key: row.priority,
          label: row.priority,
          value: row._count._all,
        }))}
      />
    </div>
  );
}

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Cross-cutting reports for sales, weddings, vendors, finance and operations.
        </p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="h-auto flex-wrap gap-1 rounded-full bg-muted p-1">
          <TabsTrigger
            value="sales"
            className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground"
          >
            Sales
          </TabsTrigger>
          <TabsTrigger
            value="weddings"
            className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground"
          >
            Weddings
          </TabsTrigger>
          <TabsTrigger
            value="vendors"
            className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground"
          >
            Vendors
          </TabsTrigger>
          <TabsTrigger
            value="finance"
            className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground"
          >
            Finance
          </TabsTrigger>
          <TabsTrigger
            value="operations"
            className="rounded-full px-4 py-2 data-active:bg-primary data-active:text-primary-foreground"
          >
            Operations
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-6">
          <SalesReport />
        </TabsContent>
        <TabsContent value="weddings" className="mt-6">
          <WeddingsReport />
        </TabsContent>
        <TabsContent value="vendors" className="mt-6">
          <VendorsReport />
        </TabsContent>
        <TabsContent value="finance" className="mt-6">
          <FinanceReport />
        </TabsContent>
        <TabsContent value="operations" className="mt-6">
          <OperationsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
