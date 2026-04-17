"use client";

import { useMemo } from "react";
import { AlertCircle, ListFilter, X } from "lucide-react";
import { EtlBulkUploadResponse, EtlRow } from "../../lib/registrar-client";

type TabKey =
  | "departments"
  | "admissions"
  | "discipline"
  | "service"
  | "technology"
  | "students"
  | "grades"
  | "curriculums"
  | "syllabi"
  | "thesis";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "students", label: "Students" },
  { key: "admissions", label: "Admissions" },
  { key: "discipline", label: "Discipline" },
  { key: "service", label: "NSTP" },
  { key: "technology", label: "ICTO" },
  { key: "departments", label: "Departments" },
  { key: "grades", label: "Grades" },
  { key: "curriculums", label: "Curriculum" },
  { key: "syllabi", label: "Syllabus" },
  { key: "thesis", label: "Thesis" },
];

function getRows(result: EtlBulkUploadResponse | null, key: TabKey): EtlRow[] {
  if (!result) return [];
  return result.staging[key] ?? [];
}

interface StagedDataModalProps {
  isOpen: boolean;
  result: EtlBulkUploadResponse | null;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onClose: () => void;
  decisions: Record<number, "merge" | "skip">;
  onDecisionChange: (stagingId: number, action: "merge" | "skip") => void;
}

export default function StagedDataModal({
  isOpen,
  result,
  activeTab,
  onTabChange,
  onClose,
  decisions,
  onDecisionChange,
}: StagedDataModalProps) {
  if (!isOpen || !result) return null;

  const rows = useMemo(() => getRows(result, activeTab), [result, activeTab]);
  const columns = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => Object.keys(row.data).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Staged Data Review</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded-lg transition"
          >
            <X size={20} className="text-gray-600 dark:text-[#aaaaaa]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1 p-6 space-y-5">
          {/* Conflict Resolution Panel */}
          {result.conflicts.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-amber-100 mb-2">Conflict decisions</p>
              <div className="space-y-2">
                {result.conflicts.map((conflict) => (
                  <div key={conflict.stagingId} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
                    <p className="text-amber-100">
                      {conflict.fileName} · {conflict.studentNo} · {conflict.note}
                    </p>
                    <div className="inline-flex rounded-lg overflow-hidden border border-amber-300/40">
                      <button
                        onClick={() => onDecisionChange(conflict.stagingId, "merge")}
                        className={`px-3 py-1.5 ${
                          (decisions[conflict.stagingId] ?? "merge") === "merge"
                            ? "bg-amber-300 text-[#121212]"
                            : "bg-transparent text-amber-100"
                        }`}
                      >
                        Merge
                      </button>
                      <button
                        onClick={() => onDecisionChange(conflict.stagingId, "skip")}
                        className={`px-3 py-1.5 border-l border-amber-300/40 ${
                          decisions[conflict.stagingId] === "skip"
                            ? "bg-amber-300 text-[#121212]"
                            : "bg-transparent text-amber-100"
                        }`}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-200 dark:border-[#2a2a2a]">
            {TABS.map((tab) => {
              const count = getRows(result, tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                    activeTab === tab.key
                      ? "bg-[#6e3102] text-white border-[#6e3102] dark:bg-[#e8834a] dark:text-[#121212] dark:border-[#e8834a]"
                      : "bg-gray-200 border-gray-300 text-gray-700 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-[#d0d0d0]"
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-gray-600 dark:text-[#aaaaaa]">
              <ListFilter className="w-3.5 h-3.5" />
              Conflicts: {result.conflicts.length}
            </span>
          </div>

          {/* Data Table */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[#151515] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="text-left px-3 py-2 text-[#aaaaaa]">Row</th>
                    <th className="text-left px-3 py-2 text-[#aaaaaa]">File</th>
                    <th className="text-left px-3 py-2 text-[#aaaaaa]">Status</th>
                    {columns.map((column) => (
                      <th key={column} className="text-left px-3 py-2 text-[#aaaaaa]">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.stagingId} className={row.status === "conflict" ? "bg-amber-500/10" : "border-t border-[#2a2a2a]"}>
                      <td className="px-3 py-2">{row.sourceRow}</td>
                      <td className="px-3 py-2">{row.fileName}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 text-xs rounded ${row.status === "conflict" ? "bg-amber-600/30 text-amber-100" : "bg-[#2a2a2a] text-[#ddd]"}`}>
                          {row.status}
                        </span>
                        {row.conflictNote && <p className="mt-1 text-xs text-amber-200">{row.conflictNote}</p>}
                      </td>
                      {columns.map((column) => (
                        <td key={`${row.stagingId}-${column}`} className="px-3 py-2 whitespace-nowrap">{row.data[column] ?? ""}</td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={Math.max(columns.length + 3, 6)} className="px-3 py-10 text-center text-[#888]">
                        No rows in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parser Warnings */}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              <p className="font-semibold mb-1 flex items-center gap-2">
                <AlertCircle size={14} />
                Parser warnings
              </p>
              {result.errors.map((e, idx) => (
                <p key={`${e.fileName}-${idx}`}>{e.fileName}: {e.message}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
