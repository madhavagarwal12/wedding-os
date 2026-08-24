"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { deleteTimelineItemAction } from "@/lib/actions/weddings";
import { TimelineDialog } from "./timeline-dialog";
import type { FunctionModel, TimelineItemModel } from "@/generated/prisma/models";

export function TimelineSection({
  weddingId,
  items,
  functions,
}: {
  weddingId: string;
  items: TimelineItemModel[];
  functions: FunctionModel[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <TimelineDialog weddingId={weddingId} functions={functions} />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between rounded-md border p-3 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.title}</span>
                <Badge variant="outline">{item.type.replaceAll("_", " ")}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{formatDate(item.date)}</div>
              {item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await deleteTimelineItemAction(weddingId, item.id);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to delete");
                  }
                })
              }
            >
              Delete
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No timeline items yet.</p>
        )}
      </div>
    </div>
  );
}
