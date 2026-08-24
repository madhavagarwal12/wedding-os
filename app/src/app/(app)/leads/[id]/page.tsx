import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { serializeDecimals } from "@/lib/serialize";
import { LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { LeadStatusSelect } from "./status-select";
import { ContactAttemptForm } from "./contact-attempt-form";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { EditLeadDialog } from "./edit-lead-dialog";
import { DeleteLeadButton } from "./delete-lead-button";
import { ProposalsSection } from "./proposals-section";
import { NegotiationsSection } from "./negotiations-section";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { CommunicationNotesSection } from "@/components/communication/communication-notes-section";
import { PhoneLink, WhatsAppLink } from "@/components/contact-links";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canDelete = session?.user.role === "OWNER";

  const [lead, users, existingClients] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        contactAttempts: { orderBy: { createdAt: "desc" } },
        proposals: { orderBy: { createdAt: "desc" } },
        negotiations: { orderBy: { createdAt: "desc" } },
        meetings: {
          orderBy: { scheduledAt: "desc" },
          include: { createdBy: { select: { name: true } } },
        },
        communicationNotes: {
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { name: true } } },
        },
        client: true,
      },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["OWNER", "SALES"] } },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!lead) notFound();

  const plainLead = serializeDecimals(lead);
  const isClosed = lead.status === "WON" || lead.status === "LOST";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/leads" className="text-sm text-muted-foreground hover:underline">
            ← All leads
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{lead.leadName}</h1>
          <p className="text-sm text-muted-foreground">
            {lead.primaryContact} · <PhoneLink phone={lead.phone} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LeadStatusSelect key={lead.status} leadId={lead.id} status={lead.status} />
          {!isClosed && (
            <ConvertLeadDialog
              leadId={lead.id}
              leadName={lead.leadName}
              existingClients={existingClients}
            />
          )}
          <EditLeadDialog lead={plainLead} users={users} />
          <DeleteLeadButton leadId={lead.id} />
        </div>
      </div>

      {lead.status === "WON" && lead.client && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <span className="text-sm">
              This lead was converted to client{" "}
              <span className="font-medium">{lead.client.name}</span>.
            </span>
            <Link href={`/clients/${lead.client.id}`}>
              <Button variant="outline" size="sm">
                View client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Lead details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Status">
              <Badge variant="outline">{LEAD_STATUS_LABELS[lead.status]}</Badge>
            </Row>
            <Row label="Phone">
              <PhoneLink phone={lead.phone} />
            </Row>
            <Row label="WhatsApp">
              <WhatsAppLink phone={lead.whatsapp} />
            </Row>
            <Row label="Email">{lead.email || "—"}</Row>
            <Row label="Event date">{formatDate(lead.eventDate)}</Row>
            <Row label="Location">{lead.location || "—"}</Row>
            <Row label="Guests (est.)">{lead.estimatedGuestCount ?? "—"}</Row>
            <Row label="Budget (est.)">{formatCurrency(lead.estimatedBudget)}</Row>
            <Row label="Source">{lead.source || "—"}</Row>
            <Row label="Assigned to">{lead.assignedTo?.name ?? "Unassigned"}</Row>
            <Row label="Next follow-up">{formatDate(lead.nextFollowUpDate)}</Row>
            {lead.lostReason && <Row label="Lost reason">{lead.lostReason}</Row>}
            {lead.requirements && (
              <>
                <Separator />
                <div>
                  <div className="mb-1 text-muted-foreground">Requirements</div>
                  <p className="whitespace-pre-wrap">{lead.requirements}</p>
                </div>
              </>
            )}
            {lead.notes && (
              <>
                <Separator />
                <div>
                  <div className="mb-1 text-muted-foreground">Notes</div>
                  <p className="whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record contact attempt</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactAttemptForm leadId={lead.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.contactAttempts.length === 0 && (
                <p className="text-sm text-muted-foreground">No contact attempts logged yet.</p>
              )}
              {lead.contactAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{attempt.outcome}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(attempt.createdAt)}
                    </span>
                  </div>
                  {attempt.notes && (
                    <p className="mt-1 text-muted-foreground">{attempt.notes}</p>
                  )}
                  {attempt.nextAction && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Next: {attempt.nextAction}
                      {attempt.nextFollowUp && ` · ${formatDate(attempt.nextFollowUp)}`}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <MeetingsSection
                scope={{ type: "lead", id: lead.id }}
                meetings={lead.meetings}
                canDelete={canDelete}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <ProposalsSection
                leadId={lead.id}
                proposals={plainLead.proposals}
                canDelete={canDelete}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Negotiations</CardTitle>
            </CardHeader>
            <CardContent>
              <NegotiationsSection
                leadId={lead.id}
                negotiations={plainLead.negotiations}
                canDelete={canDelete}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Communication log</CardTitle>
            </CardHeader>
            <CardContent>
              <CommunicationNotesSection
                scope={{ type: "lead", id: lead.id }}
                notes={lead.communicationNotes}
              />
            </CardContent>
          </Card>
        </div>
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
