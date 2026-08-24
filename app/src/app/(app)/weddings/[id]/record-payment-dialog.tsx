"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionState } from "@/lib/actions/finance";

const initialState: ActionState = {};

export function RecordPaymentDialog({
  action,
  currentPaidAmount,
  trigger,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  currentPaidAmount: number;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await action(prevState, formData);
    if (result.success) {
      toast.success("Payment recorded.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paidAmount">Amount paid</Label>
            <Input
              id="paidAmount"
              key={currentPaidAmount}
              name="paidAmount"
              type="number"
              min={0}
              defaultValue={currentPaidAmount || undefined}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment date</Label>
              <Input id="paymentDate" name="paymentDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Method</Label>
              <Input id="paymentMethod" name="paymentMethod" placeholder="UPI, Bank transfer..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
