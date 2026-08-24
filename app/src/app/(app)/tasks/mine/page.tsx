import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { serializeDecimals } from "@/lib/serialize";

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [tasks, users, weddings] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToId: session.user.id,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      include: { assignedTo: true, wedding: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }],
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.wedding.findMany({ orderBy: { startDate: "desc" } }),
  ]);

  const now = new Date();

  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < now);
  const dueSoon = tasks.filter(
    (t) => t.dueDate && t.dueDate >= now && t.dueDate < new Date(now.getTime() + 7 * 86400000)
  );
  const highPriority = tasks.filter(
    (t) =>
      (t.priority === "HIGH" || t.priority === "CRITICAL") &&
      !overdue.includes(t) &&
      !dueSoon.includes(t)
  );
  const remaining = tasks.filter(
    (t) => !overdue.includes(t) && !dueSoon.includes(t) && !highPriority.includes(t)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            What needs your attention right now.
          </p>
        </div>
        <TaskDialog
          users={users}
          weddings={serializeDecimals(weddings)}
          trigger={<Button>New task</Button>}
        />
      </div>

      <Section title="Overdue" tasks={overdue} users={users} />
      <Section title="High Priority" tasks={highPriority} users={users} />
      <Section title="Due Soon (7 days)" tasks={dueSoon} users={users} />
      <Section title="Other" tasks={remaining} users={users} />
    </div>
  );
}

function Section({
  title,
  tasks,
  users,
}: {
  title: string;
  tasks: Parameters<typeof TaskList>[0]["tasks"];
  users: Parameters<typeof TaskList>[0]["users"];
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        {title} ({tasks.length})
      </h2>
      <TaskList tasks={tasks} users={users} showWeddingName />
    </div>
  );
}
