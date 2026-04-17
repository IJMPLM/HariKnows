"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, FileSpreadsheet, RefreshCcw, UploadCloud } from "lucide-react";
import { EtlUploadHistoryEntry, getRegistrarUploadHistory } from "../../lib/registrar-client";

type CsvUploadHistoryPanelProps = {
  title: string;
  subtitle: string;
  categoryFilter?: string[];
  collegeCodeFilter?: string[];
  programCodeFilter?: string[];
};

export default function CsvUploadHistoryPanel({
  title,
  subtitle,
  categoryFilter,
  collegeCodeFilter,
  programCodeFilter,
}: CsvUploadHistoryPanelProps) {
  const [history, setHistory] = useState<EtlUploadHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedFilter = useMemo(
    () => (categoryFilter ?? []).map((x) => x.toLowerCase()),
    [categoryFilter]
  );
  const normalizedCollegeFilter = useMemo(
    () => (collegeCodeFilter ?? []).map((x) => x.toUpperCase()),
    [collegeCodeFilter]
  );
  const normalizedProgramFilter = useMemo(
    () => (programCodeFilter ?? []).map((x) => x.toUpperCase()),
    [programCodeFilter]
  );

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesCategory = normalizedFilter.length === 0 || normalizedFilter.includes(entry.category.toLowerCase());
      const matchesCollege = normalizedCollegeFilter.length === 0 || normalizedCollegeFilter.includes((entry.collegeCode ?? "").toUpperCase());
      const matchesProgram = normalizedProgramFilter.length === 0 || normalizedProgramFilter.includes((entry.programCode ?? "").toUpperCase());
      return matchesCategory && matchesCollege && matchesProgram;
    });
  }, [history, normalizedFilter, normalizedCollegeFilter, normalizedProgramFilter]);

  const load = async () => {
    try {
      setError("");
      setIsLoading(true);
      const rows = await getRegistrarUploadHistory(200);
      setHistory(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load CSV upload history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-5 px-8 py-7">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--muted)] mb-1">Upload Tracking</p>
                  <h1 className="text-2xl sm:text-[2rem] font-black tracking-tight leading-tight">{title}</h1>
                  <p className="text-sm text-[var(--muted)] mt-2">{subtitle}</p>
                </div>
                <button
                  onClick={() => void load()}
                  className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] text-white dark:text-[#121212] font-semibold"
                >
                  <RefreshCcw size={14} />
                  Refresh
                </button>
              </div>
            </section>

            {error && (
              <div className="rounded-xl border border-red-500/35 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                  <UploadCloud size={16} className="text-[#6e3102] dark:text-[#d4855a]" />
                  CSV Upload History
                </p>
                <p className="text-xs text-[var(--muted)]">{filteredHistory.length} record(s)</p>
              </div>

              <div className="overflow-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-[var(--card)] border-b border-[var(--line)]">
                    <tr>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">Date Uploaded</th>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">File</th>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">College</th>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">Program</th>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">Category</th>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">Rows</th>
                      <th className="text-left px-4 py-3 text-[var(--muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">Loading upload history...</td>
                      </tr>
                    )}
                    {!isLoading && filteredHistory.map((entry) => (
                      <tr key={`${entry.batchId}-${entry.fileName}-${entry.parsedAt}`} className="border-t border-[var(--line)]">
                        <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Clock3 size={13} />
                            {new Date(entry.parsedAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <FileSpreadsheet size={14} className="text-[#6e3102] dark:text-[#d4855a]" />
                            {entry.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-3 uppercase tracking-wide text-xs text-[var(--muted)]">{entry.collegeCode || "-"}</td>
                        <td className="px-4 py-3 uppercase tracking-wide text-xs text-[var(--muted)]">{entry.programCode || "-"}</td>
                        <td className="px-4 py-3 uppercase tracking-wide text-xs text-[var(--muted)]">{entry.category}</td>
                        <td className="px-4 py-3">{entry.parsedRows}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${entry.status === "error" ? "bg-red-500/15 text-red-300" : entry.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-500/15 text-zinc-300"}`}>
                              {entry.status === "error" ? "error" : entry.isActive ? "active" : "archived"}
                            </span>
                            {entry.isIncomplete ? (
                              <span className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-300">
                                incomplete
                              </span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-[var(--muted)]">
                          No upload records yet for this office.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
    </div>
  );
}
