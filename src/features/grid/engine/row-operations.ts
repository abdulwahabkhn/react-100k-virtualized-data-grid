import type { BaseRow, RowId } from "@/features/grid/model/grid.types";

export type AddRowPosition =
  | "start"
  | "end"
  | number
  | { readonly beforeId: RowId }
  | { readonly afterId: RowId };

export interface AddRowOptions<TRow extends BaseRow> {
  /** Where to insert the row. A number is a zero-based insertion index. */
  readonly position?: AddRowPosition;
  /** Makes a retried insert succeed without adding the same row twice. */
  readonly onDuplicate?: "error" | "ignore";
  /** Rejects the insert when the collection is already at this capacity. */
  readonly maxRows?: number;
  /** Runs domain-specific validation immediately before insertion. */
  readonly validate?: (
    row: Readonly<TRow>,
    context: Readonly<{ rows: readonly TRow[]; insertionIndex: number }>,
  ) => void;
}

export type RowUpdate<TRow extends BaseRow> =
  | Partial<Omit<TRow, "id">>
  | ((currentRow: Readonly<TRow>) => TRow);

export interface UpdateRowOptions<TRow extends BaseRow> {
  /** Runs domain-specific validation immediately before replacement. */
  readonly validate?: (
    nextRow: Readonly<TRow>,
    currentRow: Readonly<TRow>,
  ) => void;
}

export type RowOperationErrorCode =
  | "INVALID_ROWS"
  | "INVALID_ROW"
  | "INVALID_ROW_ID"
  | "DUPLICATE_ROW_ID"
  | "INVALID_DUPLICATE_STRATEGY"
  | "ROW_ID_CHANGE_NOT_ALLOWED"
  | "ROW_NOT_FOUND"
  | "INVALID_POSITION"
  | "ANCHOR_ROW_NOT_FOUND"
  | "INVALID_MAX_ROWS"
  | "ROW_LIMIT_REACHED";

/** An error that callers can reliably map to logging and UI messages. */
export class RowOperationError extends Error {
  constructor(
    readonly code: RowOperationErrorCode,
    message: string,
    readonly rowId?: RowId,
  ) {
    super(message);
    this.name = "RowOperationError";
  }
}

/** Adds a row without mutating the source array. */
export function addRow<TRow extends BaseRow>(
  rows: readonly TRow[],
  newRow: TRow,
  options: AddRowOptions<TRow> = {},
): TRow[] {
  assertRows(rows);
  const rowId = assertValidRow(newRow);
  const { onDuplicate = "error", position = "end", maxRows } = options;

  if (onDuplicate !== "error" && onDuplicate !== "ignore") {
    throw new RowOperationError(
      "INVALID_DUPLICATE_STRATEGY",
      `Unsupported duplicate-row strategy "${String(onDuplicate)}".`,
      rowId,
    );
  }

  assertValidMaxRows(maxRows, rowId);

  const duplicateIndex = findRowIndex(rows, rowId);

  if (duplicateIndex !== -1) {
    if (onDuplicate === "ignore") return rows.slice();

    throw duplicateRowError(rowId, duplicateIndex);
  }

  if (maxRows !== undefined && rows.length >= maxRows) {
    throw new RowOperationError(
      "ROW_LIMIT_REACHED",
      `Cannot add row "${rowId}": the row limit of ${maxRows} has been reached.`,
      rowId,
    );
  }

  const insertionIndex = resolveInsertionIndex(rows, position, rowId);
  options.validate?.(newRow, { rows, insertionIndex });

  return [
    ...rows.slice(0, insertionIndex),
    newRow,
    ...rows.slice(insertionIndex),
  ];
}

/** Returns a row by ID, or throws a typed error when it does not exist. */
export function readRow<TRow extends BaseRow>(
  rows: readonly TRow[],
  rowId: RowId,
): Readonly<TRow> {
  assertRows(rows);
  assertValidRowId(rowId);

  const rowIndex = findRowIndex(rows, rowId);
  if (rowIndex === -1) throw missingRowError(rowId);

  return rows[rowIndex];
}

