"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteLeadAction } from "@/lib/actions/leads";

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this lead permanently?")) return;
        startTransition(async () => {
          try {
            await deleteLeadAction(leadId);
            router.push("/leads");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete");
          }
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
