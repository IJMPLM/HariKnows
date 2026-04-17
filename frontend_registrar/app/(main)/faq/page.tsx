"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, RefreshCw, Search, Pencil, Trash2, ChevronDown } from "lucide-react";
import { createFaqEntry, deleteFaqEntry, getFaqEntries, updateFaqEntry, type FaqContextEntry } from "../../../lib/registrar-client";
import {
  deriveCategoryFromTag,
  getTagOptions,
  isGuestVisibleScopeTag,
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

const sortOptions: SelectOption[] = [
  { value: "latest-desc", label: "Latest" },
  { value: "latest-asc", label: "Oldest" },
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
];

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
          className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
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

  const visibleEntries = useMemo(() => entries.filter((entry) => (activeSection === "faq" ? isFaqEntry(entry) : !isFaqEntry(entry))), [entries, activeSection]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scoped = visibleEntries.filter((entry) => {
      if (activeFilters.scopeType !== "all" && entry.scopeType !== activeFilters.scopeType) {
        return false;
      }

      if (!query) {
        return true;
      }

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
    const sectionTags = getTagOptions(activeSection).map((tag) => ({ value: tag, label: tag }));
    return [{ value: "all", label: "All tags" }, ...sectionTags];
  }, [activeSection]);

  const scopeFormOptions = useMemo<SelectOption[]>(() => {
    return getTagOptions(activeSection).map((tag) => ({ value: tag, label: tag }));
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
    if (!form.title.trim() || !form.answer.trim()) {
      return;
    }

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
    if (!confirm("Delete this FAQ/context entry?")) {
      return;
    }

    await deleteFaqEntry(id);
    await load();
  };

  const sectionLabel = activeSection === "faq" ? "FAQs" : "Context";
  const sectionDescription = activeSection === "faq"
    ? "FAQ entries use explicit faq-general/faq-student tags."
    : "Context entries map directly to prompt sections through prompt role tags.";

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="pt-16 lg:pt-0 p-6 lg:p-8 space-y-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6e3102] dark:text-[#d4855a]">Registrar Knowledge Base</p>
                <h1 className="text-3xl font-extrabold tracking-tight">FAQs and Context</h1>
              </div>
              <button onClick={() => void load()} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] text-white dark:text-[#121212] font-semibold">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          </section>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-2 inline-flex gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("faq")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeSection === "faq" ? "bg-[#6e3102] text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}
            >
              FAQ CRUD
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("context")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeSection === "context" ? "bg-[#6e3102] text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}
            >
              Context CRUD
            </button>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{sectionLabel}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sectionDescription}</p>
                </div>
                <div className="text-sm text-gray-400">{filteredEntries.length} entries</div>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${activeSection === "faq" ? "FAQs" : "context"}...`}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <CustomSelect
                  value={activeFilters.scopeType}
                  options={scopeFilterOptions}
                  onChange={(nextScope) => updateActiveFilters((prev) => ({ ...prev, scopeType: nextScope }))}
                />
                <CustomSelect
                  value={activeFilters.sortBy}
                  options={sortOptions}
                  onChange={(nextSort) => updateActiveFilters((prev) => ({ ...prev, sortBy: nextSort as EntryFilters["sortBy"] }))}
                />
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => {
                    const displayCategory = deriveCategoryFromTag(entry.scopeType, entry.category);
                    return (
                    <article key={entry.id} className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50/60 dark:bg-white/[0.03]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                            <span>{displayCategory}</span>
                            <span>·</span>
                            <span className="rounded-full bg-[#f2e8e1] dark:bg-[#39261a] px-2 py-1 text-[#6e3102] dark:text-[#d4855a] font-bold">{entry.scopeType}</span>
                            {isGuestVisibleScopeTag(entry.scopeType) ? <span className="text-emerald-600 dark:text-emerald-400">Guest visible</span> : <span>Signed-in users</span>}
                          </div>
                          <h2 className="font-bold mt-1">{entry.title}</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{entry.answer}</p>
                          {entry.scopeType === "other" ? <p className="text-xs text-gray-400">Custom category: {entry.category}</p> : null}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => startEdit(entry)} className="p-2 rounded-xl bg-white dark:bg-[#101014] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => void remove(entry.id)} className="p-2 rounded-xl bg-white dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Trash2 size={14} />
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

            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-3 h-fit">
              <div className="flex items-center gap-2 text-[#6e3102] dark:text-[#d4855a] font-bold uppercase tracking-[0.2em] text-xs">
                <Plus size={14} /> {activeEditingId ? "Edit entry" : "New entry"}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{sectionDescription}</p>

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

              {activeSection === "context" && form.scopeType === "other" ? (
                <input
                  value={form.category}
                  onChange={(event) => updateActiveForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="custom category label"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
                />
              ) : (
                <input value={activeSection === "faq" ? "faq" : deriveCategoryFromTag(form.scopeType, form.category)} disabled className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-gray-500 cursor-not-allowed" />
              )}

              <input
                value={form.title}
                onChange={(event) => updateActiveForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder={activeSection === "faq" ? "title" : "context title"}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
              />
              <textarea
                value={form.answer}
                onChange={(event) => updateActiveForm((prev) => ({ ...prev, answer: event.target.value }))}
                placeholder={activeSection === "faq" ? "answer" : "context paragraphs"}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y min-h-[140px] focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
              />
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => void submit()} className="px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] dark:text-[#121212] text-white font-semibold transition-colors">
                  {activeEditingId ? "Save" : "Create"}
                </button>
                <button onClick={resetForm} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Reset</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}