import Link from "next/link";
import { Mail, Phone, Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Pagination, PAGE_SIZE, pageFromSearchParams } from "@/components/pagination";
import { CreateClientDialog } from "./create-client-dialog";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const page = pageFromSearchParams((await searchParams).page);
  const where = { archivedAt: null };
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { weddings: true },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Families and clients the company has worked with.
          </p>
        </div>
        <CreateClientDialog />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No clients yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5 ambient-shadow transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-semibold text-on-primary-container">
                  {initials(client.name) || "?"}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-heading text-base font-semibold group-hover:text-primary">
                    {client.name}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="size-3" />
                    {client.weddings.length} wedding{client.weddings.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-outline" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Mail className="size-3.5 shrink-0 text-outline" />
                  <span className="truncate">{client.email || "—"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination basePath="/clients" page={page} total={total} />
    </div>
  );
}
