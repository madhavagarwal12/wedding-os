"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createBudgetItemAction,
  updateBudgetItemAction,
  type ActionState,
} from "@/lib/actions/finance";
import { DEFAULT_BUDGET_CATEGORIES } from "@/lib/finance-labels";
import type { BudgetItemModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function BudgetItemDialog({
  weddingId,
  item,
  trigger,
}: {
  weddingId: string;
  item?: BudgetItemModel;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!item;

  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = isEdit
      ? await updateBudgetItemAction(weddingId, item!.id, prevState, formData)
      : await createBudgetItemAction(weddingId, prevState, formData);
    if (result.success) {
      toast.success(isEdit ? "Budget item updated." : "Budget item added.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit budget item" : "Add budget item"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              name="category"
              defaultValue={item?.category}
              list="budget-categories"
              required
            />
            <datalist id="budget-categories">
              {DEFAULT_BUDGET_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plannedAmount">Planned</Label>
              <Input id="plannedAmount" name="plannedAmount" type="number" min={0} defaultValue={item?.plannedAmount.toString() ?? "0"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="committedAmount">Committed</Label>
              <Input id="committedAmount" name="committedAmount" type="number" min={0} defaultValue={item?.committedAmount.toString() ?? "0"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualAmount">Actual</Label>
              <Input id="actualAmount" name="actualAmount" type="number" min={0} defaultValue={item?.actualAmount.toString() ?? "0"} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={item?.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
