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
import { createLeadAction, type ActionState } from "@/lib/actions/leads";
import type { UserModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function CreateLeadDialog({ users }: { users: UserModel[] }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createLeadAction(prevState, formData);
    if (result.success) {
      toast.success("Lead created.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const userItems = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New lead</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadName">Lead / family name</Label>
              <Input id="leadName" name="leadName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContact">Primary contact</Label>
              <Input id="primaryContact" name="primaryContact" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input id="eventDate" name="eventDate" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedGuestCount">Guests (est.)</Label>
              <Input id="estimatedGuestCount" name="estimatedGuestCount" type="number" min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">Budget (est.)</Label>
              <Input id="estimatedBudget" name="estimatedBudget" type="number" min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="Referral, Instagram, ..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned to</Label>
              <Select name="assignedToId" items={userItems}>
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
            <Label htmlFor="nextFollowUpDate">Next follow-up</Label>
            <Input id="nextFollowUpDate" name="nextFollowUpDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
