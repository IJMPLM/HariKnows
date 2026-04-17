"use client";

interface SummaryCardsProps {
  totals: {
    total: number;
    active: number;
    archived: number;
    incomplete: number;
    errors: number;
  };
}

export default function SummaryCards({ totals }: SummaryCardsProps) {
  return (
    <div className="px-8 py-7">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Total</p>
          <p className="text-3xl font-extrabold mt-2">{totals.total}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Active</p>
          <p className="text-3xl font-extrabold mt-2 text-emerald-400">{totals.active}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Archived</p>
          <p className="text-3xl font-extrabold mt-2 text-zinc-300">{totals.archived}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Incomplete</p>
          <p className="text-3xl font-extrabold mt-2 text-amber-300">{totals.incomplete}</p>
        </div>
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Errors</p>
          <p className="text-3xl font-extrabold mt-2 text-red-400">{totals.errors}</p>
        </div>
      </div>
    </div>
  );
}
