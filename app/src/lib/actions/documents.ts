"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, deleteStoredFile } from "@/lib/storage";

export type ActionState = { error?: string; success?: boolean };

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",
  "text/plain",
];

const ALLOWED_TYPES_LABEL = "PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, CSV or TXT";

type OwnerType =
  | "LEAD"
  | "CLIENT"
  | "WEDDING"
  | "FUNCTION"
  | "VENDOR"
  | "VENDOR_BOOKING"
  | "CLIENT_PAYMENT"
  | "VENDOR_PAYMENT"
  | "TASK";

const OWNER_FIELD: Record<OwnerType, string> = {
  LEAD: "leadId",
  CLIENT: "clientId",
  WEDDING: "weddingId",
  FUNCTION: "functionId",
  VENDOR: "vendorId",
  VENDOR_BOOKING: "vendorBookingId",
  CLIENT_PAYMENT: "clientPaymentId",
  VENDOR_PAYMENT: "vendorPaymentId",
  TASK: "taskId",
};

export async function uploadDocumentAction(
  ownerType: OwnerType,
  ownerId: string,
  revalidatePathTarget: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large (max 20MB)." };
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!file.name.includes(".") || !ALLOWED_EXTENSIONS.includes(extension)) {
    return { error: `That file type is not allowed. Upload a ${ALLOWED_TYPES_LABEL} file.` };
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: `That file type is not allowed. Upload a ${ALLOWED_TYPES_LABEL} file.` };
  }

  const storedName = await saveUploadedFile(file);

  const document = await prisma.document.create({
    data: {
      fileName: file.name,
      filePath: storedName,
      fileType: file.type || undefined,
      fileSize: file.size,
      ownerType,
      uploadedById: session.user.id,
      [OWNER_FIELD[ownerType]]: ownerId,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "UPLOAD",
      entityType: "Document",
      entityId: document.id,
      after: {
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        ownerType,
        ownerId,
      },
    },
  });

  revalidatePath(revalidatePathTarget);
  revalidatePath("/documents");
  return { success: true };
}

export async function deleteDocumentAction(
  documentId: string,
  revalidatePathTarget: string
) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  if (session.user.role !== "OWNER" && document.uploadedById !== session.user.id) {
    throw new Error("Only the uploader or an Owner can delete this document.");
  }

  await prisma.document.delete({ where: { id: documentId } });
  await deleteStoredFile(document.filePath);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "Document",
      entityId: documentId,
      before: {
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        ownerType: document.ownerType,
      },
    },
  });

  revalidatePath(revalidatePathTarget);
  revalidatePath("/documents");
}
