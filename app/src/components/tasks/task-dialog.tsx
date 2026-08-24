"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createTaskAction,
  updateTaskAction,
  type ActionState,
} from "@/lib/actions/tasks";
import { toDateInputValue } from "@/lib/format";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/wedding-status";
import type { TaskModel, UserModel, WeddingModel, FunctionModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function TaskDialog({
  task,
  weddingId,
  functionId,
  users,
  weddings,
  functions,
  trigger,
}: {
  task?: TaskModel;
  weddingId?: string;
  functionId?: string;
  users: UserModel[];
  weddings?: WeddingModel[];
  functions?: FunctionModel[];
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!task;

  const [, formAction, pending] = useActionState(async (
    prevState: ActionState,
    formData: FormData
  ) => {
    const result = isEdit
      ? await updateTaskAction(task!.id, prevState, formData)
      : await createTaskAction(prevState, formData);
    if (result.success) {
      toast.success(isEdit ? "Task updated." : "Task created.");
      setOpen(false);
    }
    if (result.error) toast.error(result.error);
    return result;
  }, initialState);

  const weddingItems = Object.fromEntries((weddings ?? []).map((w) => [w.id, w.name]));
  const functionItems = Object.fromEntries((functions ?? []).map((f) => [f.id, f.name]));
  const userItems = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task name</Label>
            <Input id="name" name="name" defaultValue={task?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={task?.description ?? ""} />
          </div>
          {!isEdit && weddings && (
            <div className="space-y-2">
              <Label htmlFor="weddingId">Wedding</Label>
              <Select name="weddingId" items={weddingItems} defaultValue={weddingId}>
                <SelectTrigger id="weddingId">
                  <SelectValue placeholder="No wedding (internal task)" />
                </SelectTrigger>
                <SelectContent>
                  {weddings.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isEdit && functions && functions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="functionId">Function</Label>
              <Select name="functionId" items={functionItems} defaultValue={functionId}>
                <SelectTrigger id="functionId">
                  <SelectValue placeholder="Whole wedding" />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned to</Label>
              <Select name="assignedToId" items={userItems} defaultValue={task?.assignedToId ?? undefined}>
                <SelectTrigger id="assignedToId">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" items={TASK_PRIORITY_LABELS} defaultValue={task?.priority ?? "MEDIUM"}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(task?.startDate)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={toDateInputValue(task?.dueDate)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={task?.notes ?? ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
