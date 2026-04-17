"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Archive, CheckCircle2, ClipboardList, LayoutGrid, RefreshCw, Upload } from "lucide-react";
import {
  bulkUploadRegistrarCsv,
  commitRegistrarEtl,
  EtlUploadHistoryEntry,
  flushRegistrarDatabase,
  getRegistrarEtlStaging,
  getRegistrarUploadHistory,
  importFaqCsvFile,
} from "../../../lib/registrar-client";
import SummaryCards from "../../components/SummaryCards";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type OfficeRow = {
  key: string;
  office: string;
  record: string;
  active: number;
  archived: number;
  incomplete: number;
  errors: number;
  total: number;
  lastUpdated: string;
};

type CollegeRow = {
  key: string;
  college: string;
  program: string;
  active: number;
  archived: number;
  incomplete: number;
  errors: number;
  total: number;
  lastUpdated: string;
};

type TableTab = "offices" | "colleges";

// ── Helpers ───────────────────────────────────────────────────────────────────

function officeFromCategory(category: string) {
  const lowered = category.toLowerCase();
  if (lowered === "admissions") return "AO";
  if (lowered === "discipline") return "OSDS";
  if (lowered === "service") return "NSTP";
  if (lowered === "technology") return "ICTO";
  if (lowered === "departments") return "OUR";
  return "OUR";
}

