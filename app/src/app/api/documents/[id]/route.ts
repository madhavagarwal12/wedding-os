import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readStoredFile(document.filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": document.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      },
    });
  } catch {
    return new NextResponse("File not found on disk", { status: 404 });
  }
}
