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
import { updateVendorAction, type ActionState } from "@/lib/actions/vendors";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from "@/lib/vendor-labels";
import type { VendorModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function EditVendorDialog({ vendor }: { vendor: VendorModel }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await updateVendorAction(vendor.id, prevState, formData);
    if (result.success) {
      toast.success("Vendor updated.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Edit</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit vendor</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor name</Label>
              <Input id="name" name="name" defaultValue={vendor.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" name="businessName" defaultValue={vendor.businessName ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" items={VENDOR_CATEGORY_LABELS} defaultValue={vendor.category}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VENDOR_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {VENDOR_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input id="contactPerson" name="contactPerson" defaultValue={vendor.contactPerson ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={vendor.phone} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={vendor.whatsapp ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={vendor.email ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={vendor.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={vendor.address ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min={1}
              max={5}
              step={1}
              placeholder="Not rated"
              defaultValue={vendor.rating ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceDescription">Service description</Label>
            <Textarea id="serviceDescription" name="serviceDescription" rows={2} defaultValue={vendor.serviceDescription ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricingNotes">Pricing notes</Label>
            <Textarea id="pricingNotes" name="pricingNotes" rows={2} defaultValue={vendor.pricingNotes ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal notes</Label>
            <Textarea id="internalNotes" name="internalNotes" rows={2} defaultValue={vendor.internalNotes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
