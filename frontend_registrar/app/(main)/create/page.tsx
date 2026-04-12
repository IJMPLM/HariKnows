"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Users,
  Upload,
  Search,
  X,
  Eye,
  EyeOff,
  CloudUpload,
  FileSpreadsheet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type College = "CA" | "CISTM" | "CN";

interface Student {
  studentNo: string;
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  college: College;
  dateCreated: string;
}

// ── Sample data ───────────────────────────────────────────────────────────────

const SAMPLE_STUDENTS: Student[] = [
  { studentNo: "2021-10001", lastName: "dela Cruz",  firstName: "Maria",     middleName: "Santos",    email: "maria.delacruz@university.edu",       college: "CA",    dateCreated: "2024-01-15" },
  { studentNo: "2021-10002", lastName: "Reyes",      firstName: "Juan",      middleName: "Miguel",    email: "juan.reyes@university.edu",            college: "CISTM", dateCreated: "2024-01-16" },
  { studentNo: "2021-10003", lastName: "Santos",     firstName: "Ana",       middleName: "Gabrielle", email: "ana.santos@university.edu",            college: "CN",    dateCreated: "2024-01-17" },
  { studentNo: "2022-20001", lastName: "Lim",        firstName: "Patrick",   middleName: "Jose",      email: "patrick.lim@university.edu",           college: "CISTM", dateCreated: "2024-02-01" },
  { studentNo: "2022-20002", lastName: "Garcia",     firstName: "Sophia",    middleName: "Nicole",    email: "sophia.garcia@university.edu",         college: "CA",    dateCreated: "2024-02-05" },
  { studentNo: "2022-20003", lastName: "Torres",     firstName: "Rafael",    middleName: "Antonio",   email: "rafael.torres@university.edu",         college: "CN",    dateCreated: "2024-02-10" },
  { studentNo: "2023-30001", lastName: "Aquino",     firstName: "Isabella",  middleName: "Marie",     email: "isabella.aquino@university.edu",       college: "CA",    dateCreated: "2024-03-01" },
  { studentNo: "2023-30002", lastName: "Mendoza",    firstName: "Carlos",    middleName: "Andrei",    email: "carlos.mendoza@university.edu",        college: "CISTM", dateCreated: "2024-03-03" },
  { studentNo: "2023-30003", lastName: "Villanueva", firstName: "Francesca", middleName: "Joy",       email: "francesca.villanueva@university.edu",  college: "CN",    dateCreated: "2024-03-07" },
  { studentNo: "2024-40001", lastName: "Castillo",   firstName: "Nathan",    middleName: "Kyle",      email: "nathan.castillo@university.edu",       college: "CA",    dateCreated: "2024-06-15" },
  { studentNo: "2024-40002", lastName: "Fernandez",  firstName: "Camille",   middleName: "Rose",      email: "camille.fernandez@university.edu",     college: "CISTM", dateCreated: "2024-06-16" },
  { studentNo: "2024-40003", lastName: "Ramos",      firstName: "Lorenzo",   middleName: "David",     email: "lorenzo.ramos@university.edu",         college: "CN",    dateCreated: "2024-06-20" },
];

const COLLEGES: { value: College | "All"; label: string }[] = [
  { value: "All",   label: "All"   },
  { value: "CA",    label: "CA"    },
  { value: "CISTM", label: "CISTM" },
  { value: "CN",    label: "CN"    },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "a-z",    label: "Name A → Z"   },
  { value: "z-a",    label: "Name Z → A"   },
];

const ITEMS_PER_PAGE = 8;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullName(s: Student) {
  const middle = s.middleName.trim() ? ` ${s.middleName.trim()}` : "";
  return `${s.lastName}, ${s.firstName}${middle}`;
}

// ── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  studentNo:  "",
  lastName:   "",
  firstName:  "",
  middleName: "",
  email:      "",
  password:   "",
  college:    "" as College | "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentPage() {
  const [students] = useState<Student[]>(SAMPLE_STUDENTS);

  // table controls
  const [activeCollege, setActiveCollege] = useState<College | "All">("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [sortFilter,    setSortFilter]    = useState("newest");
  const [showSortMenu,  setShowSortMenu]  = useState(false);
  const [currentPage,   setCurrentPage]   = useState(1);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // upload state
  const [dragActive,    setDragActive]    = useState(false);
  const [uploadedFile,  setUploadedFile]  = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // create form state
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [showPassword,  setShowPassword]  = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // close sort menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── College counts ───────────────────────────────────────────────────────

  const collegeCounts = useMemo(
    () => ({
      All:   students.length,
      CA:    students.filter((s) => s.college === "CA").length,
      CISTM: students.filter((s) => s.college === "CISTM").length,
      CN:    students.filter((s) => s.college === "CN").length,
    }),
    [students],
  );

  // ── Filtering / sorting ──────────────────────────────────────────────────

  const filteredStudents = useMemo(() => {
    let result = [...students];

    if (activeCollege !== "All")
      result = result.filter((s) => s.college === activeCollege);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.studentNo.toLowerCase().includes(q) ||
          fullName(s).toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sortFilter === "newest")
        return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      if (sortFilter === "oldest")
        return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
      if (sortFilter === "a-z")
        return fullName(a).localeCompare(fullName(b));
      if (sortFilter === "z-a")
        return fullName(b).localeCompare(fullName(a));
      return 0;
    });

    return result;
  }, [students, activeCollege, searchQuery, sortFilter]);

  const totalPages        = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const resetPage = () => setCurrentPage(1);

  // ── Upload handlers ──────────────────────────────────────────────────────

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".csv")) setUploadedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith(".csv")) setUploadedFile(file);
  };

  const handleUploadConfirm = () => {
    if (!uploadedFile) return;
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadedFile(null);
      setShowUploadModal(false);
    }, 1800);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadedFile(null);
    setUploadSuccess(false);
    setDragActive(false);
  };

  // ── Create account handlers ──────────────────────────────────────────────

  const handleCreate = () => {
    if (!isFormValid) return;
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      setCreateSuccess(true);
      setTimeout(() => {
        setCreateSuccess(false);
        setShowCreateModal(false);
        setForm(EMPTY_FORM);
        setShowPassword(false);
      }, 1500);
    }, 1000);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setCreating(false);
    setCreateSuccess(false);
  };

  const isFormValid =
    form.studentNo.trim()  !== "" &&
    form.lastName.trim()   !== "" &&
    form.firstName.trim()  !== "" &&
    form.email.trim()      !== "" &&
    form.password.trim()   !== "" &&
    form.college           !== "";

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortFilter)?.label ?? "Sort";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="pt-16 lg:pt-0 px-5 lg:px-8 py-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Page header ── */}
          <section
            className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6"
            aria-labelledby="page-heading"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#6e3102] dark:text-[#d4855a] flex items-center gap-2">
                  <Users size={13} aria-hidden="true" /> Student account management
                </p>
                <h1
                  id="page-heading"
                  className="text-3xl font-extrabold tracking-tight"
                >
                  Student Accounts
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  aria-label="Upload CSV file"
                >
                  <Upload size={16} aria-hidden="true" /> Upload CSV
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-semibold hover:opacity-90 transition-opacity"
                  aria-label="Create a new student account"
                >
                  Create Account
                </button>
              </div>
            </div>
          </section>

          {/* ── Table card ── */}
          <section
            className="rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-sm p-5 space-y-4"
            aria-label="Student accounts table"
          >
            {/* Tabs + search + filter — single row */}
            <div className="flex items-center gap-3 flex-wrap border-b border-gray-100 dark:border-white/5 pb-4">
              {/* College tabs */}
              <div
                className="flex items-center gap-1 bg-gray-100 dark:bg-[#101014] rounded-2xl p-1 shrink-0"
                role="tablist"
                aria-label="Filter by college"
              >
                {COLLEGES.map((col) => (
                  <button
                    key={col.value}
                    role="tab"
                    aria-selected={activeCollege === col.value}
                    onClick={() => {
                      setActiveCollege(col.value as College | "All");
                      resetPage();
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      activeCollege === col.value
                        ? "bg-white dark:bg-[#18181b] text-[#6e3102] dark:text-[#d4855a] shadow-sm"
                        : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {col.label}{" "}
                    <span
                      className={
                        activeCollege === col.value
                          ? "text-[#6e3102]/60 dark:text-[#d4855a]/60"
                          : "text-gray-400"
                      }
                    >
                      ({collegeCounts[col.value as keyof typeof collegeCounts]})
                    </span>
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative flex-1 min-w-[180px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                  aria-hidden="true"
                />
                <label htmlFor="student-search" className="sr-only">
                  Search students
                </label>
                <input
                  id="student-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    resetPage();
                  }}
                  placeholder="Search by name, student no., or email…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                />
              </div>

              {/* Filter / sort icon button */}
              <div className="relative shrink-0" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showSortMenu}
                  aria-label={`Sort options — ${currentSortLabel}`}
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl border transition-colors ${
                    showSortMenu
                      ? "border-[#6e3102] dark:border-[#d4855a] bg-[#6e3102]/[0.07] dark:bg-[#d4855a]/10 text-[#6e3102] dark:text-[#d4855a]"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#101014] text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                </button>

                {showSortMenu && (
                  <div
                    className="absolute right-0 mt-2 w-44 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl z-20 py-1.5 overflow-hidden"
                    role="listbox"
                    aria-label="Sort by"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={sortFilter === opt.value}
                        onClick={() => {
                          setSortFilter(opt.value);
                          setShowSortMenu(false);
                          resetPage();
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          sortFilter === opt.value
                            ? "bg-[#6e3102]/[0.08] dark:bg-[#d4855a]/10 text-[#6e3102] dark:text-[#d4855a] font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto" role="region" aria-label="Student accounts data">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-gray-500 border-b border-gray-200 dark:border-white/10">
                    <th scope="col" className="py-3 pr-4 font-semibold">Student No.</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Name</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Email</th>
                    <th scope="col" className="py-3 pr-4 font-semibold">Date Created</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-gray-400 text-sm">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => (
                      <tr
                        key={student.studentNo}
                        className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors align-middle"
                      >
                        <td className="py-4 pr-4 font-mono text-sm font-medium text-[#6e3102] dark:text-[#d4855a]">
                          {student.studentNo}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-semibold text-sm">{fullName(student)}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{student.college}</div>
                        </td>
                        <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">
                          {student.email}
                        </td>
                        <td className="py-4 pr-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(student.dateCreated)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between gap-4 pt-2 flex-wrap"
                aria-label="Pagination"
              >
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {filteredStudents.length}
                  </span>{" "}
                  students
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <ChevronLeft size={15} aria-hidden="true" /> Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1,
                    )
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1)
                        acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "…" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-gray-400 text-sm"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item as number)}
                          aria-label={`Page ${item}`}
                          aria-current={currentPage === item ? "page" : undefined}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                            currentPage === item
                              ? "bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212]"
                              : "border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Next <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>

      {/* ════════════════════ Upload CSV Modal ════════════════════ */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/45"
            onClick={closeUploadModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                  Bulk import
                </p>
                <h2 id="upload-modal-title" className="text-xl font-extrabold">
                  Upload Student CSV
                </h2>
              </div>
              <button
                onClick={closeUploadModal}
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#242428] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Close upload modal"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Drag-and-drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Drag and drop a CSV file or click to browse"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                dragActive
                  ? "border-[#6e3102] dark:border-[#d4855a] bg-[#6e3102]/5 dark:bg-[#d4855a]/10"
                  : uploadedFile
                  ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                  : "border-gray-300 dark:border-white/20 hover:border-[#6e3102]/50 dark:hover:border-[#d4855a]/50 bg-gray-50 dark:bg-[#101014]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              />
              {uploadedFile ? (
                <>
                  <FileSpreadsheet size={36} className="text-emerald-500" aria-hidden="true" />
                  <div className="text-center">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(uploadedFile.size / 1024).toFixed(1)} KB — click to replace
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CloudUpload
                    size={36}
                    className={`transition-colors ${
                      dragActive ? "text-[#6e3102] dark:text-[#d4855a]" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="text-center">
                    <p className="font-semibold text-sm">
                      {dragActive ? "Drop your file here" : "Drag & drop your CSV file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      or{" "}
                      <span className="text-[#6e3102] dark:text-[#d4855a] font-semibold underline underline-offset-2">
                        browse to upload
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Only <span className="font-semibold">.csv</span> files are accepted. Expected
              columns:{" "}
              <span className="font-semibold">
                student_no, last_name, first_name, middle_name, email, college, password
              </span>.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!uploadedFile || uploadSuccess}
                onClick={handleUploadConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                aria-live="polite"
              >
                {uploadSuccess ? (
                  <>
                    <CheckCircle2 size={15} aria-hidden="true" /> Uploaded!
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ Create Account Modal ════════════════════ */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/45"
            onClick={closeCreateModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                  Manual entry
                </p>
                <h2 id="create-modal-title" className="text-xl font-extrabold">
                  Create Student Account
                </h2>
              </div>
              <button
                onClick={closeCreateModal}
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#242428] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                aria-label="Close create account modal"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-3">

              {/* Student Number */}
              <div>
                <label
                  htmlFor="student-no"
                  className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                >
                  Student Number
                </label>
                <input
                  id="student-no"
                  type="text"
                  value={form.studentNo}
                  onChange={(e) => setForm((f) => ({ ...f, studentNo: e.target.value }))}
                  placeholder="e.g. 2024-10001"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                  autoComplete="off"
                />
              </div>

              {/* Last Name + First Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="student-lastname"
                    className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                  >
                    Last Name
                  </label>
                  <input
                    id="student-lastname"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="e.g. dela Cruz"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                    autoComplete="family-name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-firstname"
                    className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                  >
                    First Name
                  </label>
                  <input
                    id="student-firstname"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="e.g. Maria"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                    autoComplete="given-name"
                  />
                </div>
              </div>

              {/* Middle Name + College */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="student-middlename"
                    className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                  >
                    Middle Name{" "}
                    <span className="normal-case tracking-normal font-medium text-gray-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="student-middlename"
                    type="text"
                    value={form.middleName}
                    onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
                    placeholder="e.g. Santos"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                    autoComplete="additional-name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-college"
                    className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                  >
                    College
                  </label>
                  <select
                    id="student-college"
                    value={form.college}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, college: e.target.value as College | "" }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                  >
                    <option value="" disabled>Select college</option>
                    <option value="CA">CA</option>
                    <option value="CISTM">CISTM</option>
                    <option value="CN">CN</option>
                  </select>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="student-email"
                  className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="student-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="student@university.edu"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="student-password"
                  className="block text-xs uppercase tracking-[0.18em] font-bold text-gray-500 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="student-password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Set a temporary password"
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!isFormValid || creating || createSuccess}
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
                aria-live="polite"
              >
                {createSuccess ? (
                  <>
                    <CheckCircle2 size={15} aria-hidden="true" /> Account Created!
                  </>
                ) : creating ? (
                  <>
                    <span
                      className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Creating…
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}