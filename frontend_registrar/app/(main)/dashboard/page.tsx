"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Archive, CheckCircle2, ClipboardList, RefreshCw } from "lucide-react";
import { getRegistrarUploadHistory, type EtlUploadHistoryEntry } from "../../../lib/registrar-client";

type SummaryRow = {
  key: string;
  office: string;
  college: string;
  program: string;
  active: number;
  archived: number;
  incomplete: number;
  errors: number;
  total: number;
  lastUpdated: string;
};

function officeFromCategory(category: string) {
  const lowered = category.toLowerCase();
  if (lowered === "admissions") return "AO";
  if (lowered === "discipline") return "OSDS";
  if (lowered === "service") return "NSTP";
  if (lowered === "technology") return "ICTO";
  if (lowered === "departments") return "OUR";
  return "OUR";
}

export default function DashboardPage() {
  const [history, setHistory] = useState<EtlUploadHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const rows = await getRegistrarUploadHistory(500);
      setHistory(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const summaryRows = useMemo(() => {
    const grouped = new Map<string, SummaryRow>();

    for (const row of history) {
      const office = officeFromCategory(row.category);
      const college = row.collegeCode || "-";
      const program = row.programCode || "-";
      const key = `${office}|${college}|${program}`;
      const existing = grouped.get(key) ?? {
        key,
        office,
        college,
        program,
        active: 0,
        archived: 0,
        incomplete: 0,
        errors: 0,
        total: 0,
        lastUpdated: row.parsedAt,
      };

      existing.total += 1;
      if (row.status === "error") {
        existing.errors += 1;
      } else if (row.isActive) {
        existing.active += 1;
      } else {
        existing.archived += 1;
      }

      if (row.isIncomplete) {
        existing.incomplete += 1;
      }

      if (new Date(row.parsedAt).getTime() > new Date(existing.lastUpdated).getTime()) {
        existing.lastUpdated = row.parsedAt;
      }

      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const officeCmp = a.office.localeCompare(b.office);
      if (officeCmp !== 0) return officeCmp;
      const collegeCmp = a.college.localeCompare(b.college);
      if (collegeCmp !== 0) return collegeCmp;
      return a.program.localeCompare(b.program);
    });
  }, [history]);

  const totals = useMemo(() => {
    return summaryRows.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.active += row.active;
        acc.archived += row.archived;
        acc.incomplete += row.incomplete;
        acc.errors += row.errors;
        return acc;
      },
      { total: 0, active: 0, archived: 0, incomplete: 0, errors: 0 }
    );
  }, [summaryRows]);

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="px-8 py-7">
        <section className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-600 dark:text-[#aaaaaa] mb-2">
            <ClipboardList size={12} />
            REGISTRAR · UPLOAD DASHBOARD
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl lg:text-[2rem] font-extrabold tracking-tight leading-tight text-gray-900 dark:text-white mb-1">
                Document Upload <span className="text-[#6e3102] dark:text-[#d4855a]">Dashboard</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-[#aaaaaa] mb-6">Overall status across offices and colleges</p>
            </div>
          <button
            onClick={() => void load()}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] text-white dark:text-[#121212] font-semibold"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        </section>
      </div>

      <div className="px-8 py-7 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]"><p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Total</p><p className="text-3xl font-extrabold mt-2">{totals.total}</p></div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]"><p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Active</p><p className="text-3xl font-extrabold mt-2 text-emerald-400">{totals.active}</p></div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]"><p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Archived</p><p className="text-3xl font-extrabold mt-2 text-zinc-300">{totals.archived}</p></div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]"><p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Incomplete</p><p className="text-3xl font-extrabold mt-2 text-amber-300">{totals.incomplete}</p></div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a]"><p className="text-xs text-gray-600 dark:text-[#aaaaaa] uppercase tracking-wide">Errors</p><p className="text-3xl font-extrabold mt-2 text-red-400">{totals.errors}</p></div>
        </div>

        <section className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#222222]/50">
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Office</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">College</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Program</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Active</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Archived</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Incomplete</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Errors</th>
                <th className="text-left p-4 text-gray-900 dark:text-white font-bold text-sm">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center text-gray-600 dark:text-[#aaaaaa] py-8">Loading dashboard...</td></tr>
              ) : summaryRows.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-gray-600 dark:text-[#aaaaaa] py-8">No upload records found.</td></tr>
              ) : (
                summaryRows.map((row) => (
                  <tr key={row.key} className="border-t border-gray-200 dark:border-[#2a2a2a]">
                    <td className="p-4"><span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-gray-600 dark:text-[#aaaaaa]"><ClipboardList size={12} />{row.office}</span></td>
                    <td className="p-4 uppercase text-xs text-gray-700 dark:text-[#d2d2d2]">{row.college}</td>
                    <td className="p-4 uppercase text-xs text-gray-700 dark:text-[#d2d2d2]">{row.program}</td>
                    <td className="p-4"><span className="inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 size={14} />{row.active}</span></td>
                    <td className="p-4"><span className="inline-flex items-center gap-1 text-zinc-300"><Archive size={14} />{row.archived}</span></td>
                    <td className="p-4"><span className="inline-flex items-center gap-1 text-amber-300"><AlertCircle size={14} />{row.incomplete}</span></td>
                    <td className="p-4 text-red-300">{row.errors}</td>
                    <td className="p-4 text-gray-600 dark:text-[#aaaaaa] text-xs">{new Date(row.lastUpdated).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
