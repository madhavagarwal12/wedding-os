"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaskStatusAction, deleteTaskAction } from "@/lib/actions/tasks";
import { formatDate } from "@/lib/format";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from "@/lib/wedding-status";
import { TaskDialog } from "./task-dialog";
import type { TaskModel, UserModel } from "@/generated/prisma/models";
import type { TaskPriority } from "@/generated/prisma/enums";

type TaskWithAssignee = TaskModel & { assignedTo: UserModel | null };

const PRIORITY_VARIANT: Record<TaskPriority, "default" | "secondary" | "outline" | "destructive"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  CRITICAL: "destructive",
};

export function TaskList({
  tasks,
  users,
  showWeddingName = false,
}: {
  tasks: (TaskWithAssignee & { wedding?: { name: string } | null })[];
  users: UserModel[];
  showWeddingName?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks here.</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const overdue =
          task.dueDate &&
          task.dueDate < new Date() &&
          task.status !== "COMPLETED" &&
          task.status !== "CANCELLED";
        return (
          <div key={task.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{task.name}</span>
                  <Badge variant={PRIORITY_VARIANT[task.priority]}>
                    {TASK_PRIORITY_LABELS[task.priority]}
                  </Badge>
                  {overdue && <Badge variant="destructive">Overdue</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {task.assignedTo?.name ?? "Unassigned"}
                  {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                  {showWeddingName && task.wedding && ` · ${task.wedding.name}`}
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Select
                  key={task.status}
                  items={TASK_STATUS_LABELS}
                  defaultValue={task.status}
                  onValueChange={(next) => {
                    if (!next) return;
                    startTransition(async () => {
                      try {
                        await updateTaskStatusAction(task.id, next);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to update");
                      }
                    });
                  }}
                >
                  <SelectTrigger disabled={pending} className="w-40" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {TASK_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TaskDialog
                  task={task}
                  users={users}
                  trigger={
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`Delete task "${task.name}"?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteTaskAction(task.id);
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Failed to delete");
                      }
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
