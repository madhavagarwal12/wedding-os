"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_CHANNEL_LABELS,
} from "@/lib/communication-labels";
import {
  createCommunicationNoteAction,
  type ActionState,
} from "@/lib/actions/communication-notes";
import type { RecordScope } from "@/lib/actions/meetings";
import type { CommunicationChannel } from "@/generated/prisma/enums";

const initialState: ActionState = {};

export type CommunicationNoteListItem = {
  id: string;
  contactPerson: string | null;
  channel: CommunicationChannel;
  summary: string;
  outcome: string | null;
  followUpRequired: boolean;
  followUpDate: Date | string | null;
  createdAt: Date | string;
  createdBy?: { name: string } | null;
};

export function CommunicationNotesSection({
  scope,
  notes,
}: {
  scope: RecordScope;
  notes: CommunicationNoteListItem[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => createCommunicationNoteAction(scope, prevState, formData), initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Communication note added.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  const channelItems = Object.fromEntries(
    COMMUNICATION_CHANNELS.map((channel) => [
      channel,
      COMMUNICATION_CHANNEL_LABELS[channel],
    ])
  );

  return (
    <div className="space-y-4">
      <form ref={formRef} action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="channel">Channel</Label>
            <Select name="channel" items={channelItems} defaultValue="WHATSAPP">
              <SelectTrigger id="channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMUNICATION_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {COMMUNICATION_CHANNEL_LABELS[channel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input id="contactPerson" name="contactPerson" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" rows={2} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outcome">Outcome</Label>
          <Input id="outcome" name="outcome" />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="followUpRequired" value="on" />
            Follow-up required
          </label>
          <div className="space-y-2">
            <Label htmlFor="followUpDate">Follow-up date</Label>
            <Input id="followUpDate" name="followUpDate" type="date" />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Add note"}
        </Button>
      </form>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {COMMUNICATION_CHANNEL_LABELS[note.channel]}
                </Badge>
                {note.contactPerson && (
                  <span className="text-muted-foreground">{note.contactPerson}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(note.createdAt)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap">{note.summary}</p>
            {note.outcome && (
              <p className="mt-1 text-muted-foreground">Outcome: {note.outcome}</p>
            )}
            {note.followUpRequired && (
              <p className="mt-1 text-xs text-muted-foreground">
                Follow-up required
                {note.followUpDate && ` · ${formatDate(note.followUpDate)}`}
              </p>
            )}
            {note.createdBy && (
              <p className="mt-1 text-xs text-muted-foreground">
                Logged by {note.createdBy.name}
              </p>
            )}
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">No communication notes yet.</p>
        )}
      </div>
    </div>
  );
}
