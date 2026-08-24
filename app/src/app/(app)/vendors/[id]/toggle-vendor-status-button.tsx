"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleVendorStatusAction } from "@/lib/actions/vendors";

export function ToggleVendorStatusButton({
  vendorId,
  isActive,
}: {
  vendorId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleVendorStatusAction(vendorId);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update");
          }
        })
      }
    >
      {pending ? "..." : isActive ? "Mark inactive" : "Mark active"}
    </Button>
  );
}
