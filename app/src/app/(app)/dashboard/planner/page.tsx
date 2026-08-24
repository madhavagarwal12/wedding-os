import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { WEDDING_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/wedding-status";

export default async function PlannerDashboardPage() {
  const session = await auth();
  const userId = session?.user.id;
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [activeWeddings, upcomingFunctions, myOpenTasks, overdueTasksCount, upcomingWeddings] =
    await Promise.all([
      prisma.wedding.count({ where: { status: { notIn: ["CLOSED", "CANCELLED"] } } }),
      prisma.function.count({ where: { date: { gte: now, lte: in30Days } } }),
      userId
        ? prisma.task.count({
            where: { assignedToId: userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
          })
        : Promise.resolve(0),
      prisma.task.count({
        where: { dueDate: { lt: now }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      }),
      prisma.wedding.findMany({
        where: { startDate: { gte: now, lte: in30Days }, status: { notIn: ["CLOSED", "CANCELLED"] } },
        orderBy: { startDate: "asc" },
        take: 10,
        include: { client: true },
      }),
    ]);

  const myTasks = userId
    ? await prisma.task.findMany({
        where: { assignedToId: userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
        orderBy: { dueDate: "asc" },
        take: 10,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Planner Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Active weddings, upcoming functions and your tasks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Weddings" value={activeWeddings} />
        <StatCard label="Functions in 30 days" value={upcomingFunctions} />
        <StatCard label="My Open Tasks" value={myOpenTasks} />
        <StatCard label="Overdue Tasks (team)" value={overdueTasksCount} />
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Weddings in the next 30 days</span>
          <Link href="/weddings/upcoming" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {upcomingWeddings.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">Nothing coming up.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wedding</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingWeddings.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">
                    <Link href={`/weddings/${w.id}`} className="hover:underline">
                      {w.name}
                    </Link>
                  </TableCell>
                  <TableCell>{w.client.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{WEDDING_STATUS_LABELS[w.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(w.startDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">My tasks</span>
          <Link href="/tasks/mine" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {myTasks.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">No open tasks assigned to you.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(t.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
