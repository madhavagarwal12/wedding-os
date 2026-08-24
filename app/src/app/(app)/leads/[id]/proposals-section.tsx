"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { PROPOSAL_STATUS_LABELS } from "@/lib/communication-labels";
import { deleteProposalAction } from "@/lib/actions/proposals";
import { ProposalDialog } from "./proposal-dialog";
import type { ProposalModel } from "@/generated/prisma/models";

export type ProposalListItem = ProposalModel;

export function ProposalsSection({
  leadId,
  proposals,
  canDelete = false,
}: {
  leadId: string;
  proposals: ProposalListItem[];
  canDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ProposalDialog leadId={leadId} trigger={<Button size="sm">Add proposal</Button>} />
      </div>
      <div className="space-y-2">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(proposal.amount)}</span>
                <Badge variant="outline">{PROPOSAL_STATUS_LABELS[proposal.status]}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <ProposalDialog
                  leadId={leadId}
                  proposal={proposal}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await deleteProposalAction(leadId, proposal.id);
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
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Sent {formatDate(proposal.proposalDate)}
              {proposal.validUntil && ` · valid until ${formatDate(proposal.validUntil)}`}
            </div>
            {proposal.scope && <p className="mt-1 whitespace-pre-wrap">{proposal.scope}</p>}
            {proposal.notes && (
              <p className="mt-1 text-muted-foreground">{proposal.notes}</p>
            )}
          </div>
        ))}
        {proposals.length === 0 && (
          <p className="text-sm text-muted-foreground">No proposals yet.</p>
        )}
      </div>
    </div>
  );
}
