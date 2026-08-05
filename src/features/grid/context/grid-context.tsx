"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import {
  addRow as addRowOperation,
  deleteRow as deleteRowOperation,
  readRow as readRowOperation,
  updateRow as updateRowOperation,
  type AddRowOptions,
  type RowUpdate,
  type UpdateRowOptions,
} from "@/features/grid/engine/row-operations";
import { searchEmployeeRows } from "@/features/grid/engine/grid-engine";
import type {
  ColumnDefinition,
  EmployeeRow,
  RowId,
} from "@/features/grid/model/grid.types";

export interface GridContextValue {
  readonly rows: readonly EmployeeRow[];
  readonly visibleRows: readonly EmployeeRow[];
  readonly columns: readonly ColumnDefinition<EmployeeRow>[];
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly addRow: (
    row: EmployeeRow,
    options?: AddRowOptions<EmployeeRow>,
  ) => void;
  readonly readRow: (rowId: RowId) => Readonly<EmployeeRow>;
  readonly updateRow: (
    rowId: RowId,
    update: RowUpdate<EmployeeRow>,
    options?: UpdateRowOptions<EmployeeRow>,
  ) => void;
  readonly deleteRow: (rowId: RowId) => void;
}

export interface GridProviderProps {
  readonly children: ReactNode;
  readonly columns: readonly ColumnDefinition<EmployeeRow>[];
  readonly commitRows: (operation: RowOperation) => void;
  readonly rows: readonly EmployeeRow[];
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
}

export type RowOperation = (
  currentRows: readonly EmployeeRow[],
) => EmployeeRow[];

const GridContext = createContext<GridContextValue | null>(null);

export function GridProvider({
  children,
  columns,
  commitRows,
  rows,
  searchQuery,
  setSearchQuery,
}: GridProviderProps) {
  const visibleRows = useMemo(
    () => searchEmployeeRows(rows, searchQuery),
    [rows, searchQuery],
  );
  const addRow = useCallback(
    (row: EmployeeRow, options?: AddRowOptions<EmployeeRow>) => {
      commitRows((currentRows) => addRowOperation(currentRows, row, options));
    },
    [commitRows],
  );

  const readRow = useCallback(
    (rowId: RowId) => readRowOperation(rows, rowId),
    [rows],
  );

  const updateRow = useCallback(
    (
      rowId: RowId,
      update: RowUpdate<EmployeeRow>,
      options?: UpdateRowOptions<EmployeeRow>,
    ) => {
      commitRows((currentRows) =>
        updateRowOperation(currentRows, rowId, update, options),
      );
    },
    [commitRows],
  );

  const deleteRow = useCallback(
    (rowId: RowId) => {
      commitRows((currentRows) => deleteRowOperation(currentRows, rowId));
    },
    [commitRows],
  );

  const value = useMemo<GridContextValue>(
    () => ({
      rows,
      visibleRows,
      columns,
      searchQuery,
      setSearchQuery,
      addRow,
      readRow,
      updateRow,
      deleteRow,
    }),
    [
      rows,
      visibleRows,
      columns,
      searchQuery,
      setSearchQuery,
      addRow,
      readRow,
      updateRow,
      deleteRow,
    ],
  );

  return <GridContext value={value}>{children}</GridContext>;
}

export function useGrid(): GridContextValue {
  const context = useContext(GridContext);

  if (context === null) {
    throw new Error("useGrid must be used within a GridProvider.");
  }

  return context;
}
