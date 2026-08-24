import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { EditClientDialog } from "./edit-client-dialog";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { CommunicationNotesSection } from "@/components/communication/communication-notes-section";
import { PhoneLink, WhatsAppLink } from "@/components/contact-links";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      weddings: { orderBy: { startDate: "desc" } },
      meetings: {
        orderBy: { scheduledAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
      communicationNotes: {
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });

  if (!client) notFound();

  const totalValue = client.weddings.reduce(
    (sum, w) => sum + Number(w.projectValue),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm text-muted-foreground hover:underline">
            ← All clients
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            <PhoneLink phone={client.phone} />
          </p>
        </div>
        <EditClientDialog client={client} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Phone">
              <PhoneLink phone={client.phone} />
            </Row>
            <Row label="WhatsApp">
              <WhatsAppLink phone={client.whatsapp} />
            </Row>
            <Row label="Email">{client.email || "—"}</Row>
            <Row label="Address">{client.address || "—"}</Row>
            {client.familyInfo && (
              <div>
                <div className="text-muted-foreground">Family information</div>
                <p className="whitespace-pre-wrap">{client.familyInfo}</p>
              </div>
            )}
            {client.notes && (
              <div>
                <div className="text-muted-foreground">Notes</div>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Weddings ({client.weddings.length}) · {formatCurrency(totalValue)} total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.weddings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No weddings yet for this client.
              </p>
            )}
            {client.weddings.map((wedding) => (
              <Link
                key={wedding.id}
                href={`/weddings/${wedding.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
              >
                <div>
                  <div className="font-medium">{wedding.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(wedding.startDate)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{wedding.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(wedding.projectValue)}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingsSection
              scope={{ type: "client", id: client.id }}
              meetings={client.meetings}
              canDelete={session?.user.role === "OWNER"}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Communication log</CardTitle>
          </CardHeader>
          <CardContent>
            <CommunicationNotesSection
              scope={{ type: "client", id: client.id }}
              notes={client.communicationNotes}
            />
          </CardContent>
        </Card>
      </div>
    </div>
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