function recordFromCategory(category: string) {
  const lowered = category.toLowerCase();
  if (lowered === "admissions") return "Admissions";
  if (lowered === "discipline") return "Discipline";
  if (lowered === "service") return "Service";
  if (lowered === "technology") return "Technology";
  if (lowered === "departments") return "Departments";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ── Shared stat columns (avoids repetition in both tables) ────────────────────

const TH = "text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500";

function StatCells({
  active,
  archived,
  incomplete,
  errors,
  lastUpdated,
}: {
  active: number;
  archived: number;
  incomplete: number;
  errors: number;
  lastUpdated: string;
}) {
  return (
    <>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 size={13} aria-hidden="true" />
          {active}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 font-semibold">
          <Archive size={13} aria-hidden="true" />
          {archived}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-semibold">
          <AlertCircle size={13} aria-hidden="true" />
          {incomplete}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm text-red-600 dark:text-red-400 font-semibold">{errors}</td>
      <td className="px-5 py-3.5 text-xs text-gray-400 dark:text-gray-500">
        <div className="flex flex-col gap-0.5">
          <span>{new Date(lastUpdated).toLocaleDateString()}</span>
          <span className="text-[11px] opacity-70">{new Date(lastUpdated).toLocaleTimeString()}</span>
        </div>
      </td>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [history, setHistory] = useState<EtlUploadHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [tableTab, setTableTab] = useState<TableTab>("offices");

  const [files, setFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isFlushLoading, setIsFlushLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errorReport, setErrorReport] = useState<string[]>([]);
  const [incompleteByFile, setIncompleteByFile] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data ────────────────────────────────────────────────────────────────────

  const loadHistory = async () => {
    try {
      setHistoryError("");
      setHistoryLoading(true);
      const rows = await getRegistrarUploadHistory(500);
      setHistory(rows);
    } catch (loadError) {
      setHistoryError(loadError instanceof Error ? loadError.message : "Failed to load dashboard status.");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  // summaryRows + totals kept exactly as before (feeds SummaryCards)
  const summaryRows = useMemo(() => {
    const grouped = new Map<string, SummaryRow>();
    for (const row of history) {
      const office = officeFromCategory(row.category);
      const college = row.collegeCode || "-";
      const program = row.programCode || "-";
      const key = `${office}|${college}|${program}`;
      const existing = grouped.get(key) ?? {
        key, office, college, program,
        active: 0, archived: 0, incomplete: 0, errors: 0, total: 0,
        lastUpdated: row.parsedAt,
      };
      existing.total += 1;
      if (row.status === "error") existing.errors += 1;
      else if (row.isActive) existing.active += 1;
      else existing.archived += 1;
      if (row.isIncomplete) existing.incomplete += 1;
      if (new Date(row.parsedAt).getTime() > new Date(existing.lastUpdated).getTime())
        existing.lastUpdated = row.parsedAt;
      grouped.set(key, existing);
    }
    return Array.from(grouped.values()).sort((a, b) => {
      const o = a.office.localeCompare(b.office);
      if (o !== 0) return o;
      const c = a.college.localeCompare(b.college);
      if (c !== 0) return c;
      return a.program.localeCompare(b.program);
    });
  }, [history]);

  const totals = useMemo(
    () =>
      summaryRows.reduce(
        (acc, row) => {
          acc.total += row.total;
          acc.active += row.active;
          acc.archived += row.archived;
          acc.incomplete += row.incomplete;
          acc.errors += row.errors;
          return acc;
        },
        { total: 0, active: 0, archived: 0, incomplete: 0, errors: 0 }
      ),
    [summaryRows]
  );

  // Offices tab — grouped by office + category
  const officeRows = useMemo<OfficeRow[]>(() => {
    const grouped = new Map<string, OfficeRow>();
    for (const row of history) {
      const office = officeFromCategory(row.category);
      const record = recordFromCategory(row.category);
      const key = `${office}|${row.category}`;
      const existing = grouped.get(key) ?? {
        key, office, record,
        active: 0, archived: 0, incomplete: 0, errors: 0, total: 0,
        lastUpdated: row.parsedAt,
      };
      existing.total += 1;
      if (row.status === "error") existing.errors += 1;
      else if (row.isActive) existing.active += 1;
      else existing.archived += 1;
      if (row.isIncomplete) existing.incomplete += 1;
      if (new Date(row.parsedAt).getTime() > new Date(existing.lastUpdated).getTime())
        existing.lastUpdated = row.parsedAt;
      grouped.set(key, existing);
    }
    return Array.from(grouped.values()).sort((a, b) => {
      const o = a.office.localeCompare(b.office);
      return o !== 0 ? o : a.record.localeCompare(b.record);
    });
  }, [history]);

  // Colleges tab — grouped by college + program
  const collegeRows = useMemo<CollegeRow[]>(() => {
    const grouped = new Map<string, CollegeRow>();
    for (const row of history) {
      const college = row.collegeCode || "-";
      const program = row.programCode || "-";
      const key = `${college}|${program}`;
      const existing = grouped.get(key) ?? {
        key, college, program,
        active: 0, archived: 0, incomplete: 0, errors: 0, total: 0,
        lastUpdated: row.parsedAt,
      };
      existing.total += 1;
      if (row.status === "error") existing.errors += 1;
      else if (row.isActive) existing.active += 1;
      else existing.archived += 1;
      if (row.isIncomplete) existing.incomplete += 1;
      if (new Date(row.parsedAt).getTime() > new Date(existing.lastUpdated).getTime())
        existing.lastUpdated = row.parsedAt;
      grouped.set(key, existing);
    }
    return Array.from(grouped.values()).sort((a, b) => {
      const c = a.college.localeCompare(b.college);
      return c !== 0 ? c : a.program.localeCompare(b.program);
    });
  }, [history]);

  // ── Upload handlers (unchanged logic) ───────────────────────────────────────

  const applySelectedFiles = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setIncompleteByFile((prev) => {
      const next: Record<string, boolean> = {};
      selectedFiles.forEach((f) => { next[f.name] = prev[f.name] ?? false; });
      return next;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) applySelectedFiles(selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
    if (dropped.length > 0) applySelectedFiles(dropped);
  };

  const handleSave = async () => {
    if (files.length === 0) { setError("Please select CSV files first."); return; }
    try {
      setError(""); setMessage(""); setErrorReport([]);
      setIsSaving(true); setIsSaveLoading(true);

      const faqFiles = files.filter((f) =>
        ["faqs.csv", "consolidated_context.csv"].includes(f.name.toLowerCase())
      );
      const csvFiles = files.filter((f) => f.name.toLowerCase().endsWith(".csv") && !faqFiles.includes(f));
      const incompleteFiles = csvFiles.filter((f) => incompleteByFile[f.name]).map((f) => f.name);
      const reportLines: string[] = [];

      if (csvFiles.length > 0) {
        const parsed = await bulkUploadRegistrarCsv(csvFiles, incompleteFiles);
        reportLines.push(
          ...parsed.errors.map((e) => `${e.fileName}${e.row > 0 ? ` (row ${e.row})` : ""}: ${e.message}`)
        );
        reportLines.push(
          ...parsed.files
            .filter((e) => e.status.toLowerCase() === "error" && e.error.trim().length > 0)
            .map((e) => `${e.fileName}: ${e.error}`)
        );
        const decisions = parsed.conflicts.map((c) => ({ stagingId: c.stagingId, action: "merge" }));
        const summary = await commitRegistrarEtl(parsed.batchId, decisions);
        const staged = await getRegistrarEtlStaging(parsed.batchId);
        reportLines.push(
          ...Object.values(staged).flat()
            .filter((r) => r.status === "error")
            .map((r) => `${r.fileName} (row ${r.sourceRow}): ${r.error || "Commit failed for this row."}`)
        );
        setMessage(`Saved to database. Inserted: ${summary.inserted}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Errors: ${summary.errors}`);
      }

      const faqMessages: string[] = [];
      for (const file of faqFiles) {
        const s = await importFaqCsvFile(file);
        faqMessages.push(`${file.name}: imported ${s.imported}, updated ${s.updated}, skipped ${s.skipped}`);
      }
      if (faqMessages.length > 0) {
        const msg = `Imported FAQs from ${faqMessages.join("; ")}.`;
        setMessage((prev) => (prev ? `${prev} ${msg}` : msg));
      }

      setErrorReport(reportLines);
      setFiles([]);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save files.");
    } finally {
      setIsSaving(false); setIsSaveLoading(false);
    }
  };

  const handleClearSelection = () => { setFiles([]); setError(""); setMessage(""); setErrorReport([]); };

  const handleFlushDatabase = async () => {
    const approved = window.confirm(
      "This will clear registrar and ETL data in the database and reseed default departments/programs. Continue?"
    );
    if (!approved) return;
    const token = window.prompt("Type FLUSH to confirm database flush:", "");
    if (token !== "FLUSH") { setError("Database flush canceled. Confirmation token did not match FLUSH."); return; }
    try {
      setIsFlushLoading(true); setError(""); setMessage("");
      const summary = await flushRegistrarDatabase(token);
      setFiles([]);
      setMessage(
        `Database flushed. Students: ${summary.deletedStudents}, Curriculums: ${summary.deletedCurriculumCourses}, Staging rows: ${summary.deletedStagingRows}, Documents: ${summary.deletedDocuments}.`
      );
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flush database.");
    } finally {
      setIsFlushLoading(false);
    }
  };

  const handleIncompleteChange = (fileName: string, checked: boolean) =>
    setIncompleteByFile((prev) => ({ ...prev, [fileName]: checked }));

  // ── Render ──────────────────────────────────────────────────────────────────

  const TABS = [
    { id: "offices" as TableTab, label: "Offices" },
    { id: "colleges" as TableTab, label: "Colleges" },
  ];

  const STAT_HEADERS = (
    <>
      <th className={TH}>Active</th>
      <th className={TH}>Archived</th>
      <th className={TH}>Incomplete</th>
      <th className={TH}>Errors</th>
      <th className={TH}>Last Updated</th>
    </>
  );

  const isNoData = !historyLoading && history.length === 0;

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="pt-16 lg:pt-0 px-5 lg:px-8 py-6 space-y-6">

        {/* ── Header ── */}
        <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#6e3102] dark:text-[#d4855a] flex items-center gap-2">
                <LayoutGrid size={13} aria-hidden="true" /> Registrar · Upload Dashboard
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Document Upload Dashboard
              </h1>
            </div>
            <button
              onClick={() => void loadHistory()}
              aria-label="Refresh"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* ── Upload Card ── */}
        <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6">
          {/* Top row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                Drop CSV files here
              </h2>
              <button
                onClick={() => void handleFlushDatabase()}
                disabled={isFlushLoading}
                title="Flush Database"
                aria-label="Flush Database"
                className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-150 bg-gray-900 dark:bg-white hover:bg-red-500 dark:hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2">
              {files.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Upload size={14} aria-hidden="true" />
                  Upload Files
                </button>
              ) : (
                <>
                  <button
                    onClick={handleClearSelection}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => void handleSave()}
                    disabled={isSaving || isSaveLoading}
                    className="px-4 py-2 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isSaveLoading ? "Saving…" : "Confirm"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subtitle — 2 lines */}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Registrar data files now save in one step with automatic conflict merging.<br />
            FAQ/context CSV files import into the registrar FAQ tab.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            multiple
            className="sr-only"
            aria-hidden="true"
            onChange={handleFileInputChange}
          />

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => files.length === 0 && fileInputRef.current?.click()}
            className={[
              "mt-4 rounded-xl border-2 border-dashed transition-colors duration-150",
              isDragging
                ? "border-[#6e3102] dark:border-[#d4855a] bg-[#6e3102]/5 dark:bg-[#d4855a]/5"
                : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]",
              files.length === 0 ? "cursor-pointer" : "",
            ].join(" ")}
          >
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 select-none">
                <Upload size={22} className="text-gray-300 dark:text-white/20" aria-hidden="true" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Drag &amp; drop CSV files, or{" "}
                  <span className="text-[#6e3102] dark:text-[#d4855a] font-semibold underline underline-offset-2">
                    browse
                  </span>
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06] px-4">
                {files.map((file) => (
                  <li key={file.name} className="flex items-center gap-3 py-3">
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate font-mono">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <label className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={incompleteByFile[file.name] ?? false}
                        onChange={(e) => handleIncompleteChange(file.name, e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-[#6e3102] dark:accent-[#d4855a]"
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500">Incomplete</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {message && (
            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </section>

        {/* ── Error Report ── */}
        {errorReport.length > 0 && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-100 px-4 py-3 text-sm">
            <p className="font-semibold mb-2">Error report</p>
            {errorReport.map((entry, index) => (
              <p key={`${entry}-${index}`}>{entry}</p>
            ))}
          </div>
        )}

        {/* ── Summary Cards ── */}
        <SummaryCards totals={totals} />

        {/* ── History table with Offices / Colleges tabs ── */}
        <div className="space-y-4">
          {historyError && (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-200 px-4 py-3 text-sm">
              {historyError}
            </div>
          )}

          <section
            className="bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 flex flex-col"
            style={{ minHeight: "320px" }}
          >
            {/* Tab bar — same pattern as registrar.tsx */}
            <div className="flex items-center px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div
                className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex gap-1"
                role="tablist"
                aria-label="History view"
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={tableTab === tab.id}
                    onClick={() => setTableTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      tableTab === tab.id
                        ? "bg-white dark:bg-[#242428] text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table area */}
            <div className="overflow-x-auto flex-1">

              {/* ── Offices tab ── */}
              {tableTab === "offices" && (
                <table className="w-full min-w-[700px]" role="table">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                      <th className={TH}>Office</th>
                      <th className={TH}>Record</th>
                      {STAT_HEADERS}
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <div
                              className="w-6 h-6 border-2 border-[#6e3102] dark:border-[#d4855a] border-t-transparent rounded-full animate-spin"
                              role="status"
                              aria-label="Loading"
                            />
                            <span>Loading dashboard…</span>
                          </div>
                        </td>
                      </tr>
                    ) : isNoData || officeRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                          No upload records found.
                        </td>
                      </tr>
                    ) : (
                      officeRows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-t border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">
                              <ClipboardList size={11} aria-hidden="true" />
                              {row.office}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-200 font-medium">
                            {row.record}
                          </td>
                          <StatCells
                            active={row.active}
                            archived={row.archived}
                            incomplete={row.incomplete}
                            errors={row.errors}
                            lastUpdated={row.lastUpdated}
                          />
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* ── Colleges tab ── */}
              {tableTab === "colleges" && (
                <table className="w-full min-w-[700px]" role="table">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                      <th className={TH}>College</th>
                      <th className={TH}>Program</th>
                      {STAT_HEADERS}
                    </tr>
                  </thead>
                  <tbody>
                    {historyLoading ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                          <div className="flex flex-col items-center gap-3">
                            <div
                              className="w-6 h-6 border-2 border-[#6e3102] dark:border-[#d4855a] border-t-transparent rounded-full animate-spin"
                              role="status"
                              aria-label="Loading"
                            />
                            <span>Loading dashboard…</span>
                          </div>
                        </td>
                      </tr>
                    ) : isNoData || collegeRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center text-sm text-gray-400 dark:text-gray-500">
                          No college records found.
                        </td>
                      </tr>
                    ) : (
                      collegeRows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-t border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <span className="text-xs uppercase tracking-wide text-gray-700 dark:text-gray-200 font-semibold">
                              {row.college}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm uppercase text-gray-700 dark:text-gray-200 font-medium">
                            {row.program}
                          </td>
                          <StatCells
                            active={row.active}
                            archived={row.archived}
                            incomplete={row.incomplete}
                            errors={row.errors}
                            lastUpdated={row.lastUpdated}
                          />
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </div>
          </section>
        </div>

      </div>
    </div>
  );
}