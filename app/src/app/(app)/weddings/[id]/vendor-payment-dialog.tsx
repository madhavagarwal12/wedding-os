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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createVendorPaymentAction, type ActionState } from "@/lib/actions/finance";
import type { VendorBookingModel, VendorModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

type BookingWithVendor = VendorBookingModel & { vendor: VendorModel };

export function VendorPaymentDialog({
  weddingId,
  bookings,
}: {
  weddingId: string;
  bookings: BookingWithVendor[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createVendorPaymentAction(weddingId, prevState, formData);
    if (result.success) {
      toast.success("Payment scheduled.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const bookingItems = Object.fromEntries(
    bookings.map((b) => [b.id, `${b.vendor.name} (${b.service || "no service"})`])
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Schedule payment</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule vendor payment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendorBookingId">Vendor booking</Label>
            <Select name="vendorBookingId" items={bookingItems} required>
              <SelectTrigger id="vendorBookingId">
                <SelectValue placeholder="Select a booking" />
              </SelectTrigger>
              <SelectContent>
                {bookings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.vendor.name} ({b.service || "no service"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {bookings.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Book a vendor on this wedding first.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || bookings.length === 0}>
              {pending ? "Scheduling..." : "Schedule payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
