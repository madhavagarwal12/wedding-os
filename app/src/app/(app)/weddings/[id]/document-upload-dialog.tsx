"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { uploadDocumentAction, type ActionState } from "@/lib/actions/documents";

const initialState: ActionState = {};

export function DocumentUploadDialog({
  ownerType,
  ownerId,
  revalidatePathTarget,
}: {
  ownerType: "WEDDING" | "LEAD" | "CLIENT" | "VENDOR" | "TASK";
  ownerId: string;
  revalidatePathTarget: string;
}) {
  const [open, setOpen] = useState(false);
  const action = uploadDocumentAction.bind(null, ownerType, ownerId, revalidatePathTarget);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await action(prevState, formData);
    if (result.success) {
      toast.success("Document uploaded.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Upload document</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
              required
            />
            <p className="text-xs text-muted-foreground">Max 20MB.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
