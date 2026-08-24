"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { deleteDocumentAction } from "@/lib/actions/documents";
import type { DocumentModel, UserModel } from "@/generated/prisma/models";

type DocumentWithUploader = DocumentModel & { uploadedBy: UserModel };

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  revalidatePathTarget,
}: {
  documents: DocumentWithUploader[];
  revalidatePathTarget: string;
}) {
  const [pending, startTransition] = useTransition();

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <div>
            <a
              href={`/api/documents/${doc.id}`}
              className="font-medium hover:underline"
            >
              {doc.fileName}
            </a>
            <div className="text-xs text-muted-foreground">
              {formatBytes(doc.fileSize)} · Uploaded by {doc.uploadedBy.name} on {formatDate(doc.createdAt)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete "${doc.fileName}"?`)) return;
              startTransition(async () => {
                try {
                  await deleteDocumentAction(doc.id, revalidatePathTarget);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to delete");
                }
              });
            }}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
