"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createGuestAction,
  updateGuestAction,
  type ActionState,
} from "@/lib/actions/guests";
import type { FunctionModel, GuestModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function GuestDialog({
  weddingId,
  guest,
  attendingFunctionIds,
  functions,
  trigger,
}: {
  weddingId: string;
  guest?: GuestModel;
  attendingFunctionIds?: string[];
  functions: FunctionModel[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!guest;

  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = isEdit
      ? await updateGuestAction(weddingId, guest!.id, prevState, formData)
      : await createGuestAction(weddingId, prevState, formData);
    if (result.success) {
      toast.success(isEdit ? "Guest updated." : "Guest added.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit guest" : "Add guest"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={guest?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="familyGroup">Family / group</Label>
              <Input id="familyGroup" name="familyGroup" defaultValue={guest?.familyGroup ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Number of guests</Label>
              <Input id="guestCount" name="guestCount" type="number" min={1} defaultValue={guest?.guestCount ?? 1} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={guest?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={guest?.email ?? ""} />
            </div>
          </div>
          {functions.length > 0 && (
            <div className="space-y-2">
              <Label>Attending functions</Label>
              <div className="space-y-1.5">
                {functions.map((fn) => (
                  <label key={fn.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      name="functionIds"
                      value={fn.id}
                      defaultChecked={attendingFunctionIds?.includes(fn.id)}
                    />
                    {fn.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={guest?.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Add guest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