/** Returns a new array containing the updated row without mutating the source array. */
export function updateRow<TRow extends BaseRow>(
  rows: readonly TRow[],
  rowId: RowId,
  update: RowUpdate<TRow>,
  options: UpdateRowOptions<TRow> = {},
): TRow[] {
  assertRows(rows);
  assertValidRowId(rowId);

  const rowIndex = findRowIndex(rows, rowId);
  if (rowIndex === -1) throw missingRowError(rowId);

  const currentRow = rows[rowIndex];
  const nextRow =
    typeof update === "function"
      ? update(currentRow)
      : ({ ...currentRow, ...update } as TRow);
  const nextRowId = assertValidRow(nextRow);

  if (nextRowId !== rowId) {
    throw new RowOperationError(
      "ROW_ID_CHANGE_NOT_ALLOWED",
      `Cannot change row ID from "${rowId}" to "${nextRowId}".`,
      rowId,
    );
  }

  const duplicateIndex = rows.findIndex(
    (row, index) => index !== rowIndex && row.id === nextRowId,
  );

  if (duplicateIndex !== -1 && duplicateIndex !== rowIndex) {
    throw duplicateRowError(nextRowId, duplicateIndex);
  }

  options.validate?.(nextRow, currentRow);

  const nextRows = rows.slice();
  nextRows[rowIndex] = nextRow;
  return nextRows;
}

/** Deletes one row by ID without mutating the source array. */
export function deleteRow<TRow extends BaseRow>(
  rows: readonly TRow[],
  rowId: RowId,
): TRow[] {
  assertRows(rows);
  assertValidRowId(rowId);

  const rowIndex = findRowIndex(rows, rowId);
  if (rowIndex === -1) throw missingRowError(rowId);

  return [...rows.slice(0, rowIndex), ...rows.slice(rowIndex + 1)];
}

function assertRows<TRow extends BaseRow>(
  rows: readonly TRow[],
): asserts rows is readonly TRow[] {
  if (!Array.isArray(rows)) {
    throw new RowOperationError("INVALID_ROWS", "Rows must be an array.");
  }
}

function assertValidRow<TRow extends BaseRow>(row: TRow): RowId {
  if (row === null || typeof row !== "object" || Array.isArray(row)) {
    throw new RowOperationError("INVALID_ROW", "A row must be an object.");
  }

  assertValidRowId(row.id);
  return row.id;
}

function assertValidRowId(rowId: RowId): asserts rowId is RowId {
  if (typeof rowId !== "string" || rowId.trim() === "") {
    throw new RowOperationError(
      "INVALID_ROW_ID",
      "A row ID must be a non-empty string.",
    );
  }
}

function findRowIndex<TRow extends BaseRow>(
  rows: readonly TRow[],
  rowId: RowId,
): number {
  return rows.findIndex((row) => row.id === rowId);
}

function assertValidMaxRows(
  maxRows: number | undefined,
  rowId: RowId,
): void {
  if (
    maxRows !== undefined &&
    (!Number.isSafeInteger(maxRows) || maxRows < 0)
  ) {
    throw new RowOperationError(
      "INVALID_MAX_ROWS",
      "maxRows must be a non-negative safe integer.",
      rowId,
    );
  }
}

function resolveInsertionIndex<TRow extends BaseRow>(
  rows: readonly TRow[],
  position: AddRowPosition,
  newRowId: RowId,
): number {
  if (position === "start") return 0;
  if (position === "end") return rows.length;

  if (typeof position === "number") {
    if (!Number.isSafeInteger(position) || position < 0 || position > rows.length) {
      throw new RowOperationError(
        "INVALID_POSITION",
        `Insertion index must be a safe integer between 0 and ${rows.length}.`,
        newRowId,
      );
    }
    return position;
  }

  if (position === null || typeof position !== "object") {
    throw invalidPositionError(newRowId);
  }

  const hasBeforeId = "beforeId" in position;
  const hasAfterId = "afterId" in position;
  if (hasBeforeId === hasAfterId) throw invalidPositionError(newRowId);

  const anchorId = hasBeforeId ? position.beforeId : position.afterId;
  assertValidRowId(anchorId);

  const anchorIndex = findRowIndex(rows, anchorId);
  if (anchorIndex === -1) {
    throw new RowOperationError(
      "ANCHOR_ROW_NOT_FOUND",
      `Cannot add row "${newRowId}": anchor row "${anchorId}" was not found.`,
      anchorId,
    );
  }

  return hasBeforeId ? anchorIndex : anchorIndex + 1;
}

function duplicateRowError(rowId: RowId, rowIndex: number): RowOperationError {
  return new RowOperationError(
    "DUPLICATE_ROW_ID",
    `Row "${rowId}" already exists at index ${rowIndex}.`,
    rowId,
  );
}

function missingRowError(rowId: RowId): RowOperationError {
  return new RowOperationError(
    "ROW_NOT_FOUND",
    `Row "${rowId}" was not found.`,
    rowId,
  );
}

function invalidPositionError(rowId: RowId): RowOperationError {
  return new RowOperationError(
    "INVALID_POSITION",
    'position must be "start", "end", an insertion index, { beforeId }, or { afterId }.',
    rowId,
  );
}
