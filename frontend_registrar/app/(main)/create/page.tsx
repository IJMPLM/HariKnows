"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  Pencil,
  Search,
  Upload,
  Users,
  X,
  ChevronDown
} from "lucide-react";
import {
  importIctoAccounts,
  searchStudents,
  updateStudentCredentials,
  type StudentDirectoryEntry,
} from "../../../lib/registrar-client";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";
type AccountForm = {
  studentNo: string;
  password: string;
};

const PAGE_SIZE = 8;

const EMPTY_FORM: AccountForm = {
  studentNo: "",
  password: "",
};

const SORT_LABEL_TO_KEY: Record<string, SortKey> = {
  "Newest first": "newest",
  "Oldest first": "oldest",
  "Name A - Z": "name-asc",
  "Name Z - A": "name-desc",
};

const SORT_KEY_TO_LABEL: Record<SortKey, string> = {
  "newest": "Newest first",
  "oldest": "Oldest first",
  "name-asc": "Name A - Z",
  "name-desc": "Name Z - A",
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullName(student: StudentDirectoryEntry) {
  return student.fullName || student.studentNo;
}

// --- REUSABLE CUSTOM SELECT COMPONENT ---
function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#101014] text-sm font-medium flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40 transition-all"
      >
        <span className="truncate block">{value}</span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 w-48 mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 cursor-pointer transition-colors text-sm flex items-center ${
                value === option
                  ? "bg-gray-100 dark:bg-white/10 text-[#6e3102] dark:text-[#d4855a] font-bold"
                  : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ----------------------------------------

export default function StudentPage() {
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCollege, setActiveCollege] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const rows = await searchStudents("", 500);
      setStudents(rows);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load student accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const collegeOptions = useMemo(() => {
    const values = Array.from(new Set(students.map((student) => student.collegeCode).filter(Boolean))).sort();
    return ["All", ...values];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let next = [...students];

    if (activeCollege !== "All") {
      next = next.filter((student) => student.collegeCode === activeCollege);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      next = next.filter((student) => {
        return (
          student.studentNo.toLowerCase().includes(query) ||
          student.fullName.toLowerCase().includes(query) ||
          student.programCode.toLowerCase().includes(query)
        );
      });
    }

    next.sort((left, right) => {
      if (sortKey === "newest") {
        return new Date(right.dateCreated).getTime() - new Date(left.dateCreated).getTime();
      }

      if (sortKey === "oldest") {
        return new Date(left.dateCreated).getTime() - new Date(right.dateCreated).getTime();
      }

      const leftName = fullName(left);
      const rightName = fullName(right);
      return sortKey === "name-desc" ? rightName.localeCompare(leftName) : leftName.localeCompare(rightName);
    });

    return next;
  }, [activeCollege, searchQuery, sortKey, students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCollege, sortKey]);

  const openCreateModal = (student?: StudentDirectoryEntry) => {
    if (!student) {
      setAccountError("Select a student from the table and use Edit to update password.");
      setAccountMessage("");
      return;
    }

    setShowCreateModal(true);
    setAccountError("");
    setAccountMessage("");
    setShowPassword(false);
    setForm({
      studentNo: student.studentNo,
      password: "",
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setAccountError("");
    setAccountMessage("");
  };

  const handleSubmitAccount = async () => {
    if (!form.studentNo.trim() || !form.password.trim()) {
      setAccountError("Student number and password are required.");
      setAccountMessage("");
      return;
    }

    try {
      setSavingAccount(true);
      setAccountError("");
      setAccountMessage("");
      await updateStudentCredentials(form.studentNo.trim(), {
        password: form.password,
      });
      setAccountMessage(`Credentials updated for ${form.studentNo.trim()}.`);
      await loadAccounts();
      setForm((previous) => ({ ...previous, password: "" }));
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to save student credentials.");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleFilePick = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const file = fileList[0];
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Only CSV files are accepted.");
      setUploadMessage("");
      return;
    }

    setUploadedFile(file);
    setUploadError("");
    setUploadMessage("");
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      setUploadError("Choose an ICTO CSV file first.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadMessage("");
      const summary = await importIctoAccounts(uploadedFile);
      setUploadMessage(
        `Imported ${summary.imported}, updated ${summary.updated}, skipped ${summary.skipped}, not found ${summary.notFound}.`,
      );
      if (summary.errors.length > 0) {
        setUploadMessage((previous) => `${previous} ${summary.errors.slice(0, 3).join(" ")}`);
      }
      setUploadedFile(null);
      await loadAccounts();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to import ICTO CSV.");
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setShowUploadModal(false);
    setUploadedFile(null);
    setUploadError("");
    setUploadMessage("");
  };

  const currentRangeStart = filteredStudents.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const currentRangeEnd = Math.min(currentPage * PAGE_SIZE, filteredStudents.length);

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="pt-16 lg:pt-0 px-5 lg:px-8 py-6 space-y-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur p-5 sm:p-6 shadow-sm" aria-labelledby="page-heading">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#6e3102] dark:text-[#d4855a] flex items-center gap-2">
                  <Users size={13} aria-hidden="true" /> Student account management
                </p>
                <h1 id="page-heading" className="text-3xl font-extrabold tracking-tight">
                  Student Accounts
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage existing student credentials, upload ICTO CSV updates, and review the live account list from the database.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  aria-label="Upload ICTO CSV file"
                >
                  <Upload size={16} aria-hidden="true" /> Upload CSV
                </button>
              </div>
            </div>
          </section>

          {(loadError || uploadMessage || uploadError || accountMessage || accountError) && (
            <div className="space-y-3">
              {loadError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {loadError}
                </div>
              )}
              {uploadMessage && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {uploadMessage}
                </div>
              )}
              {uploadError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </div>
              )}
              {accountMessage && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {accountMessage}
                </div>
              )}
              {accountError && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {accountError}
                </div>
              )}
            </div>
          )}

          <section className="rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-sm p-5 space-y-4" aria-label="Student accounts table">
            <div className="flex items-center gap-3 flex-wrap border-b border-gray-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#101014] rounded-2xl p-1 shrink-0 overflow-x-auto">
                {collegeOptions.map((college) => (
                  <button
                    key={college}
                    onClick={() => setActiveCollege(college)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      activeCollege === college
                        ? "bg-white dark:bg-[#18181b] text-[#6e3102] dark:text-[#d4855a] shadow-sm"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {college}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
                <label htmlFor="student-search" className="sr-only">
                  Search students
                </label>
                <input
                  id="student-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, student no., or program..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                />
              </div>

              {/* --- NEW CUSTOM DROPDOWN --- */}
              <div className="shrink-0 w-44 z-20">
                <CustomSelect
                  value={SORT_KEY_TO_LABEL[sortKey]}
                  options={["Newest first", "Oldest first", "Name A - Z", "Name Z - A"]}
                  onChange={(label) => setSortKey(SORT_LABEL_TO_KEY[label] as SortKey)}
                />
              </div>
            </div>

            <div className="overflow-x-auto" role="region" aria-label="Student accounts data">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-gray-500 border-b border-gray-200 dark:border-white/10">
                    <th scope="col" className="py-3 pr-4 font-semibold">Student No.</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Name</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Program</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Created</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Password</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">
                        Loading student accounts...
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr key={student.studentNo} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors align-middle">
                        <td className="py-4 pr-4 font-mono text-sm font-medium text-[#6e3102] dark:text-[#d4855a]">
                          {student.studentNo}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-sm">{fullName(student)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{student.collegeCode}</div>
                        </td>
                        <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">{student.programCode}</td>
                        <td className="py-4 pr-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(student.dateCreated)}</td>
                        <td className="py-4 pr-4 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                              !student.hasPassword
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                : student.isPasswordConfigured
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {!student.hasPassword ? "Missing" : student.isPasswordConfigured ? "Configured" : "Temporary"}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-sm">
                          <button
                            onClick={() => openCreateModal(student)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <Pencil size={14} aria-hidden="true" /> Set Password
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-2 flex-wrap" aria-label="Pagination">
                <p className="text-xs text-gray-500">
                  Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{currentRangeStart}-{currentRangeEnd}</span> of <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredStudents.length}</span> students
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-2 text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
          <div className="absolute inset-0 bg-black/45" onClick={cancelUpload} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Bulk import</p>
                <h2 id="upload-modal-title" className="text-xl font-extrabold">Upload ICTO CSV</h2>
              </div>
              <button onClick={cancelUpload} className="p-2 rounded-xl bg-gray-100 dark:bg-[#242428] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" aria-label="Close upload modal">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFilePick(event.dataTransfer.files);
              }}
              onClick={() => document.getElementById("icto-file")?.click()}
              role="button"
              tabIndex={0}
              aria-label="Drag and drop an ICTO CSV file or click to browse"
              className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors border-gray-300 dark:border-white/20 hover:border-[#6e3102]/50 dark:hover:border-[#d4855a]/50 bg-gray-50 dark:bg-[#101014]"
            >
              <input
                id="icto-file"
                type="file"
                accept=".csv"
                onChange={(event) => handleFilePick(event.target.files)}
                className="sr-only"
              />
              {uploadedFile ? (
                <>
                  <FileSpreadsheet size={36} className="text-emerald-500" aria-hidden="true" />
                  <div className="text-center">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </>
              ) : (
                <>
                  <CloudUpload size={36} className="text-gray-400" aria-hidden="true" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Drop the ICTO CSV here</p>
                    <p className="text-xs text-gray-400 mt-1">Headers should include student number and password.</p>
                  </div>
                </>
              )}
            </div>

            {uploadError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </div>
            )}

            {uploadMessage && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {uploadMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={cancelUpload} className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                disabled={!uploadedFile || uploading}
                onClick={() => void handleUpload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {uploading ? "Importing..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
          <div className="absolute inset-0 bg-black/45" onClick={closeCreateModal} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">Manual entry</p>
                <h2 id="create-modal-title" className="text-xl font-extrabold">Create or Overwrite Account</h2>
              </div>
              <button onClick={closeCreateModal} className="p-2 rounded-xl bg-gray-100 dark:bg-[#242428] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" aria-label="Close create account modal">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="student-no" className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5">Student Number</label>
                <input
                  id="student-no"
                  type="text"
                  value={form.studentNo}
                  disabled
                  readOnly
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#0f0f12] text-sm text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="student-password" className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="student-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                    placeholder="Set a temporary password"
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm font-semibold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Registrar-set passwords are temporary by default. The status becomes Configured only after the student changes password in Helpdesk.
              </p>
            </div>

            {accountError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {accountError}
              </div>
            )}

            {accountMessage && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {accountMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={closeCreateModal} className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button
                disabled={savingAccount}
                onClick={() => void handleSubmitAccount()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {savingAccount ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}