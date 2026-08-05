import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import type * as RowOperations from "./row-operations";

const loadModule = createRequire(import.meta.url);
const { addRow, deleteRow, readRow, RowOperationError, updateRow } = loadModule(
  "./row-operations.ts",
) as typeof RowOperations;

interface TestRow {
  id: string;
  name: string;
  score: number;
}

const alpha: TestRow = { id: "a", name: "Alpha", score: 10 };
const bravo: TestRow = { id: "b", name: "Bravo", score: 20 };
const charlie: TestRow = { id: "c", name: "Charlie", score: 30 };

test("adds rows at the start and end", () => {
  const rows = [alpha];

  assert.deepEqual(addRow(rows, bravo, { position: "start" }), [bravo, alpha]);
  assert.deepEqual(addRow(rows, bravo, { position: "end" }), [alpha, bravo]);
  assert.deepEqual(addRow(rows, bravo), [alpha, bravo]);
  assert.deepEqual(rows, [alpha]);
});

test("adds a row at a numeric insertion index", () => {
  assert.deepEqual(addRow([alpha, charlie], bravo, { position: 1 }), [
    alpha,
    bravo,
    charlie,
  ]);
});

test("adds rows before and after an anchor row", () => {
  const rows = [alpha, charlie];

  assert.deepEqual(addRow(rows, bravo, { position: { beforeId: "c" } }), [
    alpha,
    bravo,
    charlie,
  ]);
  assert.deepEqual(addRow(rows, bravo, { position: { afterId: "a" } }), [
    alpha,
    bravo,
    charlie,
  ]);
});

test("rejects duplicate rows with the error strategy", () => {
  assertRowError(() => addRow([alpha], alpha), "DUPLICATE_ROW_ID");
});

test("ignores duplicate rows by returning an equal new array", () => {
  const rows = [alpha];
  const result = addRow(rows, alpha, { onDuplicate: "ignore" });

  assert.deepEqual(result, rows);
  assert.notStrictEqual(result, rows);
});

test("rejects an invalid duplicate strategy with its specific error code", () => {
  assertRowError(
    () =>
      addRow([alpha], bravo, {
        onDuplicate: "replace" as "error",
      }),
    "INVALID_DUPLICATE_STRATEGY",
  );
});

test("enforces the maximum-row limit", () => {
  assertRowError(
    () => addRow([alpha], bravo, { maxRows: 1 }),
    "ROW_LIMIT_REACHED",
  );
});

test("reads an existing row without cloning it", () => {
  const storedRow = readRow([alpha, bravo], "b");

  assert.strictEqual(storedRow, bravo);
});

test("rejects reading a missing row", () => {
  assertRowError(() => readRow([alpha], "missing"), "ROW_NOT_FOUND");
});

test("updates a row through a patch", () => {
  const rows = [alpha, bravo];
  const result = updateRow(rows, "a", { name: "Updated Alpha", score: 11 });

  assert.deepEqual(result, [
    { id: "a", name: "Updated Alpha", score: 11 },
    bravo,
  ]);
  assert.deepEqual(rows, [alpha, bravo]);
  assert.notStrictEqual(result, rows);
});

test("updates a row through a callback", () => {
  const result = updateRow([alpha], "a", (row) => ({
    ...row,
    score: row.score + 5,
  }));

  assert.deepEqual(result, [{ id: "a", name: "Alpha", score: 15 }]);
});

test("rejects a callback that changes the row ID", () => {
  assertRowError(
    () => updateRow([alpha], "a", (row) => ({ ...row, id: "renamed" })),
    "ROW_ID_CHANGE_NOT_ALLOWED",
  );
});

test("rejects a duplicate ID already present during update", () => {
  const duplicateAlpha = { ...bravo, id: "a" };

  assertRowError(
    () => updateRow([alpha, duplicateAlpha], "a", { score: 11 }),
    "DUPLICATE_ROW_ID",
  );
});

test("deletes an existing row without changing the source array", () => {
  const rows = [alpha, bravo];
  const result = deleteRow(rows, "a");

  assert.deepEqual(result, [bravo]);
  assert.deepEqual(rows, [alpha, bravo]);
  assert.notStrictEqual(result, rows);
});

test("rejects deleting a missing row", () => {
  assertRowError(() => deleteRow([alpha], "missing"), "ROW_NOT_FOUND");
});

function assertRowError(
  operation: () => unknown,
  expectedCode: RowOperations.RowOperationErrorCode,
): void {
  assert.throws(operation, (error: unknown) => {
    assert.ok(error instanceof RowOperationError);
    assert.equal(error.code, expectedCode);
    return true;
  });
}
