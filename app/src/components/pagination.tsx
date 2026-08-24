import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PAGE_SIZE = 25;

export function pageFromSearchParams(page: string | string[] | undefined) {
  const value = Number(Array.isArray(page) ? page[0] : page);
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

export function Pagination({
  basePath,
  page,
  total,
  pageSize = PAGE_SIZE,
}: {
  basePath: string;
  page: number;
  total: number;
  pageSize?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }));
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50");

  return (
    <div className="flex items-center justify-between gap-4 pt-2 text-sm text-muted-foreground">
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={`${basePath}?page=${page - 1}`}
          className={page <= 1 ? disabledClass : linkClass}
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <span>
          Page {page} of {totalPages}
        </span>
        <Link
          href={`${basePath}?page=${page + 1}`}
          className={page >= totalPages ? disabledClass : linkClass}
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
