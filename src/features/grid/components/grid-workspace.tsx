"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { AddRowForm } from "@/features/grid/components/add-row-form";
import { DataGrid } from "@/features/grid/components/data-grid";
import { SearchBar } from "@/features/grid/components/search-bar";
import { employeeColumns } from "@/features/grid/config/employee-columns";
import {
  GridProvider,
  useGrid,
  type RowOperation,
} from "@/features/grid/context/grid-context";
import { generateEmployeeRows } from "@/features/grid/data/generate-rows";
import {
  formatCurrency,
  summarizeRows,
} from "@/features/grid/engine/grid-engine";
import type { EmployeeRow } from "@/features/grid/model/grid.types";

export interface GridWorkspaceProps {
  readonly initialRows?: readonly EmployeeRow[];
  readonly initialRowCount?: number;
}

/** Owns the row state and connects the form, operations, and data grid. */
export function GridWorkspace({
  initialRows,
  initialRowCount = 100_000,
}: GridWorkspaceProps) {
  const [rows, setRows] = useState<EmployeeRow[]>(() =>
    initialRows === undefined
      ? generateEmployeeRows(initialRowCount)
      : [...initialRows],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const rowsRef = useRef<readonly EmployeeRow[]>(rows);

  const commitRows = useCallback((operation: RowOperation) => {
    const nextRows = operation(rowsRef.current);
    rowsRef.current = nextRows;
    setRows(nextRows);
  }, []);

  return (
    <GridProvider
      columns={employeeColumns}
      commitRows={commitRows}
      rows={rows}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      <WorkspaceContent />
    </GridProvider>
  );
}

function WorkspaceContent() {
  const { rows } = useGrid();
  const summary = useMemo(() => summarizeRows(rows), [rows]);

  return (
    <div className="grid gap-7">
      <section aria-label="Workforce summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total employees"
          value={summary.totalEmployees.toLocaleString("en-US")}
        />
        <SummaryCard label="Active now" value={String(summary.activeEmployees)} />
        <SummaryCard label="Average performance" value={`${summary.averagePerformance}%`} />
        <SummaryCard label="Annual payroll" value={formatCurrency(summary.annualPayroll)} />
      </section>

      <AddRowForm />

      <section className="grid gap-3" aria-labelledby="employee-directory-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Live directory
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950" id="employee-directory-title">
              Employee records
            </h2>
          </div>
          <SearchBar />
        </div>
        <DataGrid />
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </article>
  );
}
