import { describe, expect, it } from "vitest";
import { computePaymentStatus } from "@/lib/payment-status";

describe("computePaymentStatus", () => {
  it("returns PAID when paidAmount exactly equals amount", () => {
    expect(computePaymentStatus(1000, 1000, "UPCOMING")).toBe("PAID");
  });

  it("returns PAID when paidAmount overpays the amount", () => {
    expect(computePaymentStatus(1000, 1500, "DUE")).toBe("PAID");
  });

  it("returns PARTIALLY_PAID when paidAmount is between 0 and amount", () => {
    expect(computePaymentStatus(1000, 400, "UPCOMING")).toBe("PARTIALLY_PAID");
  });

  it("returns PARTIALLY_PAID just below the full amount", () => {
    expect(computePaymentStatus(1000, 999.99, "DUE")).toBe("PARTIALLY_PAID");
  });

  it("falls back to currentStatus unchanged when paidAmount is 0", () => {
    expect(computePaymentStatus(1000, 0, "UPCOMING")).toBe("UPCOMING");
    expect(computePaymentStatus(1000, 0, "OVERDUE")).toBe("OVERDUE");
  });

  it("handles decimal/cents edge cases", () => {
    // paise-level rounding: 0.01 short of full amount is still partial
    expect(computePaymentStatus(999.99, 999.98, "DUE")).toBe("PARTIALLY_PAID");
    // exact decimal match is PAID
    expect(computePaymentStatus(999.99, 999.99, "DUE")).toBe("PAID");
    // tiny positive payment is still PARTIALLY_PAID, not treated as 0
    expect(computePaymentStatus(1000, 0.01, "UPCOMING")).toBe("PARTIALLY_PAID");
  });

  it("treats a zero-amount payment as immediately PAID for any non-negative paidAmount", () => {
    expect(computePaymentStatus(0, 0, "UPCOMING")).toBe("PAID");
  });
});
