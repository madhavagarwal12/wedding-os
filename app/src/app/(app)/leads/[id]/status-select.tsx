"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLeadStatusAction } from "@/lib/actions/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/lead-status";
import type { LeadStatus } from "@/generated/prisma/enums";

export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      items={LEAD_STATUS_LABELS}
      value={value}
      onValueChange={(next) => {
        const nextStatus = next as LeadStatus;
        if (nextStatus === "LOST") {
          const reason = window.prompt("Reason for marking this lead lost?") ?? "";
          setValue(nextStatus);
          startTransition(async () => {
            try {
              await updateLeadStatusAction(leadId, nextStatus, reason);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Failed to update status");
            }
          });
          return;
        }
        setValue(nextStatus);
        startTransition(async () => {
          try {
            await updateLeadStatusAction(leadId, nextStatus);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update status");
          }
        });
      }}
    >
      <SelectTrigger disabled={pending} className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
