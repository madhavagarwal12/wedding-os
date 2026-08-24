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
import { formatCurrency } from "@/lib/format";
import { CAN_VIEW_FINANCE, type Role } from "@/lib/roles";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user || !CAN_VIEW_FINANCE.includes(session.user.role as Role)) {
    redirect("/dashboard");
  }

  const weddings = await prisma.wedding.findMany({
    where: { status: { notIn: ["CANCELLED"] } },
    orderBy: { startDate: "desc" },
    include: { budgetItems: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Planned vs. actual cost across every wedding. Manage line items from each
          wedding&apos;s Finance tab.
        </p>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wedding</TableHead>
              <TableHead>Contract value</TableHead>
              <TableHead className="text-right">Planned cost</TableHead>
              <TableHead className="text-right">Actual cost</TableHead>
              <TableHead className="text-right">Estimated profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weddings.map((wedding) => {
              const planned = wedding.budgetItems.reduce((s, b) => s + Number(b.plannedAmount), 0);
              const actual = wedding.budgetItems.reduce((s, b) => s + Number(b.actualAmount), 0);
              const estimatedProfit = Number(wedding.projectValue) - planned;
              return (
                <TableRow key={wedding.id}>
                  <TableCell className="font-medium">
                    <Link href={`/weddings/${wedding.id}`} className="hover:underline">
                      {wedding.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrency(wedding.projectValue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(planned)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(actual)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(estimatedProfit)}</TableCell>
                </TableRow>
              );
            })}
            {weddings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No weddings yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
