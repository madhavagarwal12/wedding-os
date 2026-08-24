import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { serializeDecimals } from "@/lib/serialize";
import { Pagination, PAGE_SIZE, pageFromSearchParams } from "@/components/pagination";

export default async function TeamTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const page = pageFromSearchParams((await searchParams).page);
  const [tasks, total, users, weddings] = await Promise.all([
    prisma.task.findMany({
      include: { assignedTo: true, wedding: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.task.count(),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.wedding.findMany({ where: { archivedAt: null }, orderBy: { startDate: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team Tasks</h1>
          <p className="text-sm text-muted-foreground">
            All tasks across the team, {total} total.
          </p>
        </div>
        <TaskDialog
          users={users}
          weddings={serializeDecimals(weddings)}
          trigger={<Button>New task</Button>}
        />
      </div>
      <TaskList tasks={tasks} users={users} showWeddingName />

      <Pagination basePath="/tasks" page={page} total={total} />
    </div>
  );
}
