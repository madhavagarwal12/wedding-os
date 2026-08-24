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
import { updateWeddingAction, type ActionState } from "@/lib/actions/weddings";
import { toDateInputValue } from "@/lib/format";
import type { ClientModel, UserModel, WeddingModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function EditWeddingDialog({
  wedding,
  clients,
  users,
}: {
  wedding: WeddingModel;
  clients: ClientModel[];
  users: UserModel[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await updateWeddingAction(wedding.id, prevState, formData);
    if (result.success) {
      toast.success("Wedding updated.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const clientItems = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const userItems = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Edit</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit wedding</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Wedding name</Label>
            <Input id="name" name="name" defaultValue={wedding.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId" items={clientItems} defaultValue={wedding.clientId}>
              <SelectTrigger id="clientId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brideName">Bride name</Label>
              <Input id="brideName" name="brideName" defaultValue={wedding.brideName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groomName">Groom name</Label>
              <Input id="groomName" name="groomName" defaultValue={wedding.groomName ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Wedding date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(wedding.startDate)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={toDateInputValue(wedding.endDate)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={wedding.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={wedding.state ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryVenue">Primary venue</Label>
            <Input id="primaryVenue" name="primaryVenue" defaultValue={wedding.primaryVenue ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedGuestCount">Guests (est.)</Label>
              <Input id="estimatedGuestCount" name="estimatedGuestCount" type="number" min={0} defaultValue={wedding.estimatedGuestCount ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectValue">Project value</Label>
              <Input id="projectValue" name="projectValue" type="number" min={0} defaultValue={wedding.projectValue.toString()} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectManagerId">Project manager</Label>
            <Select name="projectManagerId" items={userItems} defaultValue={wedding.projectManagerId ?? undefined}>
              <SelectTrigger id="projectManagerId">
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
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={wedding.notes ?? ""} />
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
