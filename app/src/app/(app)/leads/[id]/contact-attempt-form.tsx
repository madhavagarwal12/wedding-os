"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  recordContactAttemptAction,
  type ActionState,
} from "@/lib/actions/leads";

const initialState: ActionState = {};

export function ContactAttemptForm({ leadId }: { leadId: string }) {
  const action = recordContactAttemptAction.bind(null, leadId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success("Contact attempt recorded.");
      formRef.current?.reset();
    }
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="outcome">Outcome</Label>
        <Input
          id="outcome"
          name="outcome"
          placeholder="e.g. Spoke on call, interested"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="nextAction">Next action</Label>
          <Input id="nextAction" name="nextAction" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextFollowUp">Next follow-up</Label>
          <Input id="nextFollowUp" name="nextFollowUp" type="date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Log contact"}
      </Button>
    </form>
  );
}
