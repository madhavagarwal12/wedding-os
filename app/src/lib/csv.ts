export type CsvColumn = { key: string; label: string };

// Cells that start with =, +, -, @, or a tab/CR (the characters Excel/Sheets/
// LibreOffice treat as a formula prefix) are neutralized by prepending a
// single quote. This is real, separate risk from normal CSV quoting — a
// stored value like "=1+1" or "@SUM(...)" opened in a spreadsheet app can
// execute as a formula (CSV/"formula" injection, OWASP-listed). We still
// carry the underlying data (Excel shows the leading quote marker rather
// than evaluating the formula) rather than stripping the value.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let raw =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? String((value as { toString(): string }).toString())
        : String(value);
  if (FORMULA_PREFIX.test(raw)) {
    raw = `'${raw}`;
  }
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function toCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[]
): string {
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(row[column.key])).join(",")
  );
  return [header, ...body].join("\r\n");
}

export function csvResponse(csv: string, fileName: string): Response {
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
