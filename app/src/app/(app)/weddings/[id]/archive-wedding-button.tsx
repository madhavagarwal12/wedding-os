"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { archiveWeddingAction, restoreWeddingAction } from "@/lib/actions/weddings";

export function ArchiveWeddingButton({
  weddingId,
  archived,
}: {
  weddingId: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className={archived ? undefined : "text-destructive hover:text-destructive"}
      disabled={pending}
      onClick={() => {
        if (
          !archived &&
          !window.confirm("Archive this wedding? It stays searchable but leaves the list views.")
        ) {
          return;
        }
        startTransition(async () => {
          try {
            if (archived) {
              await restoreWeddingAction(weddingId);
              router.refresh();
            } else {
              await archiveWeddingAction(weddingId);
              router.push("/weddings");
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to archive");
          }
        });
      }}
    >
      {pending ? "Working..." : archived ? "Restore" : "Archive"}
    </Button>
  );
}
