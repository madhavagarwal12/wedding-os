/**
 * Pure payment-status computation shared by client and vendor payment
 * recording actions (see `src/lib/actions/finance.ts`). Kept side-effect
 * free and framework-independent so it can be unit tested without a
 * database or Next.js request context.
 */
export function computePaymentStatus(
  amount: number,
  paidAmount: number,
  currentStatus: string
): string {
  if (paidAmount >= amount) return "PAID";
  if (paidAmount > 0) return "PARTIALLY_PAID";
  return currentStatus;
}
