import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/server/reports/csv";

type Row = { name: string; note: string | null; count: number; when: Date };

describe("toCsv", () => {
  it("produces a header row followed by one row per data item", () => {
    const rows: Row[] = [{ name: "Ramesh", note: null, count: 3, when: new Date("2026-08-23") }];
    const csv = toCsv(rows, [
      { header: "Name", value: (r) => r.name },
      { header: "Count", value: (r) => r.count },
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Name,Count");
    expect(lines[1]).toBe("Ramesh,3");
    expect(lines.length).toBe(2);
  });

  it("renders null/undefined values as an empty field, never the literal string 'null'", () => {
    const rows: Row[] = [{ name: "Sunil", note: null, count: 0, when: new Date("2026-08-23") }];
    const csv = toCsv(rows, [{ header: "Note", value: (r) => r.note }]);
    expect(csv.split("\r\n")[1]).toBe("");
  });

  it("formats Date values as YYYY-MM-DD", () => {
    const rows: Row[] = [{ name: "x", note: null, count: 0, when: new Date("2026-08-23T10:00:00Z") }];
    const csv = toCsv(rows, [{ header: "When", value: (r) => r.when }]);
    expect(csv.split("\r\n")[1]).toBe("2026-08-23");
  });

  it("quotes a field containing a comma", () => {
    const rows = [{ name: "Cotton, Bt variety" }];
    const csv = toCsv(rows, [{ header: "Name", value: (r) => r.name }]);
    expect(csv.split("\r\n")[1]).toBe('"Cotton, Bt variety"');
  });

  it("quotes a field containing a double quote, and doubles the embedded quote", () => {
    const rows = [{ note: 'Farmer said "great results"' }];
    const csv = toCsv(rows, [{ header: "Note", value: (r) => r.note }]);
    expect(csv.split("\r\n")[1]).toBe('"Farmer said ""great results"""');
  });

  it("quotes a field containing a newline", () => {
    const rows = [{ note: "Line one\nLine two" }];
    const csv = toCsv(rows, [{ header: "Note", value: (r) => r.note }]);
    expect(csv.split("\r\n")[1]).toBe('"Line one\nLine two"');
  });

  it("leaves a plain field with no special characters unquoted", () => {
    const rows = [{ name: "Baban Bhosale" }];
    const csv = toCsv(rows, [{ header: "Name", value: (r) => r.name }]);
    expect(csv.split("\r\n")[1]).toBe("Baban Bhosale");
  });

  it("produces just the header row for an empty dataset — never fabricated sample rows", () => {
    const csv = toCsv([] as Row[], [{ header: "Name", value: (r) => r.name }]);
    expect(csv).toBe("Name");
  });

  it("handles multiple columns and multiple rows together", () => {
    const rows: Row[] = [
      { name: "A", note: "first", count: 1, when: new Date("2026-01-01") },
      { name: "B", note: null, count: 2, when: new Date("2026-01-02") },
    ];
    const csv = toCsv(rows, [
      { header: "Name", value: (r) => r.name },
      { header: "Note", value: (r) => r.note },
      { header: "Count", value: (r) => r.count },
    ]);
    expect(csv).toBe("Name,Note,Count\r\nA,first,1\r\nB,,2");
  });
});
