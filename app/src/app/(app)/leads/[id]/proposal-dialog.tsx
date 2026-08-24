"use client";

import { useActionState, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toDateInputValue } from "@/lib/format";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS } from "@/lib/communication-labels";
import {
  createProposalAction,
  updateProposalAction,
  type ActionState,
} from "@/lib/actions/proposals";
import type { ProposalListItem } from "./proposals-section";

const initialState: ActionState = {};

export function ProposalDialog({
  leadId,
  proposal,
  trigger,
}: {
  leadId: string;
  proposal?: ProposalListItem;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!proposal;

  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = isEdit
      ? await updateProposalAction(leadId, proposal!.id, prevState, formData)
      : await createProposalAction(leadId, prevState, formData);
    if (result.success) {
      toast.success(isEdit ? "Proposal updated." : "Proposal added.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const statusItems = Object.fromEntries(
    PROPOSAL_STATUSES.map((status) => [status, PROPOSAL_STATUS_LABELS[status]])
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit proposal" : "Add proposal"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={proposal ? String(proposal.amount) : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid until</Label>
              <Input
                id="validUntil"
                name="validUntil"
                type="date"
                defaultValue={toDateInputValue(proposal?.validUntil)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              items={statusItems}
              defaultValue={proposal?.status ?? "DRAFT"}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPOSAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {PROPOSAL_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Textarea id="scope" name="scope" rows={3} defaultValue={proposal?.scope ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={proposal?.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Add proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
