import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { serializeDecimals } from "@/lib/serialize";
import { VENDOR_CATEGORY_LABELS, VENDOR_BOOKING_STATUS_LABELS } from "@/lib/vendor-labels";
import { PhoneLink, WhatsAppLink } from "@/components/contact-links";
import { EditVendorDialog } from "./edit-vendor-dialog";
import { ToggleVendorStatusButton } from "./toggle-vendor-status-button";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rawVendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        include: { wedding: true, function: true },
      },
    },
  });

  if (!rawVendor) notFound();

  const vendor = serializeDecimals(rawVendor);
  const totalBusinessValue = vendor.bookings.reduce(
    (sum, b) => sum + Number(b.agreedAmount),
    0
  );
  const currentBookings = vendor.bookings.filter(
    (b) => b.status !== "COMPLETED" && b.status !== "CANCELLED"
  );
  const pastBookings = vendor.bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/vendors" className="text-sm text-muted-foreground hover:underline">
            ← All vendors
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{vendor.name}</h1>
          <p className="text-sm text-muted-foreground">
            {VENDOR_CATEGORY_LABELS[vendor.category]} · <PhoneLink phone={vendor.phone} />
          </p>
        </div>
        <div className="flex gap-2">
          <ToggleVendorStatusButton vendorId={vendor.id} isActive={vendor.status === "ACTIVE"} />
          <EditVendorDialog vendor={vendor} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total bookings" value={vendor.bookings.length} />
        <SummaryCard label="Total business value" value={formatCurrency(totalBusinessValue)} />
        <SummaryCard label="Rating" value={vendor.rating ? `${vendor.rating} / 5` : "—"} />
        <SummaryCard label="Status" value={vendor.status === "ACTIVE" ? "Active" : "Inactive"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Business name">{vendor.businessName || "—"}</Row>
            <Row label="Contact person">{vendor.contactPerson || "—"}</Row>
            <Row label="Phone">
              <PhoneLink phone={vendor.phone} />
            </Row>
            <Row label="WhatsApp">
              <WhatsAppLink phone={vendor.whatsapp} />
            </Row>
            <Row label="Email">{vendor.email || "—"}</Row>
            <Row label="City">{vendor.city || "—"}</Row>
            <Row label="Address">{vendor.address || "—"}</Row>
            {vendor.serviceDescription && (
              <div>
                <div className="text-muted-foreground">Service description</div>
                <p className="whitespace-pre-wrap">{vendor.serviceDescription}</p>
              </div>
            )}
            {vendor.pricingNotes && (
              <div>
                <div className="text-muted-foreground">Pricing notes</div>
                <p className="whitespace-pre-wrap">{vendor.pricingNotes}</p>
              </div>
            )}
            {vendor.internalNotes && (
              <div>
                <div className="text-muted-foreground">Internal notes</div>
                <p className="whitespace-pre-wrap">{vendor.internalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current bookings ({currentBookings.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentBookings.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
              {currentBookings.length === 0 && (
                <p className="text-sm text-muted-foreground">No active bookings.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previous weddings ({pastBookings.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pastBookings.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
              {pastBookings.length === 0 && (
                <p className="text-sm text-muted-foreground">No completed bookings yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BookingRow({
  booking,
}: {
  booking: {
    id: string;
    status: keyof typeof VENDOR_BOOKING_STATUS_LABELS;
    agreedAmount: unknown;
    bookingDate: Date | null;
    wedding: { id: string; name: string };
    function: { name: string } | null;
  };
}) {
  return (
    <Link
      href={`/weddings/${booking.wedding.id}`}
      className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
    >
      <div>
        <div className="font-medium">{booking.wedding.name}</div>
        <div className="text-xs text-muted-foreground">
          {booking.function ? `${booking.function.name} · ` : ""}
          {formatDate(booking.bookingDate)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{VENDOR_BOOKING_STATUS_LABELS[booking.status]}</Badge>
        <span className="text-xs text-muted-foreground">
          {formatCurrency(booking.agreedAmount as never)}
        </span>
      </div>
    </Link>
  );
}

function SummaryCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
