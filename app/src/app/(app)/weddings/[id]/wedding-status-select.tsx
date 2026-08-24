"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWeddingStatusAction } from "@/lib/actions/weddings";
import { WEDDING_STATUSES, WEDDING_STATUS_LABELS } from "@/lib/wedding-status";
import type { WeddingStatus } from "@/generated/prisma/enums";

export function WeddingStatusSelect({
  weddingId,
  status,
}: {
  weddingId: string;
  status: WeddingStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      items={WEDDING_STATUS_LABELS}
      defaultValue={status}
      onValueChange={(next) => {
        if (!next) return;
        startTransition(async () => {
          try {
            await updateWeddingStatusAction(weddingId, next);
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
        {WEDDING_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {WEDDING_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
