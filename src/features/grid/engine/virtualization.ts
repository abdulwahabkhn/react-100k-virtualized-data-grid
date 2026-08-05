export interface VirtualRangeOptions {
  readonly rowCount: number;
  readonly rowHeight: number;
  readonly viewportHeight: number;
  readonly scrollTop: number;
  readonly overscan: number;
}

export interface VirtualRange {
  readonly startIndex: number;
  readonly endIndexExclusive: number;
  readonly topSpacerHeight: number;
  readonly bottomSpacerHeight: number;
}

/** Calculates the rows to mount and the spacer heights that preserve scrolling. */
export function calculateVirtualRange({
  rowCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan,
}: VirtualRangeOptions): VirtualRange {
  validateOptions({
    rowCount,
    rowHeight,
    viewportHeight,
    scrollTop,
    overscan,
  });

  if (rowCount === 0) {
    return {
      startIndex: 0,
      endIndexExclusive: 0,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
    };
  }

  const totalRowsHeight = rowCount * rowHeight;
  const maximumScrollTop = Math.max(0, totalRowsHeight - viewportHeight);
  const clampedScrollTop = Math.min(Math.max(0, scrollTop), maximumScrollTop);
  const firstVisibleIndex = Math.floor(clampedScrollTop / rowHeight);
  const visibleEndIndexExclusive = Math.min(
    rowCount,
    Math.ceil((clampedScrollTop + viewportHeight) / rowHeight),
  );
  const startIndex = Math.max(0, firstVisibleIndex - overscan);
  const endIndexExclusive = Math.min(
    rowCount,
    visibleEndIndexExclusive + overscan,
  );

  return {
    startIndex,
    endIndexExclusive,
    topSpacerHeight: startIndex * rowHeight,
    bottomSpacerHeight: (rowCount - endIndexExclusive) * rowHeight,
  };
}

function validateOptions({
  rowCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan,
}: VirtualRangeOptions): void {
  if (!Number.isSafeInteger(rowCount) || rowCount < 0) {
    throw new RangeError("Virtual row count must be a non-negative safe integer.");
  }

  if (!Number.isFinite(rowHeight) || rowHeight <= 0) {
    throw new RangeError("Virtual row height must be a positive finite number.");
  }

  if (!Number.isFinite(viewportHeight) || viewportHeight < 0) {
    throw new RangeError(
      "Virtual viewport height must be a non-negative finite number.",
    );
  }

  if (!Number.isFinite(scrollTop)) {
    throw new RangeError("Virtual scroll position must be a finite number.");
  }

  if (!Number.isSafeInteger(overscan) || overscan < 0) {
    throw new RangeError("Virtual overscan must be a non-negative safe integer.");
  }
}
