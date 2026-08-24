"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { convertLeadAction, type ActionState } from "@/lib/actions/leads";
import type { ClientModel } from "@/generated/prisma/models";

const initialState: ActionState = {};

export function ConvertLeadDialog({
  leadId,
  leadName,
  existingClients,
}: {
  leadId: string;
  leadName: string;
  existingClients: ClientModel[];
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState<string>("__new__");
  const action = convertLeadAction.bind(null, leadId);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Mark Won & convert</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert &quot;{leadName}&quot; to a wedding</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select
              items={{
                __new__: "Create new client",
                ...Object.fromEntries(existingClients.map((c) => [c.id, c.name])),
              }}
              value={clientId}
              onValueChange={(value) => setClientId(value ?? "__new__")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__">Create new client</SelectItem>
                {existingClients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            type="hidden"
            name="clientId"
            value={clientId === "__new__" ? "" : clientId}
          />
          {clientId === "__new__" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newClientName">Client name</Label>
                <Input id="newClientName" name="newClientName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newClientPhone">Client phone</Label>
                <Input id="newClientPhone" name="newClientPhone" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="weddingName">Wedding name</Label>
            <Input id="weddingName" name="weddingName" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Wedding date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectValue">Project value</Label>
              <Input id="projectValue" name="projectValue" type="number" min={0} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryVenue">Primary venue</Label>
            <Input id="primaryVenue" name="primaryVenue" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Converting..." : "Convert to wedding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
