import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { Pagination, PAGE_SIZE, pageFromSearchParams } from "@/components/pagination";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const page = pageFromSearchParams((await searchParams).page);
  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Every recorded mutation and login attempt, most recent first.
        </p>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
                <TableCell>{entry.user?.name ?? "System"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{entry.action}</Badge>
                </TableCell>
                <TableCell>{entry.entityType}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {entry.entityId}
                </TableCell>
                <TableCell>
                  {entry.before === null && entry.after === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <details>
                      <summary className="cursor-pointer text-sm text-primary">View</summary>
                      <pre className="mt-2 max-w-[32rem] overflow-x-auto rounded-md bg-muted p-3 text-xs">
                        {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
                      </pre>
                    </details>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No audit entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination basePath="/settings/audit-log" page={page} total={total} />
    </div>
  );
}
