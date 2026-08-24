"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTeamMemberAction, removeTeamMemberAction } from "@/lib/actions/weddings";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import type { UserModel } from "@/generated/prisma/models";

export function TeamSection({
  weddingId,
  members,
  allUsers,
}: {
  weddingId: string;
  members: UserModel[];
  allUsers: UserModel[];
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
            <div>
              <span className="font-medium">{member.name}</span>{" "}
              <Badge variant="outline" className="ml-1">
                {ROLE_LABELS[member.role as Role]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await removeTeamMemberAction(weddingId, member.id);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to remove");
                  }
                })
              }
            >
              Remove
            </Button>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
        )}
      </div>
      {availableUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <Select
            items={Object.fromEntries(
              availableUsers.map((u) => [u.id, `${u.name} · ${ROLE_LABELS[u.role as Role]}`])
            )}
            value={selected}
            onValueChange={(v) => setSelected(v ?? "")}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add team member" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {ROLE_LABELS[u.role as Role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selected || pending}
            onClick={() =>
              startTransition(async () => {
                await addTeamMemberAction(weddingId, selected);
                setSelected("");
              })
            }
          >
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
