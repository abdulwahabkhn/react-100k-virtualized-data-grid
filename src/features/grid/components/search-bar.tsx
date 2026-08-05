"use client";

import { useId } from "react";

import { useGrid } from "@/features/grid/context/grid-context";

export function SearchBar() {
  const searchId = useId();
  const { rows, searchQuery, setSearchQuery, visibleRows } = useGrid();

  return (
    <div className="w-full sm:max-w-md">
      <label className="sr-only" htmlFor={searchId}>
        Search employee records
      </label>
      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
        <span aria-hidden="true" className="px-2 text-slate-400">
          ⌕
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-950 outline-none placeholder:text-slate-400"
          id={searchId}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search name, role, team, ID..."
          type="search"
          value={searchQuery}
        />
        {searchQuery ? (
          <button
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setSearchQuery("")}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p aria-live="polite" className="mt-1.5 text-right text-xs text-slate-500">
        {searchQuery
          ? `${visibleRows.length} of ${rows.length} employees found`
          : `${rows.length} employees`}
      </p>
    </div>
  );
}
