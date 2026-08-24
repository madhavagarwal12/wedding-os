"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteGuestAction, updateGuestRsvpAction } from "@/lib/actions/guests";
import { RSVP_STATUSES, RSVP_STATUS_LABELS } from "@/lib/guest-labels";
import { PhoneLink } from "@/components/contact-links";
import { GuestDialog } from "./guest-dialog";
import type { FunctionModel, GuestModel } from "@/generated/prisma/models";

type GuestWithAttendance = GuestModel & {
  functionAttendance: { functionId: string }[];
};

export function GuestsSection({
  weddingId,
  guests,
  functions,
}: {
  weddingId: string;
  guests: GuestWithAttendance[];
  functions: FunctionModel[];
}) {
  const [pending, startTransition] = useTransition();

  const totalGuests = guests.reduce((s, g) => s + g.guestCount, 0);
  const confirmed = guests.filter((g) => g.rsvpStatus === "CONFIRMED").length;
  const pendingCount = guests.filter((g) => g.rsvpStatus === "PENDING" || g.rsvpStatus === "INVITED").length;
  const declined = guests.filter((g) => g.rsvpStatus === "DECLINED").length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Total guests" value={totalGuests} />
        <StatBox label="Confirmed" value={confirmed} />
        <StatBox label="Pending" value={pendingCount} />
        <StatBox label="Declined" value={declined} />
      </div>
      <div className="flex justify-end">
        <GuestDialog
          weddingId={weddingId}
          functions={functions}
          trigger={<Button size="sm">Add guest</Button>}
        />
      </div>
      <div className="space-y-2">
        {guests.map((guest) => (
          <div key={guest.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{guest.name}</span>
                  {guest.familyGroup && (
                    <span className="text-xs text-muted-foreground">({guest.familyGroup})</span>
                  )}
                  <Badge variant="secondary">{guest.guestCount} guest{guest.guestCount > 1 ? "s" : ""}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {guest.phone ? (
                    <PhoneLink phone={guest.phone} showIcon={false} />
                  ) : (
                    guest.email || "No contact info"
                  )}
                  {guest.functionAttendance.length > 0 &&
                    ` · ${guest.functionAttendance.length} function(s)`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Select
                  key={guest.rsvpStatus}
                  items={RSVP_STATUS_LABELS}
                  defaultValue={guest.rsvpStatus}
                  onValueChange={(next) => {
                    if (!next) return;
                    startTransition(async () => {
                      try {
                        await updateGuestRsvpAction(weddingId, guest.id, next);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to update");
                      }
                    });
                  }}
                >
                  <SelectTrigger disabled={pending} className="w-32" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RSVP_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {RSVP_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <GuestDialog
                  weddingId={weddingId}
                  guest={guest}
                  attendingFunctionIds={guest.functionAttendance.map((f) => f.functionId)}
                  functions={functions}
                  trigger={<Button variant="outline" size="sm">Edit</Button>}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`Remove ${guest.name} from the guest list?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteGuestAction(weddingId, guest.id);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to remove");
                      }
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
        {guests.length === 0 && (
          <p className="text-sm text-muted-foreground">No guests added yet.</p>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
