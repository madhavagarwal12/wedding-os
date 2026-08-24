"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/lib/actions/users";

export function ToggleActiveButton({
  userId,
  isActive,
  disabled,
}: {
  userId: string;
  isActive: boolean;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await toggleUserActiveAction(userId);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Something went wrong."
            );
          }
        })
      }
    >
      {pending ? "..." : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
