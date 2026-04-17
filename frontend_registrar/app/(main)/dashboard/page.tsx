"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Archive, CheckCircle2, ClipboardList, RefreshCw } from "lucide-react";
import {
  bulkUploadRegistrarCsv,
  clearRegistrarEtlStaging,
  commitRegistrarEtl,
  EtlBulkUploadResponse,
  EtlUploadHistoryEntry,
  flushRegistrarDatabase,
  getRegistrarUploadHistory,
  importFaqCsvFile,
} from "../../../lib/registrar-client";
import UploadSection from "../../components/UploadSection";
import SummaryCards from "../../components/SummaryCards";
import StagedDataModal from "../../components/StagedDataModal";

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
  // Upload history state
  const [history, setHistory] = useState<EtlUploadHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // File upload state
  const [files, setFiles] = useState<File[]>([]);
  const [isParseLoading, setIsParseLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [isFlushLoading, setIsFlushLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Staging state
  const [result, setResult] = useState<EtlBulkUploadResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("students");
  const [decisions, setDecisions] = useState<Record<number, "merge" | "skip">>({});
  const [incompleteByFile, setIncompleteByFile] = useState<Record<string, boolean>>({});

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

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setIncompleteByFile((previous) => {
      const next: Record<string, boolean> = {};
      selectedFiles.forEach((file) => {
        next[file.name] = previous[file.name] ?? false;
      });
      return next;
    });
  };

  const handleParse = async () => {
    if (files.length === 0) {
      setError("Please select CSV files first.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setIsParseLoading(true);
      const faqFiles = files.filter((file) => {
        const name = file.name.toLowerCase();
        return ["faqs.csv", "consolidated_context.csv"].includes(name);
      });
      const csvFiles = files.filter((file) => {
        const name = file.name.toLowerCase();
        const isDelimited = name.endsWith(".csv");
        return isDelimited && !faqFiles.includes(file);
      });
      const incompleteFiles = csvFiles.filter((file) => incompleteByFile[file.name]).map((file) => file.name);

      let parsed: EtlBulkUploadResponse | null = null;
      if (csvFiles.length > 0) {
        parsed = await bulkUploadRegistrarCsv(csvFiles, incompleteFiles);
        setResult(parsed);
        const initialDecisions: Record<number, "merge" | "skip"> = {};
        parsed.conflicts.forEach((c) => {
          initialDecisions[c.stagingId] = "merge";
        });
        setDecisions(initialDecisions);
      } else {
        setResult(null);
        setDecisions({});
      }

      const faqMessages: string[] = [];
      for (const file of faqFiles) {
        const summary = await importFaqCsvFile(file);
        faqMessages.push(`${file.name}: imported ${summary.imported}, updated ${summary.updated}, skipped ${summary.skipped}`);
      }

      const stagingMessage = parsed ? `Staged ${parsed.files.length} file(s). Batch: ${parsed.batchId}` : "";
      const faqMessage = faqMessages.length > 0 ? `Imported FAQs from ${faqMessages.join("; ")}.` : "";
      setMessage([stagingMessage, faqMessage].filter(Boolean).join(" "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse files.");
    } finally {
      setIsParseLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!result) return;

    try {
      setError("");
      setMessage("");
      setIsSaveLoading(true);
      const requestDecisions = result.conflicts.map((c) => ({
        stagingId: c.stagingId,
        action: decisions[c.stagingId] ?? "merge",
      }));
      const summary = await commitRegistrarEtl(result.batchId, requestDecisions);
      setMessage(`Saved to database. Inserted: ${summary.inserted}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Errors: ${summary.errors}`);
      setResult(null);
      setFiles([]);
      setDecisions({});
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed.");
    } finally {
      setIsSaveLoading(false);
    }
  };

  const handleDiscard = async () => {
    if (!result) {
      setFiles([]);
      return;
    }

    try {
      await clearRegistrarEtlStaging(result.batchId);
      setResult(null);
      setFiles([]);
      setDecisions({});
      setMessage("Staging batch discarded.");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard staging data.");
    }
  };

  const handleFlushDatabase = async () => {
    const approved = window.confirm(
      "This will clear registrar and ETL data in the database and reseed default departments/programs. Continue?"
    );
    if (!approved) {
      return;
    }

    const token = window.prompt("Type FLUSH to confirm database flush:", "");
    if (token !== "FLUSH") {
      setError("Database flush canceled. Confirmation token did not match FLUSH.");
      return;
    }

    try {
      setIsFlushLoading(true);
      setError("");
      setMessage("");
      const summary = await flushRegistrarDatabase(token);
      setResult(null);
      setFiles([]);
      setDecisions({});
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

  const handleIncompleteChange = (fileName: string, checked: boolean) => {
    setIncompleteByFile((previous) => ({ ...previous, [fileName]: checked }));
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      {/* Dashboard Header */}
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
              <p className="text-sm text-gray-600 dark:text-[#aaaaaa] mb-6">Upload, stage, and manage registrar documents</p>
            </div>
            <button
              onClick={() => void loadHistory()}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] text-white dark:text-[#121212] font-semibold"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </section>
      </div>

      {/* Upload Section */}
      <UploadSection
        files={files}
        onFilesSelected={handleFilesSelected}
        onParse={handleParse}
        onCommit={handleCommit}
        onDiscard={handleDiscard}
        onFlush={handleFlushDatabase}
        isParseLoading={isParseLoading}
        isSaveLoading={isSaveLoading}
        isFlushLoading={isFlushLoading}
        hasStaged={result !== null}
        message={message}
        error={error}
        incompleteByFile={incompleteByFile}
        onIncompleteChange={handleIncompleteChange}
      />

      {/* Summary Cards */}
      <SummaryCards totals={totals} />

      {/* Upload History Table */}
      <div className="px-8 py-7 space-y-6">
        {historyError && (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
            {historyError}
          </div>
        )}

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
              {historyLoading ? (
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

      {/* Staged Data Modal */}
      <StagedDataModal
        isOpen={result !== null}
        result={result}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={handleDiscard}
        decisions={decisions}
        onDecisionChange={(stagingId, action) => setDecisions((prev) => ({ ...prev, [stagingId]: action }))}
      />
    </div>
  );
}
