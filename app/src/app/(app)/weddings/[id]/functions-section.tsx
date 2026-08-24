"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { deleteFunctionAction } from "@/lib/actions/weddings";
import { FunctionDialog } from "./function-dialog";
import type { FunctionModel } from "@/generated/prisma/models";

export function FunctionsSection({
  weddingId,
  functions,
}: {
  weddingId: string;
  functions: FunctionModel[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <FunctionDialog
          weddingId={weddingId}
          trigger={<Button size="sm">Add function</Button>}
        />
      </div>
      <div className="space-y-2">
        {functions.map((fn) => (
          <div key={fn.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{fn.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(fn.date)}
                  {fn.venue && ` · ${fn.venue}`}
                  {fn.guestCount ? ` · ${fn.guestCount} guests` : ""}
                </div>
                {fn.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{fn.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <FunctionDialog
                  weddingId={weddingId}
                  fn={fn}
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
                    if (!window.confirm(`Delete "${fn.name}"?`)) return;
                    startTransition(async () => {
                      try {
                        await deleteFunctionAction(weddingId, fn.id);
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
        ))}
        {functions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No functions yet. Add Haldi, Sangeet, Wedding, Reception, etc.
          </p>
        )}
      </div>
    </div>
  );
}
