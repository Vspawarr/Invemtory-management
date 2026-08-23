export type CsvValue = string | number | boolean | Date | null | undefined;
export type CsvColumn<T> = { header: string; value: (row: T) => CsvValue };

/** Pure CSV serialization — RFC 4180-ish escaping (quotes fields containing
 * a comma, quote, or newline; doubles embedded quotes). No dependency, no
 * server-only I/O, so this is directly unit-testable. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(",");
  const dataLines = rows.map((row) => columns.map((c) => escapeCsvField(formatCsvValue(c.value(row)))).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

function formatCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
