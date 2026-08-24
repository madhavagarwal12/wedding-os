import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: true },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Every document uploaded across leads, clients, weddings and vendors.
          Upload new documents from the relevant record&apos;s Documents tab.
        </p>
      </div>

      <div className="rounded-lg border bg-background p-4">
        <DocumentList documents={documents} revalidatePathTarget="/documents" />
      </div>
    </div>
  );
}
