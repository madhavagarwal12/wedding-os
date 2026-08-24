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
import { createWeddingAction, type ActionState } from "@/lib/actions/weddings";
import type { ClientModel, UserModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function CreateWeddingDialog({
  clients,
  users,
}: {
  clients: ClientModel[];
  users: UserModel[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createWeddingAction(prevState, formData);
    if (result.success) {
      toast.success("Wedding created.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const clientItems = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const userItems = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New wedding</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New wedding</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Wedding name</Label>
            <Input id="name" name="name" required placeholder="e.g. Sharma Wedding" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <Select name="clientId" items={clientItems} required>
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clients.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Create a client first from the Clients page.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brideName">Bride name</Label>
              <Input id="brideName" name="brideName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groomName">Groom name</Label>
              <Input id="groomName" name="groomName" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Wedding date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryVenue">Primary venue</Label>
            <Input id="primaryVenue" name="primaryVenue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedGuestCount">Guests (est.)</Label>
              <Input id="estimatedGuestCount" name="estimatedGuestCount" type="number" min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectValue">Project value</Label>
              <Input id="projectValue" name="projectValue" type="number" min={0} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectManagerId">Project manager</Label>
            <Select name="projectManagerId" items={userItems}>
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
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create wedding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
