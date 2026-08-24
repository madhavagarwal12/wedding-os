import { serializeDecimals } from "@/lib/serialize";

/**
 * Prisma `Json` columns reject class instances (Decimal) and Date objects, so
 * record snapshots are flattened to plain JSON before being stored.
 */
export function auditSnapshot(value: unknown) {
  if (value === null || value === undefined) return undefined;
  return JSON.parse(JSON.stringify(serializeDecimals(value)));
}
