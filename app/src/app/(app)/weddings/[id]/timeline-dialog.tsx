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
import { createTimelineItemAction, type ActionState } from "@/lib/actions/weddings";
import type { FunctionModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

const TYPE_OPTIONS = [
  ["CLIENT_DECISION", "Client Decision"],
  ["VENDOR_CONFIRMATION", "Vendor Confirmation"],
  ["PAYMENT_DEADLINE", "Payment Deadline"],
  ["TASK_DEADLINE", "Task Deadline"],
  ["SETUP_DEADLINE", "Setup Deadline"],
  ["FUNCTION_MILESTONE", "Function Milestone"],
  ["MEETING", "Meeting"],
  ["DELIVERY", "Delivery"],
  ["OTHER", "Other"],
] as const;

export function TimelineDialog({
  weddingId,
  functions,
}: {
  weddingId: string;
  functions: FunctionModel[];
}) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createTimelineItemAction(weddingId, prevState, formData);
    if (result.success) {
      toast.success("Timeline item added.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const typeItems = Object.fromEntries(TYPE_OPTIONS);
  const functionItems = Object.fromEntries(functions.map((f) => [f.id, f.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Add timeline item</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add timeline item</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" items={typeItems} defaultValue="OTHER">
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
