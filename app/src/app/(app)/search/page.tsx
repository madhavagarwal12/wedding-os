import * as React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">
          Use the search box in the top bar to find leads, clients, weddings and vendors.
        </p>
      </div>
    );
  }

  const [leads, clients, weddings, vendors] = await Promise.all([
    prisma.lead.findMany({
      where: {
        OR: [
          { leadName: { contains: query, mode: "insensitive" } },
          { primaryContact: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
    prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
    prisma.wedding.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { brideName: { contains: query, mode: "insensitive" } },
          { groomName: { contains: query, mode: "insensitive" } },
          { primaryVenue: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { client: true },
      take: 20,
    }),
    prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { businessName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
    }),
  ]);

  const totalResults = leads.length + clients.length + weddings.length + vendors.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Search results for &ldquo;{query}&rdquo;</h1>
        <p className="text-sm text-muted-foreground">{totalResults} results</p>
      </div>

      <ResultSection title="Leads">
        {leads.map((l) => (
          <ResultRow key={l.id} href={`/leads/${l.id}`} title={l.leadName} subtitle={l.phone} />
        ))}
      </ResultSection>

      <ResultSection title="Clients">
        {clients.map((c) => (
          <ResultRow key={c.id} href={`/clients/${c.id}`} title={c.name} subtitle={c.phone} />
        ))}
      </ResultSection>

      <ResultSection title="Weddings">
        {weddings.map((w) => (
          <ResultRow
            key={w.id}
            href={`/weddings/${w.id}`}
            title={w.name}
            subtitle={`${w.client.name} · ${formatDate(w.startDate)}`}
          />
        ))}
      </ResultSection>

      <ResultSection title="Vendors">
        {vendors.map((v) => (
          <ResultRow key={v.id} href={`/vendors/${v.id}`} title={v.name} subtitle={v.phone} />
        ))}
      </ResultSection>

      {totalResults === 0 && (
        <p className="text-sm text-muted-foreground">No matches found.</p>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background">
      <div className="border-b p-3 text-sm font-medium">{title}</div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function ResultRow({ href, title, subtitle }: { href: string; title: string; subtitle?: string | null }) {
  return (
    <Link href={href} className="block px-3 py-2 text-sm hover:bg-muted/50">
      <div className="font-medium">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </Link>
  );
}
