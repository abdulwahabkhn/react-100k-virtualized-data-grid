import type { EmployeeRow } from "@/features/grid/model/grid.types";

export interface GridSummary {
  readonly totalEmployees: number;
  readonly activeEmployees: number;
  readonly averagePerformance: number;
  readonly annualPayroll: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function summarizeRows(rows: readonly EmployeeRow[]): GridSummary {
  if (rows.length === 0) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      averagePerformance: 0,
      annualPayroll: 0,
    };
  }

  const totals = rows.reduce(
    (summary, row) => ({
      activeEmployees:
        summary.activeEmployees + (row.status === "active" ? 1 : 0),
      annualPayroll: summary.annualPayroll + row.salary,
      performance: summary.performance + row.performance,
    }),
    { activeEmployees: 0, annualPayroll: 0, performance: 0 },
  );

  return {
    totalEmployees: rows.length,
    activeEmployees: totals.activeEmployees,
    averagePerformance: Math.round((totals.performance / rows.length) * 10) / 10,
    annualPayroll: totals.annualPayroll,
  };
}

export function formatCellValue(value: unknown, columnId: string): string {
  if (value === null || value === undefined || value === "") return "—";

  if (columnId === "salary" && typeof value === "number") {
    return currencyFormatter.format(value);
  }

  if (columnId === "performance" && typeof value === "number") {
    return `${value}%`;
  }

  if (columnId === "startDate" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) return dateFormatter.format(date);
  }

  if (columnId === "status" && typeof value === "string") {
    return value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return value instanceof Date ? dateFormatter.format(value) : String(value);
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Returns the next available ID in the EMP-001 sequence. */
export function createNextEmployeeId(rows: readonly EmployeeRow[]): string {
  const highestEmployeeNumber = rows.reduce((highest, row) => {
    const match = /^EMP-(\d+)$/i.exec(row.employeeId);
    if (!match) return highest;

    const employeeNumber = Number(match[1]);
    return Number.isSafeInteger(employeeNumber)
      ? Math.max(highest, employeeNumber)
      : highest;
  }, 0);
  const nextEmployeeNumber = highestEmployeeNumber + 1;

  return `EMP-${String(nextEmployeeNumber).padStart(3, "0")}`;
}

/** Filters employee rows without changing their order or source array. */
export function searchEmployeeRows(
  rows: readonly EmployeeRow[],
  searchQuery: string,
): readonly EmployeeRow[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  if (normalizedQuery === "") return rows;

  return rows.filter((row) =>
    [
      row.employeeId,
      row.name,
      row.department,
      row.role,
      row.status.replaceAll("-", " "),
      String(row.salary),
      row.startDate,
      row.location,
      String(row.performance),
      row.manager,
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );
}
