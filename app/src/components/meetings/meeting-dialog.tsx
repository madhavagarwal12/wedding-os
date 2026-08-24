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
import {
  createMeetingAction,
  type ActionState,
  type RecordScope,
} from "@/lib/actions/meetings";
import { MEETING_TYPES, MEETING_TYPE_LABELS } from "@/lib/communication-labels";

const initialState: ActionState = {};

export function MeetingDialog({ scope }: { scope: RecordScope }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createMeetingAction(scope, prevState, formData);
    if (result.success) {
      toast.success("Meeting logged.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const typeItems = Object.fromEntries(
    MEETING_TYPES.map((type) => [type, MEETING_TYPE_LABELS[type]])
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Log meeting</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log meeting</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date &amp; time</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" items={typeItems} defaultValue="OTHER">
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {MEETING_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="participants">Participants</Label>
            <Input
              id="participants"
              name="participants"
              placeholder="e.g. Bride, groom, father of the bride"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="requirementsDiscovered">Requirements discovered</Label>
            <Textarea id="requirementsDiscovered" name="requirementsDiscovered" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="decisions">Decisions</Label>
            <Textarea id="decisions" name="decisions" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="followUpAction">Follow-up action</Label>
              <Input id="followUpAction" name="followUpAction" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up date</Label>
              <Input id="followUpDate" name="followUpDate" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Log meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
