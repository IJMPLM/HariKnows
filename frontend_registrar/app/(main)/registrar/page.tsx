"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList, Plus, Search, RefreshCw, UserSearch,
  CheckCircle2, XCircle, ListFilter, ChevronLeft, ChevronRight,
  X, ArrowDownAZ, ArrowDownZA, ArrowUpNarrowWide, ArrowDownNarrowWide,
  Clock, Circle,
} from "lucide-react";
import CustomSelect from "../../components/CustomSelect";
import {
  createRegistrarRequest, getRegistrarRequests, loadRegistrarState,
  searchStudents, updateRegistrarRequestStatus,
  type Department, type StudentDirectoryEntry, type StudentDocumentRequest,
} from "../../../lib/registrar-client";

const DOCUMENT_TYPES = [
  "Certificate of Enrollment", "Certificate of Grades", "Certificate of GWA",
  "Certificate of Ranking", "Certificate of Graduation Candidacy",
  "Certificate of Graduation", "Certificate of NSTP", "Transcript of Records (TOR)",
  "Certificate of Course Description", "Certificate of Course Syllabus",
  "Certificate of Completion", "Certificates of Units Earned",
  "Certificate of Diploma", "Transfer Credentials (Honorable Dismissal)",
];

const EMPTY_REQUEST = { studentNo: "", documentType: "", departmentId: 0, notes: "" };
const ITEMS_PER_PAGE = 10;

type SortType = "A-Z" | "Z-A" | "newest" | "oldest";
type TabStatus = "all" | "requested" | "prepared" | "claimed" | "disposed";
type StepStatus = "completed" | "in-progress" | "pending";

const fmt = (v: string) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const fmtLong = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toLocaleString();
};

const STATUS_BADGE: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  prepared:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  claimed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  disposed:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const DATE_COLUMN_LABEL: Record<TabStatus, string> = {
  all: "Date Updated", requested: "Date Requested", prepared: "Date Prepared",
  claimed: "Date Claimed", disposed: "Date Disposed",
};

// ── Step Icon ─────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "completed") return (
    <div className="w-7 h-7 rounded-full bg-[#6e3102] dark:bg-[#d4855a] flex items-center justify-center flex-shrink-0 shadow-sm">
      <CheckCircle2 size={14} className="text-white dark:text-[#121212]" />
    </div>
  );
  if (status === "in-progress") return (
    <div className="w-7 h-7 rounded-full border-2 border-[#6e3102] dark:border-[#d4855a] bg-white dark:bg-[#18181b] flex items-center justify-center flex-shrink-0 text-[#6e3102] dark:text-[#d4855a] shadow-sm">
      <Clock size={12} />
    </div>
  );
  return (
    <div className="w-7 h-7 rounded-full border-2 border-gray-200 dark:border-white/15 bg-white dark:bg-[#18181b] flex items-center justify-center flex-shrink-0">
      <Circle size={8} className="text-gray-300 dark:text-white/20" />
    </div>
  );
}

// ── Notes Modal ───────────────────────────────────────────────────────────────

