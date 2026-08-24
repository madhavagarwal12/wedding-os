import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExportCsvButton({
  dataset,
  label = "Export CSV",
  className,
}: {
  dataset: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={`/api/export/${dataset}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      <Download className="size-3.5" aria-hidden />
      {label}
    </a>
  );
}
