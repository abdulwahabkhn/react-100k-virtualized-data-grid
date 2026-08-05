import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import type * as GenerateRows from "./generate-rows";

const loadModule = createRequire(import.meta.url);
const { generateEmployeeRows } = loadModule(
  "./generate-rows.ts",
) as typeof GenerateRows;

const defaultRows = generateEmployeeRows();

test("generates exactly 100,000 rows by default", () => {
  assert.equal(defaultRows.length, 100_000);
});

test("generates unique row IDs", () => {
  assert.equal(new Set(defaultRows.map((row) => row.id)).size, 100_000);
});

test("generates unique employee IDs", () => {
  assert.equal(
    new Set(defaultRows.map((row) => row.employeeId)).size,
    100_000,
  );
});

test("produces identical rows for the same seed", () => {
  assert.deepEqual(generateEmployeeRows(500, 7_231), generateEmployeeRows(500, 7_231));
});

test("produces different rows for different seeds", () => {
  assert.notDeepEqual(generateEmployeeRows(500, 7_231), generateEmployeeRows(500, 7_232));
});

test("generates rows that satisfy every field constraint", () => {
  const statuses = new Set(["active", "on-leave", "review"]);

  for (const row of defaultRows) {
    assert.match(row.id, /^employee-\d{6,}$/);
    assert.match(row.employeeId, /^EMP-\d{6,}$/);
    assert.match(row.name, /^\S+(?: \S+)+$/);
    assert.notEqual(row.department.trim(), "");
    assert.notEqual(row.role.trim(), "");
    assert.ok(statuses.has(row.status));
    assert.ok(Number.isInteger(row.salary));
    assert.ok(row.salary >= 52_000 && row.salary <= 205_000);
    assert.match(row.startDate, /^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/);
    assert.notEqual(row.location.trim(), "");
    assert.ok(Number.isInteger(row.performance));
    assert.ok(row.performance >= 0 && row.performance <= 100);
    assert.match(row.manager, /^\S+(?: \S+)+$/);
    assert.notEqual(row.manager, row.name);
    assert.deepEqual(Object.keys(row).sort(), [
      "department",
      "employeeId",
      "id",
      "location",
      "manager",
      "name",
      "performance",
      "role",
      "salary",
      "startDate",
      "status",
    ]);
  }
});

test("rejects invalid row counts with a clear error", () => {
  for (const count of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => generateEmployeeRows(count),
      (error: unknown) => {
        assert.ok(error instanceof RangeError);
        assert.equal(
          error.message,
          "Employee row count must be a non-negative safe integer.",
        );
        return true;
      },
    );
  }
});
