"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { deleteBudgetItemAction } from "@/lib/actions/finance";
import { BudgetItemDialog } from "./budget-item-dialog";
import type { BudgetItemModel } from "@/generated/prisma/models";

export function BudgetSection({
  weddingId,
  items,
}: {
  weddingId: string;
  items: BudgetItemModel[];
}) {
  const [pending, startTransition] = useTransition();

  const totals = items.reduce(
    (acc, item) => ({
      planned: acc.planned + Number(item.plannedAmount),
      committed: acc.committed + Number(item.committedAmount),
      actual: acc.actual + Number(item.actualAmount),
    }),
    { planned: 0, committed: 0, actual: 0 }
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <BudgetItemDialog weddingId={weddingId} trigger={<Button size="sm">Add category</Button>} />
      </div>
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Planned</TableHead>
              <TableHead className="text-right">Committed</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const variance = Number(item.plannedAmount) - Number(item.actualAmount);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.plannedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.committedAmount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.actualAmount)}</TableCell>
                  <TableCell className={`text-right ${variance < 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(variance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <BudgetItemDialog
                        weddingId={weddingId}
                        item={item}
                        trigger={<Button variant="outline" size="sm">Edit</Button>}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await deleteBudgetItemAction(weddingId, item.id);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Failed to delete");
                            }
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No budget categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {items.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.planned)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.committed)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(totals.actual)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(totals.planned - totals.actual)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
