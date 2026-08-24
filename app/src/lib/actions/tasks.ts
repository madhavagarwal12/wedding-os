"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/wedding-status";
import { notifyUser } from "@/lib/actions/notifications";

export type ActionState = { error?: string; success?: boolean };

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  return session;
}

const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  weddingId: z.string().optional(),
  functionId: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

function parseTaskForm(formData: FormData) {
  return taskSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    weddingId: formData.get("weddingId") || undefined,
    functionId: formData.get("functionId") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    startDate: formData.get("startDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createTaskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const task = await prisma.task.create({
    data: {
      name: data.name,
      description: data.description,
      weddingId: data.weddingId || undefined,
      functionId: data.functionId || undefined,
      assignedToId: data.assignedToId || undefined,
      createdById: session.user.id,
      priority: data.priority as never,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      notes: data.notes,
    },
  });

  if (task.assignedToId && task.assignedToId !== session.user.id) {
    await notifyUser({
      userId: task.assignedToId,
      type: "TASK",
      title: `New task assigned: ${task.name}`,
      link: task.weddingId ? `/weddings/${task.weddingId}` : "/tasks/mine",
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/mine");
  if (data.weddingId) revalidatePath(`/weddings/${data.weddingId}`);
  return { success: true };
}

export async function updateTaskAction(
  taskId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireUser();
  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const previous = await prisma.task.findUnique({ where: { id: taskId } });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      name: data.name,
      description: data.description,
      assignedToId: data.assignedToId || null,
      priority: data.priority as never,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes,
    },
  });

  if (task.assignedToId !== previous?.assignedToId) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REASSIGN",
        entityType: "Task",
        entityId: taskId,
        before: { assignedToId: previous?.assignedToId ?? null },
        after: { assignedToId: task.assignedToId },
      },
    });
  }

  if (
    task.assignedToId &&
    task.assignedToId !== previous?.assignedToId &&
    task.assignedToId !== session.user.id
  ) {
    await notifyUser({
      userId: task.assignedToId,
      type: "TASK",
      title: `Task assigned: ${task.name}`,
      link: task.weddingId ? `/weddings/${task.weddingId}` : "/tasks/mine",
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/tasks/mine");
  if (task.weddingId) revalidatePath(`/weddings/${task.weddingId}`);
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const session = await requireUser();
  if (!TASK_STATUSES.includes(status as never)) throw new Error("Invalid status");

  const previous = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: status as never,
      completionDate: status === "COMPLETED" ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "STATUS_CHANGE",
      entityType: "Task",
      entityId: taskId,
      before: { status: previous.status },
      after: { status },
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/tasks/mine");
  if (task.weddingId) revalidatePath(`/weddings/${task.weddingId}`);
}

export async function deleteTaskAction(taskId: string) {
  const session = await requireUser();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (session.user.role !== "OWNER" && task.createdById !== session.user.id) {
    throw new Error("Only the task creator or an Owner can delete this task.");
  }
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/tasks/mine");
  if (task.weddingId) revalidatePath(`/weddings/${task.weddingId}`);
}
