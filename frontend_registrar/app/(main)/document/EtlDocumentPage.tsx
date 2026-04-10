"use client";

import { useMemo, useState } from "react";
import {
  bulkUploadRegistrarCsv,
  clearRegistrarEtlStaging,
  commitRegistrarEtl,
  EtlBulkUploadResponse,
  EtlRow,
  flushRegistrarDatabase,
  importFaqCsvFile,
} from "../../../lib/registrar-client";
import { AlertCircle, CheckCircle2, FileText, ListFilter, Upload, UploadCloud } from "lucide-react";

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

export default function EtlDocumentPage() {
  const [result, setResult] = useState<EtlBulkUploadResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("students");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [decisions, setDecisions] = useState<Record<number, "merge" | "skip">>({});
  const [incompleteByFile, setIncompleteByFile] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => getRows(result, activeTab), [result, activeTab]);
  const columns = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => Object.keys(row.data).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  const handleFilePick = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter((f) => {
      const name = f.name.toLowerCase();
      return name.endsWith(".csv");
    });
    setFiles(accepted);
    setIncompleteByFile((previous) => {
      const next: Record<string, boolean> = {};
      accepted.forEach((file) => {
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
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!result) return;

    try {
      setError("");
      setMessage("");
      setIsSaving(true);
      const requestDecisions = result.conflicts.map((c) => ({
        stagingId: c.stagingId,
        action: decisions[c.stagingId] ?? "merge",
      }));
      const summary = await commitRegistrarEtl(result.batchId, requestDecisions);
      setMessage(`Saved to database. Inserted: ${summary.inserted}, Updated: ${summary.updated}, Skipped: ${summary.skipped}, Errors: ${summary.errors}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed.");
    } finally {
      setIsSaving(false);
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
      setIsFlushing(true);
      setError("");
      setMessage("");
      const summary = await flushRegistrarDatabase(token);
      setResult(null);
      setFiles([]);
      setDecisions({});
      setMessage(
        `Database flushed. Students: ${summary.deletedStudents}, Curriculums: ${summary.deletedCurriculumCourses}, Staging rows: ${summary.deletedStagingRows}, Documents: ${summary.deletedDocuments}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to flush database.");
    } finally {
      setIsFlushing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-8 pt-8 pb-0">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#aaaaaa] mb-2">
          <FileText size={12} />
          REGISTRAR · DOCUMENT MANAGEMENT
        </div>
          <h1 className="text-3xl lg:text-[2rem] font-extrabold tracking-tight leading-tight text-white mb-1">
          Unified Delimited Upload &amp; <span className="text-[#e8834a]">Staging</span>
        </h1>
        <p className="text-sm text-[#aaaaaa] mb-6">
          Drag and drop multiple CSV files once. The backend auto-categorizes by metadata and stages records for review before save.
        </p>
      </div>

      <div className="px-8 py-7 space-y-5">
        <div
          className={`rounded-xl border-2 border-dashed p-5 transition-all ${isDragOver ? "border-[#e8834a] bg-[#1f1713]" : "border-[#2a2a2a] bg-[#161616]"}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFilePick(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#e8834a]" />
                Drop CSV files here
              </p>
              <p className="text-xs text-[#aaaaaa] mt-1">Registrar data files stage as usual. faq/context CSV files import into the registrar FAQ tab.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="bulk-csv"
                type="file"
                accept=".csv"
                multiple
                className="hidden"
                onChange={(e) => handleFilePick(e.target.files)}
              />
              <label htmlFor="bulk-csv" className="px-4 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-sm cursor-pointer">
                Select files
              </label>
              <button
                onClick={handleParse}
                disabled={isLoading || files.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[#e8834a] hover:bg-[#d97639] disabled:opacity-50 text-[#121212] text-sm font-semibold flex items-center gap-2"
              >
                <Upload size={14} />
                {isLoading ? "Parsing..." : "Parse to staging"}
              </button>
              <button
                onClick={handleCommit}
                disabled={!result || isSaving}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#121212] text-sm font-semibold"
              >
                {isSaving ? "Saving..." : "Confirm & Save"}
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-sm"
              >
                Discard
              </button>
              <button
                onClick={handleFlushDatabase}
                disabled={isFlushing}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-semibold"
              >
                {isFlushing ? "Flushing..." : "Flush Database"}
              </button>
            </div>
          </div>
          <p className="text-xs text-[#aaaaaa] mt-3">
            Selected: {files.length === 0 ? "none" : files.map((f) => f.name).join(", ")}
          </p>
          {files.length > 0 && (
            <div className="mt-3 border border-[#2a2a2a] rounded-xl p-3 bg-[#111] space-y-2">
              <p className="text-xs uppercase tracking-wider text-[#aaaaaa]">Upload flags</p>
              {files.map((file) => (
                <label key={file.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#ddd] truncate">{file.name}</span>
                  <span className="inline-flex items-center gap-2 text-xs text-[#bbbbbb]">
                    <input
                      type="checkbox"
                      checked={Boolean(incompleteByFile[file.name])}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setIncompleteByFile((previous) => ({ ...previous, [file.name]: checked }));
                      }}
                    />
                    Mark as incomplete
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {message && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {result && (
          <>
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
                          onClick={() => setDecisions((prev) => ({ ...prev, [conflict.stagingId]: "merge" }))}
                          className={`px-3 py-1.5 ${
                            (decisions[conflict.stagingId] ?? "merge") === "merge"
                              ? "bg-amber-300 text-[#121212]"
                              : "bg-transparent text-amber-100"
                          }`}
                        >
                          Merge
                        </button>
                        <button
                          onClick={() => setDecisions((prev) => ({ ...prev, [conflict.stagingId]: "skip" }))}
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

            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((tab) => {
                const count = getRows(result, tab.key).length;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                      activeTab === tab.key
                        ? "bg-[#e8834a] text-[#121212] border-[#e8834a]"
                        : "bg-[#1a1a1a] border-[#2a2a2a] text-[#d0d0d0]"
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
              <span className="ml-auto inline-flex items-center gap-2 text-xs text-[#aaaaaa]">
                <ListFilter className="w-3.5 h-3.5" />
                Conflicts: {result.conflicts.length}
              </span>
            </div>

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

            {result.errors.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                <p className="font-semibold mb-1">Parser warnings</p>
                {result.errors.map((e, idx) => (
                  <p key={`${e.fileName}-${idx}`}>{e.fileName}: {e.message}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
