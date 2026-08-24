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
import { updateLeadAction, type ActionState } from "@/lib/actions/leads";
import { toDateInputValue } from "@/lib/format";
import type { LeadModel, UserModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function EditLeadDialog({
  lead,
  users,
}: {
  lead: LeadModel;
  users: UserModel[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await updateLeadAction(lead.id, prevState, formData);
    if (result.success) {
      toast.success("Lead updated.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const userItems = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Edit</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadName">Lead / family name</Label>
              <Input id="leadName" name="leadName" defaultValue={lead.leadName} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContact">Primary contact</Label>
              <Input id="primaryContact" name="primaryContact" defaultValue={lead.primaryContact} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={lead.phone} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={lead.whatsapp ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={lead.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input id="eventDate" name="eventDate" type="date" defaultValue={toDateInputValue(lead.eventDate)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" defaultValue={lead.location ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedGuestCount">Guests (est.)</Label>
              <Input id="estimatedGuestCount" name="estimatedGuestCount" type="number" min={0} defaultValue={lead.estimatedGuestCount ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Budget (est.)</Label>
              <Input id="estimatedBudget" name="estimatedBudget" type="number" min={0} defaultValue={lead.estimatedBudget?.toString() ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" defaultValue={lead.source ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned to</Label>
              <Select name="assignedToId" items={userItems} defaultValue={lead.assignedToId ?? undefined}>
                <SelectTrigger id="assignedToId">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" name="requirements" rows={2} defaultValue={lead.requirements ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextFollowUpDate">Next follow-up</Label>
            <Input id="nextFollowUpDate" name="nextFollowUpDate" type="date" defaultValue={toDateInputValue(lead.nextFollowUpDate)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={lead.notes ?? ""} />
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
