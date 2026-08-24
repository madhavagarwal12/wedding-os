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
  createFunctionAction,
  updateFunctionAction,
  type ActionState,
} from "@/lib/actions/weddings";
import { toDateInputValue } from "@/lib/format";
import type { FunctionModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

function timeInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(11, 16);
}

export function FunctionDialog({
  weddingId,
  fn,
  trigger,
}: {
  weddingId: string;
  fn?: FunctionModel;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!fn;

  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = isEdit
      ? await updateFunctionAction(weddingId, fn!.id, prevState, formData)
      : await createFunctionAction(weddingId, prevState, formData);
    if (result.success) {
      toast.success(isEdit ? "Function updated." : "Function added.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit function" : "Add function"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Function name</Label>
            <Input id="name" name="name" defaultValue={fn?.name} placeholder="e.g. Haldi, Sangeet" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={toDateInputValue(fn?.date)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue={timeInputValue(fn?.startTime)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue={timeInputValue(fn?.endTime)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" name="venue" defaultValue={fn?.venue ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCount">Guest count</Label>
              <Input id="guestCount" name="guestCount" type="number" min={0} defaultValue={fn?.guestCount ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={fn?.description ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea id="requirements" name="requirements" rows={2} defaultValue={fn?.requirements ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={fn?.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Add function"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
