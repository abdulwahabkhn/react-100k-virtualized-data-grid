import { GridWorkspace } from "@/features/grid/components/grid-workspace";

const EMPLOYEE_ROW_COUNT = 100_000;

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto grid max-w-[1600px] gap-8">
        <header className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
              Axiom Grid · Workforce Operations
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Your people data, clear and actionable.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Add, review, update, and remove employee records from one focused workspace. Every change updates the directory and workforce totals instantly.
            </p>
          </div>
        </header>

        <GridWorkspace
          initialRowCount={EMPLOYEE_ROW_COUNT}
          key={EMPLOYEE_ROW_COUNT}
        />
      </div>
    </main>
  );
}
