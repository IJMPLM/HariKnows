"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Plus, RefreshCw, Search, Pencil, Trash2, ChevronDown,
  ListFilter, BookOpen,
  ArrowDownAZ, ArrowDownZA, ArrowDownNarrowWide, ArrowUpNarrowWide,
} from "lucide-react";
import { createFaqEntry, deleteFaqEntry, getFaqEntries, updateFaqEntry, type FaqContextEntry } from "../../../lib/registrar-client";
import {
  deriveCategoryFromTag,
  getTagOptions,
  isFaqTag,
  normalizePromptRoleTag,
  type FaqSection,
} from "../../../lib/faq-tags";

type SelectOption = {
  value: string;
  label: string;
};

type FaqFormState = {
  scopeType: string;
  category: string;
  title: string;
  answer: string;
};

type EntryFilters = {
  scopeType: string;
  sortBy: "latest-desc" | "latest-asc" | "title-asc" | "title-desc";
};

const createEmptyForm = (section: FaqSection): FaqFormState => ({
  scopeType: section === "faq" ? "faq-general" : "context-general",
  category: section === "faq" ? "faq" : "context",
  title: "",
  answer: "",
});

const createDefaultFilters = (): EntryFilters => ({
  scopeType: "all",
  sortBy: "latest-desc",
});

const isFaqEntry = (entry: FaqContextEntry) => isFaqTag(entry.scopeType);

// Display-only label map — raw tag values are never changed
const scopeDisplayLabel: Record<string, string> = {
  "faq-general": "General",
  "faq-non-guest": "Students",
};
const getScopeDisplayLabel = (tag: string) => scopeDisplayLabel[tag] ?? tag;

type SortOption = { value: EntryFilters["sortBy"]; label: string; Icon: React.ElementType };
const sortOptions: SortOption[] = [
  { value: "latest-desc", label: "Newest First", Icon: ArrowDownNarrowWide },
  { value: "latest-asc",  label: "Oldest First", Icon: ArrowUpNarrowWide },
  { value: "title-asc",   label: "Title A–Z",    Icon: ArrowDownAZ },
  { value: "title-desc",  label: "Title Z–A",    Icon: ArrowDownZA },
];

// ── Tag Filter Dropdown (compact pill button) ─────────────────────────────────

