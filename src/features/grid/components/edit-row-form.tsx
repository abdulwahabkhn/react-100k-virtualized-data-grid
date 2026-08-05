"use client";

import { useState, type FormEvent } from "react";

import { createEmployeeRow } from "@/features/grid/components/add-row-form";
import { useGrid } from "@/features/grid/context/grid-context";
import type { RowId } from "@/features/grid/model/grid.types";

export interface EditRowFormProps {
  readonly onCancel: () => void;
  readonly onSaved: () => void;
  readonly rowId: RowId;
}

export function EditRowForm({ onCancel, onSaved, rowId }: EditRowFormProps) {
  const { readRow, updateRow } = useGrid();
  const row = readRow(rowId);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createEmployeeRow(
      new FormData(event.currentTarget),
      row.employeeId,
    );

    if (!result.ok) {
      setError(Object.values(result.errors)[0] ?? "Check the employee details.");
      return;
    }

    try {
      updateRow(rowId, () => result.row);
      console.log("Successfully updated", result.row);
      onSaved();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "The employee could not be updated.",
      );
    }
  }

  return (
    <form
      className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5"
      onSubmit={handleSubmit}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Editing {row.employeeId}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            Update employee details
          </h3>
        </div>
        <button
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="grid content-start gap-1 text-xs font-semibold text-slate-600">
          Employee ID
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-normal text-slate-500">
            {row.employeeId}
          </span>
        </div>
        <EditField defaultValue={row.name} label="Name" name="name" />
        <EditField defaultValue={row.department} label="Department" name="department" />
        <EditField defaultValue={row.role} label="Role" name="role" />
        <label className="grid gap-1 text-xs font-semibold text-slate-600">
          Status
          <select className={fieldClassName} defaultValue={row.status} name="status">
            <option value="active">Active</option>
            <option value="on-leave">On leave</option>
            <option value="review">Review</option>
          </select>
        </label>
        <EditField defaultValue={row.salary} label="Salary" min="0" name="salary" step="0.01" type="number" />
        <EditField defaultValue={row.startDate} label="Start date" name="startDate" type="date" />
        <EditField defaultValue={row.location} label="Location" name="location" />
        <EditField defaultValue={row.performance} label="Performance" max="100" min="0" name="performance" step="0.1" type="number" />
        <EditField defaultValue={row.manager} label="Manager" name="manager" />
      </div>

      <div className="mt-4 flex justify-end">
        <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" type="submit">
          Save changes
        </button>
      </div>
    </form>
  );
}

const fieldClassName =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

function EditField({
  defaultValue,
  label,
  ...props
}: {
  defaultValue: string | number;
  label: string;
  max?: string;
  min?: string;
  name: string;
  readOnly?: boolean;
  step?: string;
  type?: "date" | "number" | "text";
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      {label}
      <input
        {...props}
        className={`${fieldClassName} read-only:bg-slate-100 read-only:text-slate-500`}
        defaultValue={defaultValue}
        required
      />
    </label>
  );
}
