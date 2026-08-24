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
import { createVendorBookingAction, type ActionState } from "@/lib/actions/vendors";
import { VENDOR_CATEGORY_LABELS } from "@/lib/vendor-labels";
import type { FunctionModel, VendorModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function VendorBookingDialog({
  weddingId,
  vendors,
  functions,
}: {
  weddingId: string;
  vendors: VendorModel[];
  functions: FunctionModel[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createVendorBookingAction(weddingId, prevState, formData);
    if (result.success) {
      toast.success("Vendor booked.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const vendorItems = Object.fromEntries(
    vendors.map((v) => [v.id, `${v.name} (${VENDOR_CATEGORY_LABELS[v.category]})`])
  );
  const functionItems = Object.fromEntries(functions.map((f) => [f.id, f.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Book vendor</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book a vendor</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendorId">Vendor</Label>
            <Select name="vendorId" items={vendorItems} required>
              <SelectTrigger id="vendorId">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({VENDOR_CATEGORY_LABELS[v.category]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vendors.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add a vendor to the directory first.
              </p>
            )}
          </div>
          {functions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="functionId">Function</Label>
              <Select name="functionId" items={functionItems}>
                <SelectTrigger id="functionId">
                  <SelectValue placeholder="Whole wedding" />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Input id="service" name="service" placeholder="e.g. Full-day photography" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agreedAmount">Agreed amount</Label>
              <Input id="agreedAmount" name="agreedAmount" type="number" min={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance amount</Label>
              <Input id="advanceAmount" name="advanceAmount" type="number" min={0} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingDate">Booking date</Label>
            <Input id="bookingDate" name="bookingDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliverables">Deliverables</Label>
            <Textarea id="deliverables" name="deliverables" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || vendors.length === 0}>
              {pending ? "Booking..." : "Book vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
