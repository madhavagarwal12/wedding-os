import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CAN_VIEW_FINANCE, type Role } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { serializeDecimals } from "@/lib/serialize";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { WeddingStatusSelect } from "./wedding-status-select";
import { EditWeddingDialog } from "./edit-wedding-dialog";
import { ArchiveWeddingButton } from "./archive-wedding-button";
import { TeamSection } from "./team-section";
import { FunctionsSection } from "./functions-section";
import { TimelineSection } from "./timeline-section";
import { VendorBookingsSection } from "./vendor-bookings-section";
import { BudgetSection } from "./budget-section";
import { ClientPaymentsSection } from "./client-payments-section";
import { VendorPaymentsSection } from "./vendor-payments-section";
import { GuestsSection } from "./guests-section";
import { DocumentUploadDialog } from "./document-upload-dialog";
import { DocumentList } from "@/components/documents/document-list";
import { MeetingsSection } from "@/components/meetings/meetings-section";
import { CommunicationNotesSection } from "@/components/communication/communication-notes-section";
import { PhoneLink, WhatsAppLink } from "@/components/contact-links";

export default async function WeddingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const canViewFinance = Boolean(
    session?.user && CAN_VIEW_FINANCE.includes(session.user.role as Role)
  );

  const [rawWedding, clients, allUsers, vendors] = await Promise.all([
    prisma.wedding.findUnique({
      where: { id },
      include: {
        client: true,
        projectManager: true,
        team: { include: { user: true } },
        functions: { orderBy: { date: "asc" } },
        tasks: { include: { assignedTo: true }, orderBy: { createdAt: "desc" } },
        timelineItems: { orderBy: { date: "asc" } },
        vendorBookings: {
          orderBy: { createdAt: "desc" },
          include: { vendor: true, function: true },
        },
        guests: {
          orderBy: { name: "asc" },
          include: { functionAttendance: true },
        },
        budgetItems: { orderBy: { category: "asc" } },
        clientPayments: { orderBy: { dueDate: "asc" } },
        vendorPayments: {
          orderBy: { dueDate: "asc" },
          include: { vendorBooking: { include: { vendor: true } } },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: true },
        },
        meetings: {
          orderBy: { scheduledAt: "desc" },
          include: { createdBy: { select: { name: true } } },
        },
        communicationNotes: {
          orderBy: { createdAt: "desc" },
          include: { createdBy: { select: { name: true } } },
        },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  if (!rawWedding) notFound();

  const wedding = serializeDecimals(rawWedding);
  const teamMembers = wedding.team.map((t) => t.user);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/weddings" className="text-sm text-muted-foreground hover:underline">
            ← All weddings
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{wedding.name}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/clients/${wedding.clientId}`} className="hover:underline">
              {wedding.client.name}
            </Link>{" "}
            · {formatDate(wedding.startDate)}
            {wedding.primaryVenue && ` · ${wedding.primaryVenue}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeddingStatusSelect key={wedding.status} weddingId={wedding.id} status={wedding.status} />
          <EditWeddingDialog wedding={wedding} clients={clients} users={allUsers} />
          {session?.user.role === "OWNER" && (
            <ArchiveWeddingButton weddingId={wedding.id} archived={!!wedding.archivedAt} />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Project value" value={formatCurrency(wedding.projectValue)} />
        <SummaryCard label="Guests (est.)" value={wedding.estimatedGuestCount ?? "—"} />
        <SummaryCard label="Functions" value={wedding.functions.length} />
        <SummaryCard label="Project manager" value={wedding.projectManager?.name ?? "Unassigned"} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="guests">Guests</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          {canViewFinance && <TabsTrigger value="finance">Finance</TabsTrigger>}
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wedding information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Bride">{wedding.brideName || "—"}</Row>
              <Row label="Groom">{wedding.groomName || "—"}</Row>
              <Row label="Primary contact">{wedding.primaryContact || "—"}</Row>
              <Row label="Client phone">
                <PhoneLink phone={wedding.client.phone} />
              </Row>
              <Row label="Client WhatsApp">
                <WhatsAppLink phone={wedding.client.whatsapp} />
              </Row>
              <Row label="City / State">
                {[wedding.city, wedding.state].filter(Boolean).join(", ") || "—"}
              </Row>
              <Row label="Wedding date">{formatDate(wedding.startDate)}</Row>
              <Row label="End date">{formatDate(wedding.endDate)}</Row>
              {wedding.notes && (
                <div className="sm:col-span-2">
                  <div className="mb-1 text-muted-foreground">Notes</div>
                  <p className="whitespace-pre-wrap">{wedding.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="mt-4">
          <FunctionsSection weddingId={wedding.id} functions={wedding.functions} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <TaskDialog
              weddingId={wedding.id}
              users={allUsers}
              weddings={[wedding]}
              functions={wedding.functions}
              trigger={<Button size="sm">New task</Button>}
            />
          </div>
          <TaskList tasks={wedding.tasks} users={allUsers} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamSection weddingId={wedding.id} members={teamMembers} allUsers={allUsers} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineSection
            weddingId={wedding.id}
            items={wedding.timelineItems}
            functions={wedding.functions}
          />
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <VendorBookingsSection
            weddingId={wedding.id}
            bookings={wedding.vendorBookings}
            vendors={vendors}
            functions={wedding.functions}
          />
        </TabsContent>
        <TabsContent value="guests" className="mt-4">
          <GuestsSection weddingId={wedding.id} guests={wedding.guests} functions={wedding.functions} />
        </TabsContent>
        <TabsContent value="communication" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meetings</CardTitle>
            </CardHeader>
            <CardContent>
              <MeetingsSection
                scope={{ type: "wedding", id: wedding.id }}
                meetings={wedding.meetings}
                canDelete={session?.user.role === "OWNER"}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Communication log</CardTitle>
            </CardHeader>
            <CardContent>
              <CommunicationNotesSection
                scope={{ type: "wedding", id: wedding.id }}
                notes={wedding.communicationNotes}
              />
            </CardContent>
          </Card>
        </TabsContent>
        {canViewFinance && (
          <TabsContent value="finance" className="mt-4 space-y-6">
            <FinancialSummary wedding={wedding} />
            <div>
              <h3 className="mb-2 text-sm font-medium">Budget</h3>
              <BudgetSection weddingId={wedding.id} items={wedding.budgetItems} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Client Payments</h3>
              <ClientPaymentsSection weddingId={wedding.id} payments={wedding.clientPayments} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Vendor Payments</h3>
              <VendorPaymentsSection
                weddingId={wedding.id}
                payments={wedding.vendorPayments}
                bookings={wedding.vendorBookings}
              />
            </div>
          </TabsContent>
        )}
        <TabsContent value="documents" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <DocumentUploadDialog
              ownerType="WEDDING"
              ownerId={wedding.id}
              revalidatePathTarget={`/weddings/${wedding.id}`}
            />
          </div>
          <DocumentList
            documents={wedding.documents}
            revalidatePathTarget={`/weddings/${wedding.id}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinancialSummary({
  wedding,
}: {
  wedding: {
    projectValue: unknown;
    budgetItems: { plannedAmount: unknown; committedAmount: unknown; actualAmount: unknown }[];
    clientPayments: { amount: unknown; paidAmount: unknown }[];
    vendorPayments: { amount: unknown; paidAmount: unknown }[];
  };
}) {
  const contractValue = Number(wedding.projectValue);
  const plannedCost = wedding.budgetItems.reduce((s, b) => s + Number(b.plannedAmount), 0);
  const actualCost = wedding.budgetItems.reduce((s, b) => s + Number(b.actualAmount), 0);
  const receivedFromClient = wedding.clientPayments.reduce((s, p) => s + Number(p.paidAmount), 0);
  const totalScheduledFromClient = wedding.clientPayments.reduce((s, p) => s + Number(p.amount), 0);
  const outstandingFromClient = totalScheduledFromClient - receivedFromClient;
  const paidToVendors = wedding.vendorPayments.reduce((s, p) => s + Number(p.paidAmount), 0);
  const totalScheduledToVendors = wedding.vendorPayments.reduce((s, p) => s + Number(p.amount), 0);
  const outstandingToVendors = totalScheduledToVendors - paidToVendors;
  const estimatedProfit = contractValue - plannedCost;
  const actualProfit = contractValue - actualCost;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard label="Contract value" value={formatCurrency(contractValue)} />
      <SummaryCard label="Total planned cost" value={formatCurrency(plannedCost)} />
      <SummaryCard label="Total actual cost" value={formatCurrency(actualCost)} />
      <SummaryCard label="Received from client" value={formatCurrency(receivedFromClient)} />
      <SummaryCard label="Outstanding from client" value={formatCurrency(outstandingFromClient)} />
      <SummaryCard label="Paid to vendors" value={formatCurrency(paidToVendors)} />
      <SummaryCard label="Outstanding to vendors" value={formatCurrency(outstandingToVendors)} />
      <SummaryCard
        label="Estimated / Actual profit"
        value={`${formatCurrency(estimatedProfit)} / ${formatCurrency(actualProfit)}`}
      />
    </div>
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
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
