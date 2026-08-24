"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  deleteClientPaymentAction,
  recordClientPaymentAction,
  updateClientPaymentStatusAction,
} from "@/lib/actions/finance";
import { CLIENT_PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/finance-labels";
import { ClientPaymentDialog } from "./client-payment-dialog";
import { RecordPaymentDialog } from "./record-payment-dialog";
import type { ClientPaymentModel } from "@/generated/prisma/models";

export function ClientPaymentsSection({
  weddingId,
  payments,
}: {
  weddingId: string;
  payments: ClientPaymentModel[];
}) {
  const [pending, startTransition] = useTransition();

  const totalDue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.paidAmount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {formatCurrency(totalPaid)} received of {formatCurrency(totalDue)} scheduled
        </span>
        <ClientPaymentDialog weddingId={weddingId} />
      </div>
      <div className="space-y-2">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  {payment.paymentType && (
                    <span className="text-xs text-muted-foreground">({payment.paymentType})</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Due {formatDate(payment.dueDate)} · Paid {formatCurrency(payment.paidAmount)}
                  {payment.paymentMethod && ` · ${payment.paymentMethod}`}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Select
                  key={payment.status}
                  items={PAYMENT_STATUS_LABELS}
                  defaultValue={payment.status}
                  onValueChange={(next) => {
                    if (!next) return;
                    startTransition(async () => {
                      try {
                        await updateClientPaymentStatusAction(weddingId, payment.id, next);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to update");
                      }
                    });
                  }}
                >
                  <SelectTrigger disabled={pending} className="w-36" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PAYMENT_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <RecordPaymentDialog
                  action={recordClientPaymentAction.bind(null, weddingId, payment.id)}
                  currentPaidAmount={Number(payment.paidAmount)}
                  trigger={<Button variant="outline" size="sm">Record</Button>}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await deleteClientPaymentAction(weddingId, payment.id);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to delete");
                      }
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
        {payments.length === 0 && (
          <p className="text-sm text-muted-foreground">No payments scheduled yet.</p>
        )}
      </div>
    </div>
  );
}
