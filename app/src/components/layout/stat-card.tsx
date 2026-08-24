import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary";
}) {
  const isPrimary = tone === "primary";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col justify-between overflow-hidden rounded-xl p-5 transition-shadow",
        isPrimary
          ? "bg-primary text-primary-foreground shadow-md"
          : "border border-border/60 bg-card text-card-foreground ambient-shadow hover:shadow-md"
      )}
    >
      {isPrimary && (
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />
      )}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "mb-1 truncate text-sm",
              isPrimary ? "text-primary-foreground/75" : "text-muted-foreground"
            )}
          >
            {label}
          </p>
          <h3 className={cn("font-heading text-3xl font-bold", isPrimary && "text-primary-foreground")}>
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            isPrimary
              ? "bg-white/15 text-primary-foreground"
              : "border border-border bg-muted text-muted-foreground"
          )}
        >
          {Icon ? <Icon className="size-[18px]" /> : <ArrowUpRight className="size-[18px] -rotate-45" />}
        </div>
      </div>
      {hint && (
        <div
          className={cn(
            "relative z-10 mt-4 flex w-fit items-center gap-1.5 rounded px-2 py-1 text-xs",
            isPrimary ? "bg-white/10 text-secondary-container" : "text-muted-foreground"
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
