"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Upload, FileText, AlertTriangle, CheckCircle2, X, Clock,
  ClipboardList, Search, Calendar, FileSpreadsheet, AlertCircle,
  ChevronDown, UploadCloud, ListFilter, ChevronLeft, ChevronRight,
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

// ─── Types ────────────────────────────────────────────────────────────────────
type DocType = "rog" | "masterlist" | "thesis" | "curriculum" | "syllabus";
type MainTab = "submitted" | "deficiencies";
type SubTab = DocType | "all";
type SortOrder = "doc-asc" | "doc-desc" | "ay-newest" | "ay-oldest";
type DefStatus = "overdue" | "not-submitted";

interface SubmittedFile {
  id: string; type: DocType; title: string;
  ay: string; dateSubmitted: string; filename: string;
}
interface Deficiency {
  id: string; type: DocType; title: string;
  ay: string; dueDate: string; status: DefStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DOC_TYPES: { value: DocType; label: string; short: string }[] = [
  { value: "rog",        label: "Report of Grades (ROG)",  short: "ROG"        },
  { value: "masterlist", label: "Class Masterlist",         short: "Masterlist" },
  { value: "thesis",     label: "Thesis / Capstone Status", short: "Thesis"     },
  { value: "curriculum", label: "Curriculum",               short: "Curriculum" },
  { value: "syllabus",   label: "Syllabus",                 short: "Syllabus"   },
];

const ACADEMIC_YEARS = [
  "AY 2025-2026","AY 2024-2025","AY 2023-2024","AY 2022-2023",
  "AY 2021-2022","AY 2020-2021","AY 2019-2020","AY 2018-2019",
  "AY 2017-2018","AY 2016-2017","AY 2015-2016",
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "doc-asc",   label: "Document Type (A \u2192 Z)" },
  { value: "doc-desc",  label: "Document Type (Z \u2192 A)" },
  { value: "ay-newest", label: "Academic Year (Newest)"     },
  { value: "ay-oldest", label: "Academic Year (Oldest)"     },
];

const ITEMS_PER_PAGE = 10;

const INITIAL_SUBMITTED: SubmittedFile[] = [
  { id:"DOC-0001",type:"rog",        title:"Report of Grades - 1st Semester",         ay:"AY 2024-2025",dateSubmitted:"Jan 15, 2025",filename:"ROG_1stSem_2024-2025.csv"       },
  { id:"DOC-0002",type:"rog",        title:"Report of Grades - 2nd Semester",         ay:"AY 2023-2024",dateSubmitted:"Jun 10, 2024",filename:"ROG_2ndSem_2023-2024.csv"       },
  { id:"DOC-0003",type:"rog",        title:"Report of Grades - 1st Semester",         ay:"AY 2023-2024",dateSubmitted:"Jan 18, 2024",filename:"ROG_1stSem_2023-2024.csv"       },
  { id:"DOC-0004",type:"masterlist", title:"Class Masterlist - CS301",                ay:"AY 2024-2025",dateSubmitted:"Jan 22, 2025",filename:"Masterlist_CS301_2024-2025.csv" },
  { id:"DOC-0005",type:"masterlist", title:"Class Masterlist - IT402",                ay:"AY 2024-2025",dateSubmitted:"Jan 23, 2025",filename:"Masterlist_IT402_2024-2025.csv" },
  { id:"DOC-0006",type:"masterlist", title:"Class Masterlist - IS201",                ay:"AY 2023-2024",dateSubmitted:"Aug 5, 2023", filename:"Masterlist_IS201_2023-2024.csv" },
  { id:"DOC-0007",type:"thesis",     title:"Thesis / Capstone Status List",           ay:"AY 2024-2025",dateSubmitted:"Feb 1, 2025", filename:"Thesis_Status_2024-2025.csv"    },
  { id:"DOC-0008",type:"thesis",     title:"Thesis / Capstone Status List",           ay:"AY 2023-2024",dateSubmitted:"Feb 3, 2024", filename:"Thesis_Status_2023-2024.csv"    },
  { id:"DOC-0009",type:"curriculum", title:"Curriculum - BS Computer Science",        ay:"AY 2024-2025",dateSubmitted:"Aug 2, 2024", filename:"Curriculum_BSCS_2024-2025.csv"  },
  { id:"DOC-0010",type:"curriculum", title:"Curriculum - BS Information Technology", ay:"AY 2024-2025",dateSubmitted:"Aug 2, 2024", filename:"Curriculum_BSIT_2024-2025.csv"  },
  { id:"DOC-0011",type:"syllabus",   title:"Syllabus - CS301: Data Structures",      ay:"AY 2024-2025",dateSubmitted:"Aug 10, 2024",filename:"Syllabus_CS301_2024-2025.csv"   },
  { id:"DOC-0012",type:"syllabus",   title:"Syllabus - IT402: Systems Integration",  ay:"AY 2024-2025",dateSubmitted:"Aug 11, 2024",filename:"Syllabus_IT402_2024-2025.csv"   },
  { id:"DOC-0013",type:"syllabus",   title:"Syllabus - IS201: Info Management",      ay:"AY 2023-2024",dateSubmitted:"Aug 8, 2023", filename:"Syllabus_IS201_2023-2024.csv"   },
];