function TagFilterButton({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
          value !== "all"
            ? "bg-[#6e3102] dark:bg-[#d4855a] border-[#6e3102] dark:border-[#d4855a] text-white dark:text-[#121212]"
            : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
        }`}
      >
        {selected?.label ?? value}
        <ChevronDown
          size={13}
          className={`transition-transform duration-150 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-30 w-44 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-xl py-1.5">
          <p className="px-3 pt-1 pb-1.5 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Filter by tag
          </p>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                value === option.value
                  ? "text-[#6e3102] dark:text-[#d4855a] bg-[#6e3102]/5 dark:bg-[#d4855a]/10"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Scope Select (form dropdown) ──────────────────────────────────────────────

function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

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
        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
      >
        <span className="truncate block">{selected?.label ?? value}</span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`px-4 py-2.5 cursor-pointer transition-colors text-sm flex items-center ${
                value === option.value
                  ? "bg-gray-100 dark:bg-white/10 text-[#6e3102] dark:text-[#d4855a] font-bold"
                  : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FaqContextPage() {
  const [entries, setEntries] = useState<FaqContextEntry[]>([]);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<FaqSection>("faq");
  const [loading, setLoading] = useState(true);
  const [faqDraft, setFaqDraft] = useState<FaqFormState>(createEmptyForm("faq"));
  const [contextDraft, setContextDraft] = useState<FaqFormState>(createEmptyForm("context"));
  const [editingIds, setEditingIds] = useState<{ faq: number | null; context: number | null }>({ faq: null, context: null });
  const [faqFilters, setFaqFilters] = useState<EntryFilters>(createDefaultFilters());
  const [contextFilters, setContextFilters] = useState<EntryFilters>(createDefaultFilters());

  // Sort menu state
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Delete modal state
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFaqEntries({ includeUnpublished: true, limit: 200 });
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    // Close sort menu on outside click
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close sort menu when switching sections
  useEffect(() => { setShowSortMenu(false); }, [activeSection]);

  const form = activeSection === "faq" ? faqDraft : contextDraft;
  const activeEditingId = activeSection === "faq" ? editingIds.faq : editingIds.context;
  const activeFilters = activeSection === "faq" ? faqFilters : contextFilters;

  const updateActiveForm = (updater: (prev: FaqFormState) => FaqFormState) => {
    if (activeSection === "faq") {
      setFaqDraft((prev) => updater(prev));
      return;
    }
    setContextDraft((prev) => updater(prev));
  };

  const updateActiveFilters = (updater: (prev: EntryFilters) => EntryFilters) => {
    if (activeSection === "faq") {
      setFaqFilters((prev) => updater(prev));
      return;
    }
    setContextFilters((prev) => updater(prev));
  };

  const visibleEntries = useMemo(
    () => entries.filter((entry) => (activeSection === "faq" ? isFaqEntry(entry) : !isFaqEntry(entry))),
    [entries, activeSection],
  );

  const faqEntries = useMemo(() => entries.filter(isFaqEntry), [entries]);
  const contextEntries = useMemo(() => entries.filter((e) => !isFaqEntry(e)), [entries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scoped = visibleEntries.filter((entry) => {
      if (activeFilters.scopeType !== "all" && entry.scopeType !== activeFilters.scopeType) {
        return false;
      }
      if (!query) return true;
      return [entry.title, entry.answer, entry.category, entry.scopeType, entry.collegeCode, entry.programCode]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    const sorted = [...scoped];
    sorted.sort((a, b) => {
      switch (activeFilters.sortBy) {
        case "latest-asc":
          return Math.max(new Date(a.updatedAt).getTime(), new Date(a.createdAt).getTime())
            - Math.max(new Date(b.updatedAt).getTime(), new Date(b.createdAt).getTime());
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "latest-desc":
        default:
          return Math.max(new Date(b.updatedAt).getTime(), new Date(b.createdAt).getTime())
            - Math.max(new Date(a.updatedAt).getTime(), new Date(a.createdAt).getTime());
      }
    });

    return sorted;
  }, [activeFilters, visibleEntries, search]);

  const scopeFilterOptions = useMemo<SelectOption[]>(() => {
    const sectionTags = getTagOptions(activeSection).map((tag) => ({ value: tag, label: getScopeDisplayLabel(tag) }));
    return [{ value: "all", label: "All" }, ...sectionTags];
  }, [activeSection]);

  const scopeFormOptions = useMemo<SelectOption[]>(() => {
    return getTagOptions(activeSection).map((tag) => ({ value: tag, label: getScopeDisplayLabel(tag) }));
  }, [activeSection]);

  const startEdit = (entry: FaqContextEntry) => {
    const section = isFaqEntry(entry) ? "faq" : "context";
    const nextForm: FaqFormState = {
      scopeType: normalizePromptRoleTag(entry.scopeType),
      category: entry.category,
      title: entry.title,
      answer: entry.answer,
    };
    setActiveSection(section);
    setEditingIds((prev) => ({ ...prev, [section]: entry.id }));
    if (section === "faq") {
      setFaqDraft(nextForm);
      return;
    }
    setContextDraft(nextForm);
  };

  const resetForm = () => {
    setEditingIds((prev) => ({ ...prev, [activeSection]: null }));
    if (activeSection === "faq") {
      setFaqDraft(createEmptyForm("faq"));
      return;
    }
    setContextDraft(createEmptyForm("context"));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.answer.trim()) return;

    const payload = {
      scopeType: normalizePromptRoleTag(form.scopeType),
      collegeCode: "",
      programCode: "",
      category: activeSection === "faq"
        ? "faq"
        : deriveCategoryFromTag(form.scopeType, form.category),
      title: form.title.trim(),
      answer: form.answer.trim(),
    };

    if (activeEditingId) {
      await updateFaqEntry(activeEditingId, payload);
    } else {
      await createFaqEntry(payload);
    }

    setEditingIds((prev) => ({ ...prev, [activeSection]: null }));
    if (activeSection === "faq") {
      setFaqDraft(createEmptyForm("faq"));
    } else {
      setContextDraft(createEmptyForm("context"));
    }
    await load();
  };

  const remove = async (id: number) => {
    await deleteFaqEntry(id);
    await load();
  };

  const confirmDelete = async () => {
    if (deleteModalId === null) return;
    await remove(deleteModalId);
    setDeleteModalId(null);
  };

  const canConfirm = form.title.trim().length > 0 && form.answer.trim().length > 0;

  // Category display for the non-clickable field — display-only labels
  const categoryDisplay =
    activeSection === "faq"
      ? "FAQ"
      : form.scopeType === "other"
        ? form.category
        : "Context";

  const activeSortOption = sortOptions.find((o) => o.value === activeFilters.sortBy) ?? sortOptions[0];

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="pt-16 lg:pt-0 p-6 lg:p-8 space-y-6">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* ── Header ── */}
          <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6e3102] dark:text-[#d4855a] flex items-center gap-2">
                  <BookOpen size={13} aria-hidden="true" /> Registrar Knowledge Base
                </p>
                <h1 className="text-3xl font-extrabold tracking-tight">FAQs and Context</h1>
              </div>
              <button
                onClick={() => void load()}
                aria-label="Refresh"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          {/* ── Tabs ── */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-2 inline-flex gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("faq")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeSection === "faq"
                  ? "bg-[#6e3102] text-white dark:bg-[#d4855a] dark:text-[#121212]"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              FAQ
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === "faq"
                    ? "bg-white/20 text-white dark:bg-[#121212]/20 dark:text-[#121212]"
                    : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                }`}
              >
                {faqEntries.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("context")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeSection === "context"
                  ? "bg-[#6e3102] text-white dark:bg-[#d4855a] dark:text-[#121212]"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              Context
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeSection === "context"
                    ? "bg-white/20 text-white dark:bg-[#121212]/20 dark:text-[#121212]"
                    : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                }`}
              >
                {contextEntries.length}
              </span>
            </button>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">

            {/* ── Entry List Card ── */}
            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-4">

              {/* Search + Tag filter + Sort button row */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-0">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={`Search ${activeSection === "faq" ? "FAQs" : "context"}...`}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 focus:border-[#6e3102] dark:focus:border-[#d4855a] transition-all"
                  />
                </div>

                {/* Tag filter */}
                <TagFilterButton
                  value={activeFilters.scopeType}
                  options={scopeFilterOptions}
                  onChange={(nextScope) => updateActiveFilters((prev) => ({ ...prev, scopeType: nextScope }))}
                />

                {/* Sort button */}
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
                      {sortOptions.map(({ value, label, Icon }) => (
                        <button
                          key={value}
                          role="menuitem"
                          onClick={() => {
                            updateActiveFilters((prev) => ({ ...prev, sortBy: value }));
                            setShowSortMenu(false);
                          }}
                          className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                            activeFilters.sortBy === value
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

              {/* Entry count */}
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}
              </p>

              {/* Entries */}
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => {
                    const displayCategory = deriveCategoryFromTag(entry.scopeType, entry.category);
                    return (
                      <article
                        key={entry.id}
                        className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50/60 dark:bg-white/[0.03]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                              <span>{displayCategory}</span>
                              <span aria-hidden="true">·</span>
                              {/* Scope pill with tooltip */}
                              <span className="relative group/pill inline-block">
                                <span className="rounded-full bg-[#f2e8e1] dark:bg-[#39261a] px-2 py-1 text-[#6e3102] dark:text-[#d4855a] font-bold cursor-default">
                                  {getScopeDisplayLabel(entry.scopeType)}
                                </span>
                                {(entry.scopeType === "faq-general" || entry.scopeType === "faq-non-guest") && (
                                  <span
                                    role="tooltip"
                                    className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[200px] rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[11px] font-normal normal-case tracking-normal px-2.5 py-1.5 shadow-lg opacity-0 group-hover/pill:opacity-100 transition-opacity duration-150 z-50 text-center leading-snug whitespace-nowrap"
                                  >
                                    {entry.scopeType === "faq-general"
                                      ? "Visible to all users."
                                      : "Visible to students only."}
                                    <span aria-hidden="true" className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900 dark:border-b-gray-100" />
                                  </span>
                                )}
                              </span>
                            </div>
                            <h2 className="font-bold mt-1">{entry.title}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{entry.answer}</p>
                            {entry.scopeType === "other" ? (
                              <p className="text-xs text-gray-400">Custom category: {entry.category}</p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => startEdit(entry)}
                              aria-label="Edit entry"
                              className="p-2 rounded-xl bg-white dark:bg-[#101014] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              <Pencil size={14} aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => setDeleteModalId(entry.id)}
                              aria-label="Delete entry"
                              className="p-2 rounded-xl bg-white dark:bg-[#101014] border border-red-200 dark:border-red-900/40 text-red-400 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/10 transition-colors"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-500">
                    No entries match the current search.
                  </div>
                )}
              </div>
            </section>

            {/* ── New / Edit Entry Card ── */}
            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-3 h-fit">
              <div className="flex items-center gap-2 text-[#6e3102] dark:text-[#d4855a] font-bold uppercase tracking-[0.2em] text-xs">
                <Plus size={14} />
                {activeEditingId ? "Edit Entry" : "New Entry"}
              </div>

              {/* Category field (non-clickable) — top */}
              {activeSection === "context" && form.scopeType === "other" ? (
                <input
                  value={form.category}
                  onChange={(event) => updateActiveForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="custom category label"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
                />
              ) : (
                <input
                  value={categoryDisplay}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed text-sm"
                />
              )}

              {/* Audience visibility dropdown */}
              <CustomSelect
                value={form.scopeType}
                options={scopeFormOptions}
                onChange={(nextScope) => {
                  updateActiveForm((prev) => ({
                    ...prev,
                    scopeType: nextScope,
                    category: activeSection === "faq" ? "faq" : deriveCategoryFromTag(nextScope, prev.category),
                  }));
                }}
              />

              {/* Title */}
              <input
                value={form.title}
                onChange={(event) => updateActiveForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
              />

              {/* Answer */}
              <textarea
                value={form.answer}
                onChange={(event) => updateActiveForm((prev) => ({ ...prev, answer: event.target.value }))}
                placeholder="Enter answer here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
              />

              {/* Footer buttons — bottom right */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void submit()}
                  disabled={!canConfirm}
                  className="px-5 py-2.5 rounded-2xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  Confirm
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteModalId !== null && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-lg max-w-md w-full">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Entry</h2>
              <button
                onClick={() => setDeleteModalId(null)}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors -mt-0.5 -mr-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this entry? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-bold text-[0.95rem] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmDelete()}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 dark:bg-red-500 text-white font-bold text-[0.95rem] hover:bg-red-700 dark:hover:bg-red-600 active:scale-[0.98] transition-all shadow-md shadow-red-600/20 dark:shadow-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}