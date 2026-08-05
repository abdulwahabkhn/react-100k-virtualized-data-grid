"use client";

import { useState } from "react";

import { EditRowForm } from "@/features/grid/components/edit-row-form";
import { useGrid } from "@/features/grid/context/grid-context";
import { formatCellValue } from "@/features/grid/engine/grid-engine";
import { calculateVirtualRange } from "@/features/grid/engine/virtualization";
import type {
  ColumnDefinition,
  EmployeeRow,
} from "@/features/grid/model/grid.types";

const ROW_HEIGHT = 48;
const VISIBLE_ROW_COUNT = 12;
const VIEWPORT_HEIGHT = ROW_HEIGHT * VISIBLE_ROW_COUNT;
const HEADER_HEIGHT = 44;
const OVERSCAN = 4;
const GRID_HEIGHT = HEADER_HEIGHT + VIEWPORT_HEIGHT;

export function DataGrid() {
  const { columns, deleteRow, searchQuery, visibleRows } = useGrid();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const virtualRange = calculateVirtualRange({
    rowCount: visibleRows.length,
    rowHeight: ROW_HEIGHT,
    viewportHeight: VIEWPORT_HEIGHT,
    scrollTop,
    overscan: OVERSCAN,
  });
  const renderedRows = visibleRows.slice(
    virtualRange.startIndex,
    virtualRange.endIndexExclusive,
  );
  const columnCount = columns.length + 1;

  function handleDelete(row: EmployeeRow) {
    const confirmed = window.confirm(
      `Remove ${row.name} (${row.employeeId}) from the grid?`,
    );
    if (!confirmed) return;

    deleteRow(row.id);
    if (editingRowId === row.id) setEditingRowId(null);
    console.log("Successfully deleted", row);
  }

  return (
    <div className="grid gap-4">
      {editingRowId ? (
        <EditRowForm
          onCancel={() => setEditingRowId(null)}
          onSaved={() => setEditingRowId(null)}
          rowId={editingRowId}
        />
      ) : null}

      <div
        className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        style={{ height: `${GRID_HEIGHT}px` }}
      >
        <table className="w-full min-w-[1450px] table-fixed border-collapse text-sm">
          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={{ width: column.width }} />
            ))}
            <col style={{ width: 150 }} />
          </colgroup>
          <thead className="sticky top-0 z-10 h-11 bg-white text-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  className="h-11 border-b border-slate-200 px-4 font-semibold"
                  key={column.id}
                  scope="col"
                  style={{ textAlign: column.alignment ?? "left" }}
                >
                  {column.header}
                </th>
              ))}
              <th
                className="h-11 border-b border-slate-200 px-4 text-right font-semibold"
                scope="col"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {visibleRows.length === 0 ? (
              <tr style={{ height: ROW_HEIGHT }}>
                <td
                  className="px-4 text-center text-slate-500"
                  colSpan={Math.max(columnCount, 1)}
                >
                  {searchQuery
                    ? `No employees match \u201c${searchQuery}\u201d.`
                    : "No rows to display."}
                </td>
              </tr>
            ) : (
              <>
                {virtualRange.topSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      className="border-0 p-0"
                      colSpan={columnCount}
                      style={{ height: virtualRange.topSpacerHeight }}
                    />
                  </tr>
                ) : null}

                {renderedRows.map((row) => (
                  <tr
                    className="border-b border-slate-100 hover:bg-slate-50"
                    key={row.id}
                    style={{ height: ROW_HEIGHT }}
                  >
                    {columns.map((column) => (
                      <DataGridCell column={column} key={column.id} row={row} />
                    ))}
                    <td className="whitespace-nowrap px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                          onClick={() => setEditingRowId(row.id)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(row)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {virtualRange.bottomSpacerHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      className="border-0 p-0"
                      colSpan={columnCount}
                      style={{ height: virtualRange.bottomSpacerHeight }}
                    />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DataGridCell({
  column,
  row,
}: {
  column: ColumnDefinition<EmployeeRow>;
  row: EmployeeRow;
}) {
  const displayValue = formatCellValue(column.accessor(row), column.id);

  return (
    <td
      className="truncate whitespace-nowrap px-4"
      style={{ textAlign: column.alignment ?? "left" }}
      title={displayValue}
    >
      {displayValue}
    </td>
  );
}