const INITIAL_DEFICIENCIES: Deficiency[] = [
  { id:"DEF-0001",type:"rog",        title:"Report of Grades - 2nd Semester",     ay:"AY 2024-2025",dueDate:"Jun 30, 2025",status:"not-submitted" },
  { id:"DEF-0002",type:"masterlist", title:"Class Masterlist - CS401",            ay:"AY 2024-2025",dueDate:"Mar 1, 2025", status:"overdue"       },
  { id:"DEF-0003",type:"masterlist", title:"Class Masterlist - IS301",            ay:"AY 2024-2025",dueDate:"Mar 1, 2025", status:"overdue"       },
  { id:"DEF-0004",type:"curriculum", title:"Curriculum - BS Information Systems", ay:"AY 2024-2025",dueDate:"Apr 15, 2025",status:"not-submitted" },
  { id:"DEF-0005",type:"syllabus",   title:"Syllabus - CS401: Software Eng.",     ay:"AY 2024-2025",dueDate:"Apr 10, 2025",status:"not-submitted" },
  { id:"DEF-0006",type:"syllabus",   title:"Syllabus - CS402: Capstone Project I",ay:"AY 2024-2025",dueDate:"Apr 10, 2025",status:"not-submitted" },
  { id:"DEF-0007",type:"thesis",     title:"Thesis / Capstone Status List",       ay:"AY 2022-2023",dueDate:"Mar 15, 2023",status:"overdue"       },
  { id:"DEF-0008",type:"rog",        title:"Report of Grades - 2nd Semester",     ay:"AY 2022-2023",dueDate:"Jul 1, 2023", status:"overdue"       },
];

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({
  id, value, onChange, options, placeholder,
}: {
  id?: string; value: string; placeholder: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        id={id} type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm
                   bg-[var(--card)] border border-[var(--line)] text-[var(--text)]
                   focus:outline-none focus:ring-2 focus:ring-[#6e3102]/25 dark:focus:ring-[#d4855a]/25
                   focus:border-[#6e3102]/50 dark:focus:border-[#d4855a]/50
                   hover:border-[#6e3102]/40 dark:hover:border-[#d4855a]/40 transition-all cursor-pointer"
      >
        <span className={selected ? "text-[var(--text)]" : "text-[var(--muted)]"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-[var(--muted)] transition-transform duration-200 flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-[200] mt-1.5 w-full bg-[var(--panel)] border border-[var(--line)]
                        rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${value === opt.value
                    ? "bg-[#6e3102]/10 dark:bg-[#d4855a]/15 text-[#6e3102] dark:text-[#d4855a] font-semibold"
                    : "text-[var(--text)] hover:bg-[#6e3102]/10 dark:hover:bg-[#d4855a]/10 hover:text-[#6e3102] dark:hover:text-[#d4855a]"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sort Dropdown ────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortOrder; onChange: (v: SortOrder) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button" onClick={() => setOpen(v => !v)} aria-label="Sort options"
        className="w-10 h-10 flex items-center justify-center rounded-xl
                   bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212]
                   hover:bg-[#5a2801] dark:hover:bg-[#e09873]
                   shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10
                   transition-all duration-200 focus:outline-none
                   focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
      >
        <ListFilter size={16} strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-52 bg-[var(--panel)] border border-[var(--line)]
                        rounded-xl shadow-xl overflow-hidden z-[200]">
          <p className="px-4 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--muted)]">
            Sort By
          </p>
          <div className="pb-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value} type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${value === opt.value
                    ? "bg-[#6e3102]/10 dark:bg-[#d4855a]/15 text-[#6e3102] dark:text-[#d4855a] font-semibold"
                    : "text-[var(--text)] hover:bg-[#6e3102]/10 dark:hover:bg-[#d4855a]/10 hover:text-[#6e3102] dark:hover:text-[#d4855a]"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CISTMPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedType,    setSelectedType]    = useState<DocType | "">("");
  const [selectedAY,      setSelectedAY]      = useState<string>("");
  const [dragOver,        setDragOver]        = useState(false);
  const [selectedFile,    setSelectedFile]    = useState<File | null>(null);
  const [uploading,       setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<{ type: "success"|"error"|"warning"; message: string }|null>(null);

  // Tabs
  const [mainTab,   setMainTab]   = useState<MainTab>("submitted");
  const [subTab,    setSubTab]    = useState<SubTab>("all");
  const [defSubTab, setDefSubTab] = useState<SubTab>("all");

  // Search & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder,   setSortOrder]   = useState<SortOrder>("ay-newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Data
  const [submittedFiles, setSubmittedFiles] = useState<SubmittedFile[]>(INITIAL_SUBMITTED);
  const [deficiencies,   setDeficiencies]   = useState<Deficiency[]>(INITIAL_DEFICIENCIES);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => { setCurrentPage(1); }, [subTab, defSubTab, searchQuery, sortOrder, mainTab]);

  useEffect(() => {
    if (!showUploadModal) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [showUploadModal]);

  useEffect(() => {
    document.body.style.overflow = showUploadModal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showUploadModal]);

  // ── File helpers ──────────────────────────────────────────────────────────
  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setToast({ type: "error", message: "Only CSV files are accepted. Please choose a .csv file." });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: "error", message: "File size must not exceed 10 MB." });
      return false;
    }
    return true;
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true);  };
  const handleDragLeave = ()                    => { setDragOver(false); };
  const handleDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) setSelectedFile(file);
  }, []);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) setSelectedFile(file);
  };
  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const closeModal = () => {
    setShowUploadModal(false);
    setSelectedType(""); setSelectedAY(""); setSelectedFile(null); setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedType) { setToast({ type: "warning", message: "Please select a document type." });  return; }
    if (!selectedAY)   { setToast({ type: "warning", message: "Please select an academic year." }); return; }
    if (!selectedFile) { setToast({ type: "warning", message: "Please attach a CSV file." }); return; }
    setUploading(true);
    await new Promise(r => setTimeout(r, 1300));
    const docMeta = DOC_TYPES.find(d => d.value === selectedType)!;
    const newEntry: SubmittedFile = {
      id:            `DOC-${String(submittedFiles.length + 1).padStart(4, "0")}`,
      type:          selectedType,
      title:         `${docMeta.label} - Uploaded ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      ay:            selectedAY,
      dateSubmitted: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      filename:      selectedFile.name,
    };
    setSubmittedFiles(prev => [newEntry, ...prev]);
    setDeficiencies(prev => prev.filter(d => !(d.type === selectedType && d.ay === selectedAY)));
    setUploading(false);
    setToast({ type: "success", message: `${docMeta.label} uploaded successfully for ${selectedAY}!` });
    closeModal();
    setMainTab("submitted");
    setSubTab(selectedType);
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  function applySort<T extends { type: DocType; ay: string }>(arr: T[]): T[] {
    return [...arr].sort((a, b) => {
      if (sortOrder === "doc-asc")   return a.type.localeCompare(b.type);
      if (sortOrder === "doc-desc")  return b.type.localeCompare(a.type);
      if (sortOrder === "ay-newest") return b.ay.localeCompare(a.ay);
      if (sortOrder === "ay-oldest") return a.ay.localeCompare(b.ay);
      return 0;
    });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredSubmitted = applySort(
    submittedFiles.filter(f => {
      const matchType = subTab === "all" || f.type === subTab;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
        || f.ay.toLowerCase().includes(q) || f.filename.toLowerCase().includes(q);
      return matchType && matchSearch;
    })
  );
  const submittedTotalPages = Math.ceil(filteredSubmitted.length / ITEMS_PER_PAGE);
  const paginatedSubmitted  = filteredSubmitted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredDeficiencies = applySort(
    deficiencies.filter(d => {
      const matchType = defSubTab === "all" || d.type === defSubTab;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
        || d.ay.toLowerCase().includes(q);
      return matchType && matchSearch;
    })
  );
  const defTotalPages = Math.ceil(filteredDeficiencies.length / ITEMS_PER_PAGE);
  const paginatedDef  = filteredDeficiencies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const overdueCount  = deficiencies.filter(d => d.status === "overdue").length;

  // ── Shared UI pieces ──────────────────────────────────────────────────────
  const DocBadge = ({ type }: { type: DocType }) => {
    const dt = DOC_TYPES.find(d => d.value === type)!;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap
                       bg-[#6e3102]/10 dark:bg-[#d4855a]/10 text-[#6e3102] dark:text-[#d4855a]">
        {dt.short}
      </span>
    );
  };

  const DefStatusBadge = ({ status }: { status: DefStatus }) => (
    status === "overdue"
      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap
                         bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</span>
      : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap
                         bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Not Yet Submitted</span>
  );

  const SubTabPills = ({ activeTab, setTab, counts }: {
    activeTab: SubTab; setTab: (t: SubTab) => void; counts: Record<string, number>;
  }) => (
    <div className="bg-[var(--bg-soft)] p-1 rounded-xl flex flex-wrap gap-1">
      {[
        { value: "all" as SubTab, label: "All", count: counts.all },
        ...DOC_TYPES.map(d => ({ value: d.value as SubTab, label: d.short, count: counts[d.value] ?? 0 })),
      ].map(tab => (
        <button
          key={tab.value} onClick={() => setTab(tab.value)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                      whitespace-nowrap transition-all duration-150 focus:outline-none
                      ${activeTab === tab.value
                        ? "bg-[var(--panel)] text-[#6e3102] dark:text-[#d4855a] shadow-sm border border-[#6e3102]/20 dark:border-[#d4855a]/25"
                        : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel)]/70"
                      }`}
        >
          {tab.label}
          <span className={`text-[10px] px-1.5 min-w-[18px] text-center rounded-full
            ${activeTab === tab.value
              ? "bg-[#6e3102]/15 dark:bg-[#d4855a]/20 text-[#6e3102] dark:text-[#d4855a]"
              : "bg-[var(--line)] text-[var(--muted)]"}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );

  const Pagination = ({ total, current, onChange }: {
    total: number; current: number; onChange: (p: number) => void;
  }) => {
    if (total <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-3 px-1">
        <p className="text-xs text-[var(--muted)]">
          Page <span className="font-semibold text-[var(--text)]">{current}</span>{" "}
          of <span className="font-semibold text-[var(--text)]">{total}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--line)]
                       text-[var(--muted)] hover:bg-[#6e3102]/10 hover:text-[#6e3102] hover:border-[#6e3102]/30
                       dark:hover:bg-[#d4855a]/10 dark:hover:text-[#d4855a]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          ><ChevronLeft size={14} /></button>
          {Array.from({ length: total }, (_, i) => i + 1).map(p => (
            <button
              key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all
                ${p === current
                  ? "bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] shadow-sm"
                  : "border border-[var(--line)] text-[var(--muted)] hover:bg-[#6e3102]/10 hover:text-[#6e3102] hover:border-[#6e3102]/30 dark:hover:bg-[#d4855a]/10 dark:hover:text-[#d4855a]"
                }`}
            >{p}</button>
          ))}
          <button
            onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--line)]
                       text-[var(--muted)] hover:bg-[#6e3102]/10 hover:text-[#6e3102] hover:border-[#6e3102]/30
                       dark:hover:bg-[#d4855a]/10 dark:hover:text-[#d4855a]
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          ><ChevronRight size={14} /></button>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Upload Modal ──────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          role="dialog" aria-modal="true" aria-label="Upload document"
        >
          <div
            className="bg-[var(--panel)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            style={{ animation: "modalIn 0.22s ease both" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6e3102]/10 dark:bg-[#d4855a]/10 flex items-center justify-center flex-shrink-0">
                  <UploadCloud size={19} className="text-[#6e3102] dark:text-[#d4855a]" />
                </div>
                <div>
                  <p className="font-bold text-[0.95rem] text-[var(--text)]">Upload New Document</p>
                  <p className="text-xs text-[var(--muted)]">CSV format only · Maximum 10 MB per file</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)]
                           hover:bg-[var(--bg-soft)] hover:text-[var(--text)] transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="modal-doc-type" className="block text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    id="modal-doc-type"
                    value={selectedType}
                    onChange={v => setSelectedType(v as DocType | "")}
                    placeholder="Select document type..."
                    options={DOC_TYPES.map(d => ({ value: d.value, label: d.label }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="modal-academic-year" className="block text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    id="modal-academic-year"
                    value={selectedAY}
                    onChange={v => setSelectedAY(v)}
                    placeholder="Select academic year..."
                    options={ACADEMIC_YEARS.map(ay => ({ value: ay, label: ay }))}
                  />
                </div>
              </div>

              {/* Drop zone */}
              <div
                role="button" tabIndex={0}
                aria-label="File upload area"
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center
                            rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                            ${dragOver
                              ? "border-[#6e3102] dark:border-[#d4855a] bg-[#6e3102]/5 scale-[1.01]"
                              : selectedFile
                                ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-900/10"
                                : "border-[var(--line)] hover:border-[#6e3102]/35 dark:hover:border-[#d4855a]/35 hover:bg-[#6e3102]/[0.02]"
                            }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                       onChange={handleFileInput} aria-hidden="true" />
                {selectedFile ? (
                  <>
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 break-all">{selectedFile.name}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB · CSV</p>
                    </div>
                    <p className="text-xs text-[var(--muted)]">Click to replace file</p>
                    <button
                      onClick={clearFile}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center
                                 bg-[var(--bg-soft)] text-[var(--muted)]
                                 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                    ><X size={13} /></button>
                  </>
                ) : (
                  <>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors
                      ${dragOver ? "bg-[#6e3102]/15 dark:bg-[#d4855a]/15" : "bg-[var(--bg-soft)]"}`}>
                      <Upload size={20} className={dragOver ? "text-[#6e3102] dark:text-[#d4855a]" : "text-[var(--muted)]"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {dragOver ? "Release to upload" : "Click to browse or drag & drop"}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">CSV files only · Max 10 MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[var(--line)]
                             text-[var(--muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)] transition-all"
                >Cancel</button>
                <button
                  onClick={handleUpload} disabled={uploading}
                  className={`flex-[2] py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                              focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40
                              ${uploading
                                ? "bg-[#6e3102]/40 dark:bg-[#d4855a]/25 text-white/60 cursor-not-allowed"
                                : "bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] hover:bg-[#5a2801] dark:hover:bg-[#e09873] shadow-lg shadow-[#6e3102]/20"
                              }`}
                >
                  {uploading
                    ? <span className="flex items-center justify-center gap-2.5">
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Uploading...
                      </span>
                    : "Upload Document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          role="alert" aria-live="assertive"
          style={{ animation: "slideInRight 0.3s ease both" }}
          className={`fixed top-5 right-5 z-[400] flex items-center gap-3 pl-4 pr-3 py-3.5 rounded-2xl
                      shadow-2xl text-sm font-semibold max-w-xs
                      ${toast.type === "success" ? "bg-emerald-600 text-white"
                      : toast.type === "error"   ? "bg-red-600    text-white"
                      :                            "bg-amber-500  text-white"}`}
        >
          {toast.type === "success" ? <CheckCircle2 size={17} className="flex-shrink-0" />
           : toast.type === "error" ? <X size={17} className="flex-shrink-0" />
           :                          <AlertTriangle size={17} className="flex-shrink-0" />}
          <span className="leading-snug">{toast.message}</span>
          <button onClick={() => setToast(null)}
            className="ml-1 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/10 transition-colors">
            <X size={13} />
          </button>
        </div>
      )}

      {}
      <div className="flex w-full min-h-screen" style={{ background: "var(--bg)" }}>

        {/* Decorative blobs (fixed, behind content) */}
        <div aria-hidden="true" className="pointer-events-none fixed top-[-8%] right-[-6%] w-[280px] h-[280px] lg:w-[420px] lg:h-[420px] rounded-full bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[70px] lg:blur-[100px] z-0" />
        <div aria-hidden="true" className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[220px] h-[220px] lg:w-[340px] lg:h-[340px] rounded-full bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[60px] lg:blur-[80px] z-0" />

        <DesktopSidebar />
        <MobileSidebar />

        {/* ── Main content — no lg:ml-64, sidebar already shifts us right ── */}
        <main
          role="main"
          className="relative z-10 flex-1 min-w-0 min-h-screen flex flex-col pt-16 lg:pt-0"
          style={{ background: "var(--bg)" }}
        >

          {/* ══ WHITE HEADER BAR ════════════════════════════════════════════ */}
          <div
            className="bg-[var(--panel)] border-b border-[var(--line)] px-6 lg:px-10 pt-8 pb-0"
            style={{ animation: "fadeUp 0.4s ease both" }}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              <ClipboardList size={12} />
              CISTM · File Management
            </div>

            <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight leading-tight text-[var(--text)]">
              College of Information Systems and{" "}
              <span className="text-[#6e3102] dark:text-[#d4855a]">Technology Management</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Upload and track academic documents for the college.
            </p>

            {/* Tabs + Upload button on same row */}
            <div className="flex items-end justify-between mt-6">
              <div className="flex items-center gap-8" role="tablist" aria-label="Main views">
                {([
                  { id: "submitted"    as MainTab, label: "Submitted",    icon: <FileText size={15} />,      count: submittedFiles.length, accent: false },
                  { id: "deficiencies" as MainTab, label: "Deficiencies", icon: <AlertTriangle size={15} />, count: deficiencies.length,  accent: deficiencies.length > 0 },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    role="tab" aria-selected={mainTab === tab.id}
                    onClick={() => setMainTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-all relative focus:outline-none
                      ${mainTab === tab.id
                        ? "text-[#6e3102] dark:text-[#d4855a] border-b-2 border-[#6e3102] dark:border-[#d4855a]"
                        : "text-[var(--muted)] hover:text-[var(--text)] border-b-2 border-transparent"
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md min-w-[22px] text-center
                      ${mainTab === tab.id
                        ? "bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212]"
                        : tab.accent
                          ? "bg-red-100 dark:bg-red-900/35 text-red-600 dark:text-red-400"
                          : "bg-[var(--bg-soft)] text-[var(--muted)]"
                      }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Upload button — sits inline with tabs, bottom-aligned */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="mb-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                           bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212]
                           hover:bg-[#5a2801] dark:hover:bg-[#e09873]
                           shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10
                           transition-all duration-200 focus:outline-none
                           focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40"
              >
                <Upload size={15} />
                Upload
              </button>
            </div>
          </div>

          {/* ══ CONTENT ════════════════════════════════════════════════════ */}
          <div className="flex-1 px-6 lg:px-10 py-7 space-y-4">

            {/* ── SUBMITTED ─────────────────────────────────────────────── */}
            {mainTab === "submitted" && (
              <section
                role="tabpanel" aria-label="Submitted documents"
                style={{ animation: "fadeUp 0.35s 0.05s ease both", opacity: 0, animationFillMode: "forwards" }}
                className="space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <SubTabPills
                    activeTab={subTab} setTab={setSubTab}
                    counts={{
                      all: submittedFiles.length,
                      ...Object.fromEntries(DOC_TYPES.map(d => [d.value, submittedFiles.filter(f => f.type === d.value).length])),
                    }}
                  />
                  <div className="flex items-center gap-2 lg:ml-auto">
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                      <input
                        type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search documents..." aria-label="Search submitted documents"
                        className="w-56 pl-9 pr-4 py-2.5 rounded-xl text-sm
                                   bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--muted)]
                                   focus:outline-none focus:ring-2 focus:ring-[#6e3102]/20 dark:focus:ring-[#d4855a]/20
                                   focus:border-[#6e3102]/40 dark:focus:border-[#d4855a]/40 transition-all"
                      />
                    </div>
                    <SortDropdown value={sortOrder} onChange={setSortOrder} />
                  </div>
                </div>

                <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-3 space-y-2 overflow-y-auto" style={{ minHeight: "400px", maxHeight: "560px" }}>
                    {filteredSubmitted.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-soft)] flex items-center justify-center">
                          <FileText size={22} className="text-[var(--muted)]" />
                        </div>
                        <p className="text-sm font-semibold text-[var(--muted)]">No documents found</p>
                        <p className="text-xs text-[var(--muted)] max-w-xs">
                          {searchQuery ? "No results match your search. Try different keywords."
                            : "No documents submitted under this category."}
                        </p>
                      </div>
                    ) : paginatedSubmitted.map((file, idx) => (
                      <div
                        key={file.id}
                        style={{ animation: `fadeUp 0.22s ${idx * 0.025}s ease both`, opacity: 0, animationFillMode: "forwards" }}
                        className="bg-[var(--card)] border border-[var(--line)] rounded-xl px-4 py-3.5
                                   hover:border-[#6e3102]/25 dark:hover:border-[#d4855a]/25
                                   hover:shadow-sm transition-all duration-150
                                   flex flex-col md:flex-row md:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#6e3102]/10 dark:bg-[#d4855a]/10 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet size={15} className="text-[#6e3102] dark:text-[#d4855a]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono font-bold text-[#6e3102] dark:text-[#d4855a]">{file.id}</p>
                            <p className="text-sm font-semibold text-[var(--text)] truncate leading-snug">{file.title}</p>
                            <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">{file.filename}</p>
                          </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 flex-shrink-0 pl-12 md:pl-0">
                          <DocBadge type={file.type} />
                          <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                            <Calendar size={11} className="flex-shrink-0" /> {file.ay}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                            <Clock size={11} className="flex-shrink-0" /> {file.dateSubmitted}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Pagination total={submittedTotalPages} current={currentPage} onChange={setCurrentPage} />
              </section>
            )}

            {/* ── DEFICIENCIES ──────────────────────────────────────────── */}
            {mainTab === "deficiencies" && (
              <section
                role="tabpanel" aria-label="Deficiency list"
                style={{ animation: "fadeUp 0.35s 0.05s ease both", opacity: 0, animationFillMode: "forwards" }}
                className="space-y-3"
              >
                {deficiencies.length === 0 ? (
                  <div className="rounded-2xl bg-[var(--panel)] border border-[var(--line)] py-14 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/25 flex items-center justify-center">
                      <CheckCircle2 size={26} className="text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-[var(--text)]">All caught up!</p>
                    <p className="text-xs text-[var(--muted)] max-w-xs">No deficiencies on record.</p>
                  </div>
                ) : (
                  <>
                    {overdueCount > 0 && (
                      <div role="status" className="rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200/70 dark:border-red-700/25 px-4 py-3 flex items-start gap-3">
                        <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                          <strong>{overdueCount} document{overdueCount !== 1 ? "s" : ""}</strong>{" "}
                          {overdueCount !== 1 ? "are" : "is"} currently{" "}
                          <span className="font-semibold">overdue</span> and require immediate attention.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <SubTabPills
                        activeTab={defSubTab} setTab={setDefSubTab}
                        counts={{
                          all: deficiencies.length,
                          ...Object.fromEntries(DOC_TYPES.map(d => [d.value, deficiencies.filter(f => f.type === d.value).length])),
                        }}
                      />
                      <div className="flex items-center gap-2 lg:ml-auto">
                        <div className="relative">
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                          <input
                            type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search deficiencies..." aria-label="Search deficiencies"
                            className="w-56 pl-9 pr-4 py-2.5 rounded-xl text-sm
                                       bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] placeholder-[var(--muted)]
                                       focus:outline-none focus:ring-2 focus:ring-[#6e3102]/20 dark:focus:ring-[#d4855a]/20
                                       focus:border-[#6e3102]/40 dark:focus:border-[#d4855a]/40 transition-all"
                          />
                        </div>
                        <SortDropdown value={sortOrder} onChange={setSortOrder} />
                      </div>
                    </div>

                    <div className="bg-[var(--panel)] border border-[var(--line)] rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-3 space-y-2 overflow-y-auto" style={{ minHeight: "400px", maxHeight: "560px" }}>
                        {filteredDeficiencies.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-soft)] flex items-center justify-center">
                              <AlertCircle size={22} className="text-[var(--muted)]" />
                            </div>
                            <p className="text-sm font-semibold text-[var(--muted)]">No deficiencies found</p>
                            <p className="text-xs text-[var(--muted)] max-w-xs">
                              {searchQuery ? "No results match your search." : "No deficiencies under this category."}
                            </p>
                          </div>
                        ) : paginatedDef.map((def, idx) => (
                          <div
                            key={def.id}
                            style={{ animation: `fadeUp 0.22s ${idx * 0.025}s ease both`, opacity: 0, animationFillMode: "forwards" }}
                            className={`relative bg-[var(--card)] border rounded-xl px-4 py-3.5 overflow-hidden
                                        hover:shadow-sm transition-all duration-150
                                        flex flex-col md:flex-row md:items-center justify-between gap-2
                                        ${def.status === "overdue"
                                          ? "border-red-200 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800/50"
                                          : "border-amber-200 dark:border-amber-900/25 hover:border-amber-300 dark:hover:border-amber-800/40"
                                        }`}
                          >
                            <span aria-hidden="true" className={`absolute left-0 top-0 bottom-0 w-[3px]
                              ${def.status === "overdue" ? "bg-red-400 dark:bg-red-600" : "bg-amber-400 dark:bg-amber-500"}`}
                            />
                            <div className="flex items-center gap-3 flex-1 min-w-0 pl-1">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                ${def.status === "overdue" ? "bg-red-100 dark:bg-red-900/25" : "bg-amber-100 dark:bg-amber-900/25"}`}>
                                <AlertCircle size={15} className={def.status === "overdue" ? "text-red-500 dark:text-red-400" : "text-amber-500 dark:text-amber-400"} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-mono font-bold text-[var(--muted)]">{def.id}</p>
                                <p className="text-sm font-semibold text-[var(--text)] truncate leading-snug">{def.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 flex-shrink-0 pl-12 md:pl-0">
                              <DocBadge type={def.type} />
                              <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                                <Calendar size={11} className="flex-shrink-0" /> {def.ay}
                              </span>
                              <span className={`flex items-center gap-1 text-xs font-semibold
                                ${def.status === "overdue" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                                <Clock size={11} className="flex-shrink-0" /> Due: {def.dueDate}
                              </span>
                              <DefStatusBadge status={def.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Pagination total={defTotalPages} current={currentPage} onChange={setCurrentPage} />
                  </>
                )}
              </section>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}