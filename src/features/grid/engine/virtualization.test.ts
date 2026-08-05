import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import type * as Virtualization from "./virtualization";

const loadModule = createRequire(import.meta.url);
const { calculateVirtualRange } = loadModule(
  "./virtualization.ts",
) as typeof Virtualization;

const BASE_OPTIONS = {
  rowCount: 100_000,
  rowHeight: 48,
  viewportHeight: 48 * 12,
  overscan: 4,
} as const;

test("returns an empty range for an empty grid", () => {
  assert.deepEqual(
    calculateVirtualRange({ ...BASE_OPTIONS, rowCount: 0, scrollTop: 0 }),
    {
      startIndex: 0,
      endIndexExclusive: 0,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
    },
  );
});

test("renders the visible rows and forward overscan at the top", () => {
  assert.deepEqual(calculateVirtualRange({ ...BASE_OPTIONS, scrollTop: 0 }), {
    startIndex: 0,
    endIndexExclusive: 16,
    topSpacerHeight: 0,
    bottomSpacerHeight: 99_984 * 48,
  });
});

test("includes backward and forward overscan in the middle", () => {
  assert.deepEqual(
    calculateVirtualRange({ ...BASE_OPTIONS, scrollTop: 50_000 * 48 }),
    {
      startIndex: 49_996,
      endIndexExclusive: 50_016,
      topSpacerHeight: 49_996 * 48,
      bottomSpacerHeight: 49_984 * 48,
    },
  );
});

test("includes a partially visible final row", () => {
  const range = calculateVirtualRange({ ...BASE_OPTIONS, scrollTop: 48 + 1 });

  assert.equal(range.startIndex, 0);
  assert.equal(range.endIndexExclusive, 18);
});

test("clamps the range and spacers at the bottom", () => {
  assert.deepEqual(
    calculateVirtualRange({ ...BASE_OPTIONS, scrollTop: Number.MAX_SAFE_INTEGER }),
    {
      startIndex: 99_984,
      endIndexExclusive: 100_000,
      topSpacerHeight: 99_984 * 48,
      bottomSpacerHeight: 0,
    },
  );
});

test("handles a dataset shorter than the viewport", () => {
  assert.deepEqual(
    calculateVirtualRange({
      ...BASE_OPTIONS,
      rowCount: 5,
      scrollTop: 500,
    }),
    {
      startIndex: 0,
      endIndexExclusive: 5,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
    },
  );
});

test("rejects invalid virtualization inputs", () => {
  const invalidOptions = [
    { rowCount: -1 },
    { rowCount: 1.5 },
    { rowHeight: 0 },
    { rowHeight: Number.NaN },
    { viewportHeight: -1 },
    { scrollTop: Number.POSITIVE_INFINITY },
    { overscan: -1 },
    { overscan: 1.5 },
  ];

  for (const invalidOption of invalidOptions) {
    assert.throws(
      () =>
        calculateVirtualRange({
          ...BASE_OPTIONS,
          scrollTop: 0,
          ...invalidOption,
        }),
      RangeError,
    );
  }
});
