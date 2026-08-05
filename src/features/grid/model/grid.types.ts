
export type RowId = string;

export interface BaseRow {
  id: RowId;
}

export type EmployeeStatus = "active" | "on-leave" | "review";

export interface EmployeeRow extends BaseRow {
  employeeId: string;
  name: string;
  department: string;
  role: string;
  status: EmployeeStatus;
  salary: number;
  startDate: string;
  location: string;
  performance: number;
  manager: string;
}

export type ColumnAlignment = "left" | "center" | "right";

export interface ColumnDefinition<
  TRow extends BaseRow,
  TValue = unknown,
> {
  id: string;
  header: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  alignment?: ColumnAlignment;
  accessor: (row: TRow) => TValue;
}

export interface CellAddress {
  rowId: RowId;
  columnId: string;
}

export interface GridState {
  activeCell: CellAddress | null;
  editingCell: CellAddress | null;
  selectedRowIds: Set<RowId>;
}