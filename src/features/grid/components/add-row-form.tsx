"use client";

import { useId, useState, type FormEvent } from "react";

import { useGrid } from "@/features/grid/context/grid-context";
import { createNextEmployeeId } from "@/features/grid/engine/grid-engine";
import type {
  EmployeeRow,
  EmployeeStatus,
} from "@/features/grid/model/grid.types";

const EMPLOYEE_STATUSES = ["active", "on-leave", "review"] as const;

type FieldName = Exclude<keyof EmployeeRow, "id" | "employeeId">;
export type EmployeeFormErrors = Partial<Record<FieldName | "form", string>>;

export function AddRowForm() {
  const formId = useId();
  const { addRow, rows } = useGrid();
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const employeeId = createNextEmployeeId(rows);
    const result = createEmployeeRow(new FormData(form), employeeId);

    if (!result.ok) {
      setErrors(result.errors);
      focusFirstInvalidField(form, result.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      addRow(result.row);
      console.log("Successfully added", result.row);
      form.reset();
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "The employee could not be added.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      noValidate
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Add employee</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the employee details. A unique employee ID is assigned automatically.
        </p>
      </div>

      {errors.form ? (
        <p
          aria-live="polite"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FormField
          autoComplete="name"
          error={errors.name}
          id={`${formId}-name`}
          label="Name"
          name="name"
          required
        />
        <FormField
          error={errors.department}
          id={`${formId}-department`}
          label="Department"
          name="department"
          required
        />
        <FormField
          error={errors.role}
          id={`${formId}-role`}
          label="Role"
          name="role"
          required
        />

        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Status
          <select
            aria-describedby={errorId(formId, "status", errors.status)}
            aria-invalid={Boolean(errors.status)}
            className={inputClassName(Boolean(errors.status))}
            defaultValue="active"
            id={`${formId}-status`}
            name="status"
          >
            <option value="active">Active</option>
            <option value="on-leave">On leave</option>
            <option value="review">Review</option>
          </select>
          <FieldError id={`${formId}-status-error`} message={errors.status} />
        </label>

        <FormField
          error={errors.salary}
          id={`${formId}-salary`}
          label="Salary"
          min="0"
          name="salary"
          required
          step="0.01"
          type="number"
        />
        <FormField
          error={errors.startDate}
          id={`${formId}-startDate`}
          label="Start date"
          name="startDate"
          required
          type="date"
        />
        <FormField
          error={errors.location}
          id={`${formId}-location`}
          label="Location"
          name="location"
          required
        />
        <FormField
          error={errors.performance}
          id={`${formId}-performance`}
          label="Performance (0–100)"
          max="100"
          min="0"
          name="performance"
          required
          step="0.1"
          type="number"
        />
        <FormField
          error={errors.manager}
          id={`${formId}-manager`}
          label="Manager"
          name="manager"
          required
        />
      </div>

      <div className="flex justify-end">
        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Adding…" : "Add employee"}
        </button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  autoComplete?: string;
  error?: string;
  id: string;
  label: string;
  max?: string;
  min?: string;
  name: FieldName;
  placeholder?: string;
  required?: boolean;
  step?: string;
  type?: "date" | "number" | "text";
}

function FormField({
  error,
  id,
  label,
  type = "text",
  ...inputProps
}: FormFieldProps) {
  const errorMessageId = `${id}-error`;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        {...inputProps}
        aria-describedby={error ? errorMessageId : undefined}
        aria-invalid={Boolean(error)}
        className={inputClassName(Boolean(error))}
        id={id}
        type={type}
      />
      <FieldError id={errorMessageId} message={error} />
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span className="text-xs font-normal text-red-600" id={id}>
      {message}
    </span>
  ) : null;
}

function inputClassName(hasError: boolean): string {
  return [
    "rounded-md border bg-white px-3 py-2 text-slate-900 outline-none transition",
    "focus:ring-2 focus:ring-slate-400",
    hasError ? "border-red-500" : "border-slate-300",
  ].join(" ");
}

function errorId(formId: string, field: FieldName, error?: string) {
  return error ? `${formId}-${field}-error` : undefined;
}

export type EmployeeRowFormResult =
  | { readonly ok: true; readonly row: EmployeeRow }
  | { readonly ok: false; readonly errors: EmployeeFormErrors };

export function createEmployeeRow(
  formData: FormData,
  employeeId: string,
): EmployeeRowFormResult {
  const name = readText(formData, "name");
  const department = readText(formData, "department");
  const role = readText(formData, "role");
  const status = readText(formData, "status");
  const salaryInput = readText(formData, "salary");
  const startDate = readText(formData, "startDate");
  const location = readText(formData, "location");
  const performanceInput = readText(formData, "performance");
  const manager = readText(formData, "manager");
  const errors: EmployeeFormErrors = {};

  if (!name) errors.name = "Name is required.";
  if (!department) errors.department = "Department is required.";
  if (!role) errors.role = "Role is required.";
  if (!isEmployeeStatus(status)) errors.status = "Select a valid status.";
  if (!startDate) errors.startDate = "Start date is required.";
  else if (!isValidIsoDate(startDate)) errors.startDate = "Enter a valid date.";
  if (!location) errors.location = "Location is required.";
  if (!manager) errors.manager = "Manager is required.";

  const salary = Number(salaryInput);
  if (!salaryInput) errors.salary = "Salary is required.";
  else if (!Number.isFinite(salary) || salary < 0) {
    errors.salary = "Salary must be zero or greater.";
  }

  const performance = Number(performanceInput);
  if (!performanceInput) errors.performance = "Performance is required.";
  else if (!Number.isFinite(performance) || performance < 0 || performance > 100) {
    errors.performance = "Performance must be between 0 and 100.";
  }

  if (Object.keys(errors).length > 0 || !isEmployeeStatus(status)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    row: {
      id: employeeId,
      employeeId,
      name,
      department,
      role,
      status,
      salary,
      startDate,
      location,
      performance,
      manager,
    },
  };
}

function readText(formData: FormData, field: FieldName): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function isEmployeeStatus(value: string): value is EmployeeStatus {
  return (EMPLOYEE_STATUSES as readonly string[]).includes(value);
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function focusFirstInvalidField(
  form: HTMLFormElement,
  errors: EmployeeFormErrors,
): void {
  const firstInvalidField = Object.keys(errors).find(
    (field): field is FieldName => field !== "form",
  );

  if (firstInvalidField) {
    const element = form.elements.namedItem(firstInvalidField);
    if (element instanceof HTMLElement) element.focus();
  }
}
