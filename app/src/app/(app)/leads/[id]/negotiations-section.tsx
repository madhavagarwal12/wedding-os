"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  createNegotiationAction,
  deleteNegotiationAction,
  type ActionState,
} from "@/lib/actions/negotiations";
import type { NegotiationModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export type NegotiationListItem = NegotiationModel;

function NegotiationDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = await createNegotiationAction(leadId, prevState, formData);
    if (result.success) {
      toast.success("Negotiation recorded.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Record negotiation</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record negotiation</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalValue">Original</Label>
              <Input
                id="originalValue"
                name="originalValue"
                type="number"
                min={0}
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisedValue">Revised</Label>
              <Input id="revisedValue" name="revisedValue" type="number" min={0} step="0.01" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalValue">Final</Label>
              <Input id="finalValue" name="finalValue" type="number" min={0} step="0.01" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="decisionDate">Decision date</Label>
            <Input id="decisionDate" name="decisionDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NegotiationsSection({
  leadId,
  negotiations,
  canDelete = false,
}: {
  leadId: string;
  negotiations: NegotiationListItem[];
  canDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <NegotiationDialog leadId={leadId} />
      </div>
      <div className="space-y-2">
        {negotiations.map((negotiation) => (
          <div key={negotiation.id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {formatCurrency(negotiation.originalValue)}
                {negotiation.revisedValue !== null &&
                  ` → ${formatCurrency(negotiation.revisedValue)}`}
                {negotiation.finalValue !== null &&
                  ` → ${formatCurrency(negotiation.finalValue)} final`}
              </span>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteNegotiationAction(leadId, negotiation.id);
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "Failed to delete"
                        );
                      }
                    })
                  }
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Recorded {formatDate(negotiation.createdAt)}
              {negotiation.decisionDate &&
                ` · decision ${formatDate(negotiation.decisionDate)}`}
            </div>
            {negotiation.notes && (
              <p className="mt-1 whitespace-pre-wrap">{negotiation.notes}</p>
            )}
          </div>
        ))}
        {negotiations.length === 0 && (
          <p className="text-sm text-muted-foreground">No negotiations recorded yet.</p>
        )}
      </div>
    </div>
  );
}
