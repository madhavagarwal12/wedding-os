import Link from "next/link";
import { Phone, MapPin, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { VENDOR_CATEGORY_LABELS } from "@/lib/vendor-labels";
import { Pagination, PAGE_SIZE, pageFromSearchParams } from "@/components/pagination";
import { CreateVendorDialog } from "./create-vendor-dialog";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const page = pageFromSearchParams((await searchParams).page);
  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      orderBy: { name: "asc" },
      include: { bookings: true },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.vendor.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            A reusable directory of every vendor the company works with.
          </p>
        </div>
        <CreateVendorDialog />
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No vendors yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 ambient-shadow transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-base font-semibold group-hover:text-primary">
                    {vendor.name}
                  </h3>
                  {vendor.businessName && (
                    <p className="truncate text-xs text-muted-foreground">{vendor.businessName}</p>
                  )}
                </div>
                <Badge
                  className={
                    vendor.status === "ACTIVE"
                      ? "shrink-0 rounded-full bg-primary px-3 py-1 text-[10px] tracking-wider text-primary-foreground uppercase"
                      : "shrink-0 rounded-full bg-muted px-3 py-1 text-[10px] tracking-wider text-muted-foreground uppercase"
                  }
                >
                  {vendor.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </div>

              <Badge className="w-fit rounded-full bg-secondary-container px-2.5 py-0.5 text-[11px] text-on-secondary-container">
                {VENDOR_CATEGORY_LABELS[vendor.category]}
              </Badge>

              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-outline" />
                  {vendor.phone}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-outline" />
                  {vendor.city || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-3.5 text-outline" />
                  {vendor.bookings.length} booking{vendor.bookings.length === 1 ? "" : "s"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination basePath="/vendors" page={page} total={total} />
    </div>
  );
}
