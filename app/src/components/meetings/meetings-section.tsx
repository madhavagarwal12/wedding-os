"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/format";
import { MEETING_TYPE_LABELS } from "@/lib/communication-labels";
import { deleteMeetingAction, type RecordScope } from "@/lib/actions/meetings";
import { MeetingDialog } from "./meeting-dialog";
import type { MeetingType } from "@/generated/prisma/enums";

export type MeetingListItem = {
  id: string;
  scheduledAt: Date | string;
  type: MeetingType;
  participants: string | null;
  notes: string | null;
  requirementsDiscovered: string | null;
  decisions: string | null;
  followUpAction: string | null;
  followUpDate: Date | string | null;
  createdBy?: { name: string } | null;
};

export function MeetingsSection({
  scope,
  meetings,
  canDelete = false,
}: {
  scope: RecordScope;
  meetings: MeetingListItem[];
  canDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <MeetingDialog scope={scope} />
      </div>
      <div className="space-y-2">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatDateTime(meeting.scheduledAt)}</span>
                <Badge variant="outline">{MEETING_TYPE_LABELS[meeting.type]}</Badge>
              </div>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteMeetingAction(scope, meeting.id);
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Failed to delete"
                        );
                      }
                    })
                  }
                >
                  Delete
                </Button>
              )}
            </div>
            {meeting.participants && (
              <p className="mt-1 text-xs text-muted-foreground">
                Participants: {meeting.participants}
              </p>
            )}
            {meeting.notes && <p className="mt-1 whitespace-pre-wrap">{meeting.notes}</p>}
            {meeting.requirementsDiscovered && (
              <p className="mt-1 text-muted-foreground">
                Requirements: {meeting.requirementsDiscovered}
              </p>
            )}
            {meeting.decisions && (
              <p className="mt-1 text-muted-foreground">Decisions: {meeting.decisions}</p>
            )}
            {(meeting.followUpAction || meeting.followUpDate) && (
              <p className="mt-1 text-xs text-muted-foreground">
                Follow-up: {meeting.followUpAction || "—"}
                {meeting.followUpDate && ` · ${formatDate(meeting.followUpDate)}`}
              </p>
            )}
            {meeting.createdBy && (
              <p className="mt-1 text-xs text-muted-foreground">
                Logged by {meeting.createdBy.name}
              </p>
            )}
          </div>
        ))}
        {meetings.length === 0 && (
          <p className="text-sm text-muted-foreground">No meetings logged yet.</p>
        )}
      </div>
    </div>
  );
}
