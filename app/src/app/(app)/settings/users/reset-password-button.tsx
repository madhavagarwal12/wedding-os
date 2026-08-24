"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetUserPasswordAction } from "@/lib/actions/users";

export function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              `Reset the password for ${userName}? Their current password stops working immediately.`
            )
          ) {
            return;
          }
          startTransition(async () => {
            const result = await resetUserPasswordAction(userId);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            setTemporaryPassword(result.temporaryPassword ?? null);
          });
        }}
      >
        {pending ? "..." : "Reset password"}
      </Button>

      <Dialog
        open={temporaryPassword !== null}
        onOpenChange={(open) => {
          if (!open) setTemporaryPassword(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Temporary password for {userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Share this with {userName} directly. It is shown only once and cannot be
              recovered afterwards — reset again if it is lost.
            </p>
            <code className="block rounded-md border bg-muted px-3 py-2 font-mono text-base break-all">
              {temporaryPassword}
            </code>
            <p className="text-muted-foreground">
              Ask them to change it under Settings → Profile after logging in.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (temporaryPassword) {
                  void navigator.clipboard?.writeText(temporaryPassword);
                  toast.success("Copied to clipboard.");
                }
              }}
            >
              Copy
            </Button>
            <Button onClick={() => setTemporaryPassword(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
