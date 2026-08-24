import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

// SEC: CSV formula injection (a real, separate risk from the CSV-quoting
// already handled in src/lib/csv.ts). Values that begin with =, +, -, or @
// are interpreted as formulas by Excel/Sheets/LibreOffice when a .csv is
// opened — a stored lead name or vendor name of `=HYPERLINK(...)` or
// `=cmd|'/c calc'!A1` can execute when a staff member opens an exported
// report. This test file was written FIRST against the vulnerable version of
// escapeCell() (no formula-prefix handling), confirmed it failed, then
// src/lib/csv.ts was patched to prepend a `'` to neutralize the leading
// character — see the comment on FORMULA_PREFIX there.
describe("CSV export neutralizes formula-injection payloads", () => {
  const dangerousValues = [
    "=1+1",
    "=HYPERLINK(\"http://evil.example\",\"click me\")",
    "+1+1",
    "-1+1",
    "@SUM(A1:A10)",
    "\t=1+1", // tab-then-formula also parses as a formula in some clients
  ];

  it.each(dangerousValues)("prefixes a defusing quote before %s", (value) => {
    const csv = toCsv([{ name: value }], [{ key: "name", label: "Name" }]);
    const dataLine = csv.split("\r\n")[1];
    // The raw dangerous prefix must never be the first character emitted.
    expect(/^[=+\-@\t]/.test(dataLine.replace(/^"/, ""))).toBe(false);
    expect(dataLine.startsWith("'") || dataLine.startsWith("\"'")).toBe(true);
  });

  it("leaves ordinary values untouched", () => {
    const csv = toCsv(
      [{ name: "Sharma Wedding", amount: "50000" }],
      [
        { key: "name", label: "Name" },
        { key: "amount", label: "Amount" },
      ]
    );
    expect(csv).toBe("Name,Amount\r\nSharma Wedding,50000");
  });

  it("still quotes commas/quotes/newlines as before (regression check)", () => {
    const csv = toCsv([{ name: 'Say "hi", ok' }], [{ key: "name", label: "Name" }]);
    expect(csv).toBe('Name\r\n"Say ""hi"", ok"');
  });
});
