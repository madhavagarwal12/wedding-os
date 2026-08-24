"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  deleteVendorBookingAction,
  updateVendorBookingStatusAction,
} from "@/lib/actions/vendors";
import {
  VENDOR_BOOKING_STATUSES,
  VENDOR_BOOKING_STATUS_LABELS,
  VENDOR_CATEGORY_LABELS,
} from "@/lib/vendor-labels";
import { VendorBookingDialog } from "./vendor-booking-dialog";
import type {
  FunctionModel,
  VendorBookingModel,
  VendorModel,
} from "@/generated/prisma/models";

type BookingWithVendor = VendorBookingModel & {
  vendor: VendorModel;
  function: FunctionModel | null;
};

export function VendorBookingsSection({
  weddingId,
  bookings,
  vendors,
  functions,
}: {
  weddingId: string;
  bookings: BookingWithVendor[];
  vendors: VendorModel[];
  functions: FunctionModel[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <VendorBookingDialog weddingId={weddingId} vendors={vendors} functions={functions} />
      </div>
      <div className="space-y-2">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/vendors/${booking.vendorId}`} className="font-medium hover:underline">
                  {booking.vendor.name}
                </Link>{" "}
                <Badge variant="outline">{VENDOR_CATEGORY_LABELS[booking.vendor.category]}</Badge>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {booking.function ? `${booking.function.name} · ` : "Whole wedding · "}
                  {booking.service || "No service specified"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(booking.agreedAmount)}
                  {booking.advanceAmount ? ` (advance ${formatCurrency(booking.advanceAmount)})` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Select
                  key={booking.status}
                  items={VENDOR_BOOKING_STATUS_LABELS}
                  defaultValue={booking.status}
                  onValueChange={(next) => {
                    if (!next) return;
                    startTransition(async () => {
                      try {
                        await updateVendorBookingStatusAction(weddingId, booking.id, next);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to update");
                      }
                    });
                  }}
                >
                  <SelectTrigger disabled={pending} className="w-44" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_BOOKING_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {VENDOR_BOOKING_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`Remove ${booking.vendor.name} from this wedding?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteVendorBookingAction(weddingId, booking.id);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to remove");
                      }
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <p className="text-sm text-muted-foreground">No vendors booked yet.</p>
        )}
      </div>
    </div>
  );
}
