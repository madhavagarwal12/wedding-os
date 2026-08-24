/**
 * React Server Components only allow plain objects/arrays, primitives, and a
 * handful of built-ins (Date, Map, Set) to cross the server→client prop
 * boundary. Prisma's `Decimal` is a class instance, so it fails silently at
 * runtime ("Only plain objects can be passed to Client Components... Decimal
 * objects are not supported") whenever a fetched record with a money field
 * is passed into a "use client" component. This walks the value and
 * converts any Decimal-like instance (duck-typed via toNumber) to a number.
 */
export function serializeDecimals<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimals(item)) as unknown as T;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (
      typeof (record as { toNumber?: unknown }).toNumber === "function" &&
      typeof (record as { toFixed?: unknown }).toFixed === "function"
    ) {
      return (record as { toNumber: () => number }).toNumber() as unknown as T;
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      result[key] = serializeDecimals(record[key]);
    }
    return result as T;
  }
  return value;
}