function NotesModal({
  title,
  onSkip,
  onConfirm,
}: {
  title: string;
  onSkip: () => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSkip} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4 animate-modal-in">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Status Update</p>
          <h3 id="notes-modal-title" className="text-lg font-extrabold">{title}</h3>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Notes <span className="normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes here..."
            rows={3}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 focus:border-[#6e3102] dark:focus:border-[#d4855a] transition-all resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onSkip}
            className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Skip
          </button>
          {notes.trim() && (
            <button
              onClick={() => onConfirm(notes)}
              className="px-5 py-2.5 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Request Details Modal ─────────────────────────────────────────────────────

function RequestDetailsModal({
  request,
  onClose,
}: {
  request: StudentDocumentRequest;
  onClose: () => void;
}) {
  // Cast to any to safely access optional timestamp fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = request as any;
  const status = request.status.toLowerCase();

  const allSteps = [
    {
      label: "Requested",
      description: "Request submitted successfully.",
      date: fmtLong(r.requestedAt ?? r.updatedAt),
      status: "completed" as StepStatus,
    },
    {
      label: "Prepared",
      description: r.preparedAt ? "Document prepared for release." : "Waiting for registrar preparation.",
      date: fmtLong(r.preparedAt),
      status: (r.preparedAt
        ? ["prepared", "claimed", "disposed"].includes(status) ? "completed" : "in-progress"
        : status === "prepared" ? "in-progress" : "pending") as StepStatus,
    },
    {
      label: "Claimed",
      description: r.claimedAt ? "Document has been claimed." : "Awaiting student claim.",
      date: fmtLong(r.claimedAt),
      status: (r.claimedAt ? "completed" : status === "claimed" ? "in-progress" : "pending") as StepStatus,
    },
    {
      label: "Disposed",
      description: r.disposedReason || "Removed from active queue.",
      date: fmtLong(r.disposedAt),
      status: (r.disposedAt ? "completed" : status === "disposed" ? "in-progress" : "pending") as StepStatus,
    },
  ];

  // Trim steps based on terminal status — claimed ends at step 3, disposed skips claimed
  const steps =
    status === "claimed"  ? allSteps.slice(0, 3) :
    status === "disposed" ? [allSteps[0], allSteps[1], allSteps[3]] :
    allSteps;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-modal-in flex flex-col max-h-[90vh]">

        {/* Header — document title + code + status pill; no "Request Details" label */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <h2
              id="details-modal-title"
              className="text-base font-bold text-gray-900 dark:text-white leading-tight"
            >
              {request.documentType}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{request.requestCode}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  STATUS_BADGE[request.status] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                }`}
              >
                {request.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={14} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Info rows — document & request ID removed (now in header); status pill removed */}
          <div className="px-6 py-4 flex flex-col gap-3 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex justify-between items-start text-sm gap-4">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">Student</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-right">{request.studentName}</span>
            </div>
            <div className="flex justify-between items-center text-sm gap-4">
              <span className="text-gray-500 dark:text-gray-400 shrink-0">Student No.</span>
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{request.studentNo}</span>
            </div>
            {request.notes && (
              <div className="flex flex-col gap-1.5 text-sm pt-1">
                <span className="text-gray-500 dark:text-gray-400">Notes</span>
                <span className="text-gray-700 dark:text-gray-300 text-xs bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 leading-relaxed">
                  {request.notes}
                </span>
              </div>
            )}
          </div>

          {/* Progress stepper */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Progress Tracker
            </p>
            <div className="flex flex-col">
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <StepIcon status={step.status} />
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 my-1 rounded-full ${
                            step.status === "completed"
                              ? "bg-[#6e3102]/40 dark:bg-[#d4855a]/40"
                              : "bg-gray-200 dark:bg-white/10"
                          }`}
                          style={{ minHeight: "20px" }}
                        />
                      )}
                    </div>
                    <div className={`${isLast ? "pb-1" : "pb-4"} ${step.status === "pending" ? "opacity-40" : ""}`}>
                      <p
                        className={`text-sm font-bold leading-tight ${
                          step.status === "in-progress"
                            ? "text-[#6e3102] dark:text-[#d4855a]"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                      {step.date && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{step.date}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RegistrarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requests, setRequests] = useState<StudentDocumentRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TabStatus>("requested");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<StudentDirectoryEntry[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentDirectoryEntry | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortType, setSortType] = useState<SortType>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StudentDocumentRequest | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{
    requestId: number; status: string; disposedReason?: string;
  } | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const studentInputRef = useRef<HTMLInputElement>(null);
  // Prevents re-triggering the search debounce immediately after a student is selected
  const skipSearchRef = useRef(false);

  useEffect(() => {
    const anyOpen = showCreateModal || !!selectedRequest || !!pendingStatus;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showCreateModal, selectedRequest, pendingStatus]);

  const load = async () => {
    setLoading(true);
    try {
      const state = await loadRegistrarState();
      const requestData = await getRegistrarRequests(undefined, undefined, 200);
      setDepartments(state.departments);
      setRequests(requestData);
      if (!requestForm.departmentId && state.departments.length > 0)
        setRequestForm((c) => ({ ...c, departmentId: state.departments[0].id }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchQuery, sortType]);

  // Student search debounce — skip one cycle after a student is selected to avoid re-opening the dropdown
  useEffect(() => {
    if (skipSearchRef.current) { skipSearchRef.current = false; return; }
    const handle = window.setTimeout(async () => {
      if (!studentSearch.trim()) { setStudentResults([]); setShowDropdown(false); return; }
      const results = await searchStudents(studentSearch, 8);
      setStudentResults(results);
      setShowDropdown(results.length > 0);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [studentSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const counts = useMemo(() => ({
    all:       requests.length,
    requested: requests.filter((r) => r.status === "requested").length,
    prepared:  requests.filter((r) => r.status === "prepared").length,
    claimed:   requests.filter((r) => r.status === "claimed").length,
    disposed:  requests.filter((r) => r.status === "disposed").length,
  }), [requests]);

  const filteredRequests = useMemo(() => {
    const filtered = requests.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesSearch = [r.requestCode, r.studentName, r.studentNo, r.documentType]
        .join(" ").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    filtered.sort((a, b) => {
      const nameA = (a.studentName ?? "").toLowerCase(), nameB = (b.studentName ?? "").toLowerCase();
      const dateA = new Date(a.updatedAt).getTime(), dateB = new Date(b.updatedAt).getTime();
      switch (sortType) {
        case "A-Z":    return nameA.localeCompare(nameB);
        case "Z-A":    return nameB.localeCompare(nameA);
        case "newest": return dateB - dateA;
        case "oldest": return dateA - dateB;
        default:       return 0;
      }
    });
    return filtered;
  }, [requests, searchQuery, statusFilter, sortType]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE
  );

  const createRequest = async () => {
    setCreating(true);
    try {
      await createRegistrarRequest(requestForm);
      setShowCreateModal(false);
      setRequestForm({ ...EMPTY_REQUEST, departmentId: departments[0]?.id ?? 0 });
      setStudentSearch(""); setSelectedStudent(null); setStudentResults([]); setShowDropdown(false);
      await load();
    } finally { setCreating(false); }
  };

  const updateStatus = async (requestId: number, status: string, notes = "", disposedReason?: string) => {
    const handledBy = window.prompt("Handled by (optional)") ?? undefined;
    await updateRegistrarRequestStatus(requestId, { status, handledBy, disposedReason, notes });
    await load();
  };

  const handleStatusAction = (requestId: number, status: string, disposedReason?: string) =>
    setPendingStatus({ requestId, status, disposedReason });

  const handleNotesSkip = async () => {
    if (!pendingStatus) return;
    const p = pendingStatus;
    setPendingStatus(null);
    await updateStatus(p.requestId, p.status, "", p.disposedReason);
  };

  const handleNotesConfirm = async (notes: string) => {
    if (!pendingStatus) return;
    const p = pendingStatus;
    setPendingStatus(null);
    await updateStatus(p.requestId, p.status, notes, p.disposedReason);
  };

  // Immediately commit the selection — skipSearchRef suppresses the debounce re-run
  const handleSelectStudent = (student: StudentDirectoryEntry) => {
    skipSearchRef.current = true;
    setSelectedStudent(student);
    setStudentSearch(student.fullName);
    setRequestForm((c) => ({ ...c, studentNo: student.studentNo }));
    setShowDropdown(false);
    setStudentResults([]);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setStudentSearch(""); setSelectedStudent(null); setStudentResults([]); setShowDropdown(false);
  };

  const TABS: { id: TabStatus; label: string }[] = [
    { id: "all", label: "All" }, { id: "requested", label: "Requested" },
    { id: "prepared", label: "Prepared" }, { id: "claimed", label: "Claimed" },
    { id: "disposed", label: "Disposed" },
  ];

  const SORT_OPTIONS: { value: SortType; label: string; Icon: React.ElementType }[] = [
    { value: "A-Z",    label: "Name A–Z",     Icon: ArrowDownAZ },
    { value: "Z-A",    label: "Name Z–A",     Icon: ArrowDownZA },
    { value: "newest", label: "Newest First", Icon: ArrowDownNarrowWide },
    { value: "oldest", label: "Oldest First", Icon: ArrowUpNarrowWide },
  ];

  const STATUS_MODAL_TITLE: Record<string, string> = {
    prepared: "Mark as Prepared",
    claimed:  "Mark as Claimed",
    disposed: "Mark as Disposed",
  };

  return (
    <>
      <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
        <div className="pt-16 lg:pt-0 px-5 lg:px-8 py-6 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* ── Header ── */}
            <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#6e3102] dark:text-[#d4855a] flex items-center gap-2">
                    <ClipboardList size={13} aria-hidden="true" /> Registrar request workflow
                  </p>
                  <h1 className="text-3xl font-extrabold tracking-tight">Document Requests</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void load()}
                    aria-label="Refresh"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Plus size={16} aria-hidden="true" /> New Request
                  </button>
                </div>
              </div>
            </section>

            {/* ── Main Card ── */}
            <section
              className="rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col"
              style={{ minHeight: "600px" }}
            >
              {/* Tabs + Search/Sort row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-0 flex-wrap">
                <div
                  className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex flex-wrap gap-1"
                  role="tablist"
                  aria-label="Filter by status"
                >
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={statusFilter === tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                        statusFilter === tab.id
                          ? "bg-white dark:bg-[#242428] text-gray-900 dark:text-gray-100 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          statusFilter === tab.id
                            ? "bg-[#6e3102]/10 dark:bg-[#d4855a]/20 text-[#6e3102] dark:text-[#d4855a]"
                            : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {counts[tab.id]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search + Sort */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={15}
                      aria-hidden="true"
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      aria-label="Search requests"
                      className="pl-9 pr-3 py-2 w-48 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 focus:border-[#6e3102] dark:focus:border-[#d4855a] transition-all"
                    />
                  </div>
                  <div className="relative" ref={sortMenuRef}>
                    <button
                      onClick={() => setShowSortMenu((v) => !v)}
                      aria-label="Sort options"
                      aria-expanded={showSortMenu}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${
                        showSortMenu
                          ? "bg-[#6e3102] dark:bg-[#d4855a] border-[#6e3102] dark:border-[#d4855a] text-white dark:text-[#121212]"
                          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      <ListFilter size={15} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    {showSortMenu && (
                      <div
                        className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl py-1.5"
                        role="menu"
                      >
                        <p className="px-3 pt-1 pb-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          Sort by
                        </p>
                        {SORT_OPTIONS.map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            role="menuitem"
                            onClick={() => { setSortType(value); setShowSortMenu(false); }}
                            className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                              sortType === value
                                ? "text-[#6e3102] dark:text-[#d4855a] bg-[#6e3102]/5 dark:bg-[#d4855a]/10"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                            }`}
                          >
                            <Icon size={14} aria-hidden="true" />{label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto px-5 pt-4">
                <table className="w-full min-w-[640px]" role="table">
                  <colgroup>
                    <col style={{ width: "34%" }} /><col style={{ width: "28%" }} />
                    <col style={{ width: "22%" }} /><col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-white/5">
                      <th className="pb-3 pr-4 font-semibold text-left">Document / Request</th>
                      <th className="pb-3 pr-4 font-semibold text-left">Student</th>
                      <th className="pb-3 pr-4 font-semibold text-center">{DATE_COLUMN_LABEL[statusFilter]}</th>
                      <th className="pb-3 font-semibold text-center">
                        {statusFilter === "all" || statusFilter === "claimed" || statusFilter === "disposed" ? "Status" : "Action"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                          <div className="flex flex-col items-center gap-3">
                            <div
                              className="w-7 h-7 border-2 border-[#6e3102] dark:border-[#d4855a] border-t-transparent rounded-full animate-spin"
                              role="status"
                              aria-label="Loading"
                            />
                            <span>Loading requests…</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                          No requests found.
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((request) => (
                        <tr
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className="border-b border-gray-50 dark:border-white/[0.04] last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 pr-4">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 max-w-[220px] truncate group-hover:text-[#6e3102] dark:group-hover:text-[#d4855a] transition-colors">
                              {request.documentType}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                              {request.requestCode}
                            </div>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{request.studentName}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{request.studentNo}</div>
                          </td>
                          <td className="py-3.5 pr-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap text-center">
                            {fmt(request.updatedAt)}
                          </td>
                          <td className="py-3.5 text-center">
                            {(statusFilter === "all" || statusFilter === "claimed" || statusFilter === "disposed") && (
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                  STATUS_BADGE[request.status] ?? "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                }`}
                              >
                                {request.status}
                              </span>
                            )}
                            {statusFilter === "requested" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStatusAction(request.id, "prepared"); }}
                                className="px-3 py-1.5 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                              >
                                Mark Prepared
                              </button>
                            )}
                            {statusFilter === "prepared" && (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStatusAction(request.id, "claimed"); }}
                                  aria-label="Mark as claimed"
                                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition-colors"
                                >
                                  <CheckCircle2 size={15} aria-hidden="true" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const reason = window.prompt("Disposed reason");
                                    if (reason) handleStatusAction(request.id, "disposed", reason);
                                  }}
                                  aria-label="Mark as disposed"
                                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 transition-colors"
                                >
                                  <XCircle size={15} aria-hidden="true" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {filteredRequests.length > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 px-5 py-3 mt-auto">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-bold text-gray-700 dark:text-gray-200">{paginatedRequests.length}</span>
                    {" "}of{" "}
                    <span className="font-bold text-gray-700 dark:text-gray-200">{filteredRequests.length}</span>
                    {" "}results
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft size={13} aria-hidden="true" /> Previous
                    </button>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                      className="disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Next <ChevronRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* ── Create Request Modal ── */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} aria-hidden="true" />
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4">

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">New request</p>
                <h3 id="modal-title" className="text-xl font-extrabold">Create Document Request</h3>
              </div>
              <button
                onClick={handleCloseModal}
                aria-label="Close modal"
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#242428] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            {/* Student search */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Student
              </label>
              <div className="relative">
                <UserSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  ref={studentInputRef}
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    if (selectedStudent && e.target.value !== selectedStudent.fullName) {
                      setSelectedStudent(null);
                      setRequestForm((c) => ({ ...c, studentNo: "" }));
                    }
                  }}
                  onFocus={() => { if (studentResults.length > 0) setShowDropdown(true); }}
                  placeholder="Search student by no / name…"
                  autoComplete="off"
                  aria-label="Search student"
                  aria-expanded={showDropdown}
                  aria-haspopup="listbox"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 focus:border-[#6e3102] dark:focus:border-[#d4855a] bg-gray-50 dark:bg-[#101014] ${
                    selectedStudent
                      ? "border-[#6e3102] dark:border-[#d4855a] font-semibold"
                      : "border-gray-200 dark:border-white/10"
                  }`}
                />
                {selectedStudent && (
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearch("");
                      setRequestForm((c) => ({ ...c, studentNo: "" }));
                      studentInputRef.current?.focus();
                    }}
                    aria-label="Clear student selection"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                  >
                    <X size={10} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && studentResults.length > 0 && (
                <ul
                  role="listbox"
                  aria-label="Student search results"
                  className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-52 overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl py-1"
                >
                  {studentResults.map((student) => (
                    <li key={student.studentNo} role="option" aria-selected={requestForm.studentNo === student.studentNo}>
                      <button
                        onClick={() => handleSelectStudent(student)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                          requestForm.studentNo === student.studentNo ? "bg-[#6e3102]/5 dark:bg-[#d4855a]/10" : ""
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{student.fullName}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {student.studentNo} · {student.collegeCode} / {student.programCode}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Document type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Document Type
              </label>
              <div className="z-10 relative">
                <CustomSelect
                  value={requestForm.documentType || "Select document type"}
                  options={["Select document type", ...DOCUMENT_TYPES]}
                  onChange={(val) =>
                    setRequestForm((c) => ({ ...c, documentType: val === "Select document type" ? "" : val }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Notes{" "}
                <span className="normal-case tracking-normal font-normal text-gray-400 dark:text-gray-500">
                  (optional)
                </span>
              </label>
              <textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm((c) => ({ ...c, notes: e.target.value }))}
                placeholder="Enter notes here..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 focus:border-[#6e3102] dark:focus:border-[#d4855a] transition-all resize-none"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={creating || !requestForm.studentNo || !requestForm.documentType}
                onClick={() => void createRequest()}
                className="px-5 py-2.5 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {creating ? "Creating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes Modal (for status updates) ── */}
      {pendingStatus && (
        <NotesModal
          title={STATUS_MODAL_TITLE[pendingStatus.status] ?? "Update Status"}
          onSkip={() => void handleNotesSkip()}
          onConfirm={(notes) => void handleNotesConfirm(notes)}
        />
      )}

      {/* ── Request Details Modal ── */}
      {selectedRequest && (
        <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modalIn 0.2s ease both; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.5); }
      `}</style>
    </>
  );
}