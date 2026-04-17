"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle2, RefreshCw, Search, ChevronDown } from "lucide-react";
import {
  getFaqEntry,
  getUncertainQuestions,
  closeUncertainQuestion,
  resolveUncertainQuestion,
  type UncertainQuestion,
} from "../../../lib/registrar-client";
import {
  deriveCategoryFromTag,
  getTagOptions,
  normalizePromptRoleTag,
  type FaqSection,
} from "../../../lib/faq-tags";
import { type FaqContextEntry } from "../../../lib/registrar-client";

type SelectOption = {
  value: string;
  label: string;
};

type ResolveForm = {
  section: FaqSection;
  scopeType: string;
  title: string;
  answer: string;
};

const defaultForm: ResolveForm = {
  section: "faq",
  scopeType: "faq-general",
  title: "",
  answer: "",
};

type QuestionSort = "created-desc" | "created-asc" | "confidence-desc" | "confidence-asc";

const questionSortOptions: SelectOption[] = [
  { value: "created-desc", label: "Newest first" },
  { value: "created-asc", label: "Oldest first" },
  { value: "confidence-desc", label: "Highest confidence" },
  { value: "confidence-asc", label: "Lowest confidence" },
];

const statusFilterOptions: SelectOption[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const sectionOptions: SelectOption[] = [
  { value: "faq", label: "FAQ" },
  { value: "context", label: "Context" },
];

function getDefaultScopeType(section: FaqSection) {
  return section === "faq" ? "faq-general" : "context-general";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

// --- REUSABLE CUSTOM SELECT COMPONENT ---
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
        <div className="absolute z-20 w-full mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
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
// ----------------------------------------

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<UncertainQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UncertainQuestion | null>(null);
  const [form, setForm] = useState<ResolveForm>(defaultForm);
  const [statusFilter, setStatusFilter] = useState("open");
  const [sortBy, setSortBy] = useState<QuestionSort>("created-desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"resolve" | "close" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  const [resolvedEntry, setResolvedEntry] = useState<FaqContextEntry | null>(null);

  const resolvedFallbackAnswer = selectedQuestion?.resolutionAnswer?.trim() ?? "";
  const hasMissingLinkedEntry = Boolean(
    selectedQuestion?.status === "closed" &&
    selectedQuestion?.resolutionEntryId &&
    !resolvedEntry &&
    !resolvedFallbackAnswer
  );
  useEffect(() => {
    if (!selectedQuestion || selectedQuestion.status !== "closed") {
      setResolvedEntry(null);
      return;
    }

    const resolutionEntryId = selectedQuestion.resolutionEntryId;
    if (resolutionEntryId) {
      const loadEntry = async () => {
        try {
          const entry = await getFaqEntry(resolutionEntryId);
          setResolvedEntry(entry);
        } catch (error) {
          setResolvedEntry(null);
        }
      };
      void loadEntry();
    }
  }, [selectedQuestion]);


  const loadQuestions = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getUncertainQuestions({ status: statusFilter, limit: 200 });
      setQuestions(data);
      setSelectedQuestion((current) => {
        if (!current) {
          return data[0] ?? null;
        }

        const refreshed = data.find((entry) => entry.id === current.id);
        return refreshed ?? data[0] ?? null;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, [statusFilter]);

  useEffect(() => {
    if (!selectedQuestion) {
      setForm(defaultForm);
      return;
    }

    const defaultCategory = selectedQuestion.routing.startsWith("faq") ? "faq" : "context";
    const defaultSection = defaultCategory as FaqSection;
    setForm({
      section: defaultSection,
      scopeType: getDefaultScopeType(defaultSection),
      title: selectedQuestion.questionText,
      answer: "",
    });
  }, [selectedQuestion]);

  useEffect(() => {
    if (!selectedQuestion || form.section !== "faq") {
      return;
    }

    const fallbackQuestion = selectedQuestion.questionText.trim();
    if (!form.title.trim() && fallbackQuestion) {
      setForm((current) => ({ ...current, title: fallbackQuestion }));
    }
  }, [form.section, form.title, selectedQuestion]);

  const visibleQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scoped = questions.filter((entry) => {
      if (!query) {
        return true;
      }

      return [entry.questionText, entry.studentNo, entry.routing]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    const sorted = [...scoped];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "created-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "confidence-desc":
          return b.confidence - a.confidence;
        case "confidence-asc":
          return a.confidence - b.confidence;
        case "created-desc":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [questions, search, sortBy]);

  const scopeOptions = useMemo<SelectOption[]>(() => {
    return getTagOptions(form.section).map((tag) => ({ value: tag, label: tag }));
  }, [form.section]);

  const submitResolution = async () => {
    if (!selectedQuestion || !form.title.trim() || !form.answer.trim()) {
      return;
    }

    setActionLoading("resolve");
    setErrorMessage(null);
    try {
      await resolveUncertainQuestion(selectedQuestion.id, {
        category: deriveCategoryFromTag(form.scopeType, form.section),
        scopeType: normalizePromptRoleTag(form.scopeType),
        collegeCode: "",
        programCode: "",
        title: form.title.trim(),
        answer: form.answer.trim(),
      });

      await loadQuestions();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to resolve question.");
    } finally {
      setActionLoading(null);
    }
  };

  const requestCloseWithoutResolution = () => {
    if (!selectedQuestion) {
      return;
    }

    if (selectedQuestion.status !== "open") {
      return;
    }

    setCloseNotes("");
    setCloseModalOpen(true);
  };

  const confirmCloseWithoutResolution = async () => {
    if (!selectedQuestion) {
      return;
    }

    setActionLoading("close");
    setErrorMessage(null);
    try {
      await closeUncertainQuestion(selectedQuestion.id, { notes: closeNotes.trim() });
      setCloseModalOpen(false);
      setCloseNotes("");
      await loadQuestions();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to close question.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="pt-16 lg:pt-0 p-6 lg:p-8 space-y-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6e3102] dark:text-[#d4855a]">Knowledge Expansion Queue</p>
                <h1 className="text-3xl font-extrabold tracking-tight">Captured Questions</h1>
              </div>
              <button onClick={() => void loadQuestions()} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] text-white dark:text-[#121212] font-semibold">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {errorMessage ? (
              <div className="mt-3 rounded-xl border border-rose-300/60 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            ) : null}
          </section>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-4">
              <div className="space-y-3">
                <div className="relative w-full">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search captured questions..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="z-20">
                    <CustomSelect
                      value={statusFilter}
                      options={statusFilterOptions}
                      onChange={(val) => setStatusFilter(val)}
                    />
                  </div>
                  <div className="z-20">
                    <CustomSelect
                      value={sortBy}
                      options={questionSortOptions}
                      onChange={(val) => setSortBy(val as QuestionSort)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {loading ? <p className="text-sm text-gray-500">Loading...</p> : null}
                {!loading && visibleQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-500">
                    No questions in this view.
                  </div>
                ) : null}
                {!loading
                  ? visibleQuestions.map((entry) => {
                      const active = selectedQuestion?.id === entry.id;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedQuestion(entry)}
                          className={`w-full text-left rounded-2xl border p-4 transition ${
                            active
                              ? "border-[#6e3102]/40 bg-[#6e3102]/5 dark:bg-[#d4855a]/10"
                              : "border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">{entry.status}</div>
                            <div className="text-xs text-gray-400">{(entry.confidence * 100).toFixed(0)}%</div>
                          </div>
                          <p className="font-semibold mt-2 line-clamp-2">{entry.questionText}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {entry.studentNo || "guest"} · {entry.routing} · {formatDate(entry.createdAt)}
                          </p>
                        </button>
                      );
                    })
                  : null}
              </div>
            </section>

            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-3 h-fit">
              <div className="flex items-center gap-2 text-[#6e3102] dark:text-[#d4855a] font-bold uppercase tracking-[0.2em] text-xs">
                <CheckCircle2 size={14} />
                {selectedQuestion?.status === "closed" ? "Resolution Details" : "Resolve as New Entry"}
              </div>
              {!selectedQuestion ? <p className="text-sm text-gray-500">Select a question to answer.</p> : null}

              {selectedQuestion?.status === "closed" ? (
                <>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Question</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedQuestion.questionText}</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-blue-50/40 dark:bg-blue-950/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400 mb-2">Status</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {selectedQuestion.resolutionCategory === "closed-without-entry"
                        ? "Closed Without Entry"
                        : resolvedEntry
                        ? "Resolved with FAQ/Context Entry"
                        : resolvedFallbackAnswer
                        ? "Resolved with saved answer"
                        : "Closed"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Closed on {formatDate(selectedQuestion.resolvedAt ?? selectedQuestion.updatedAt)}
                    </p>
                  </div>

                  {resolvedEntry && (
                    <>
                      <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                          {resolvedEntry.category === "faq" ? "FAQ Question" : "Context Title"}
                        </p>
                        <p className="text-sm mt-1">{resolvedEntry.title}</p>
                      </div>

                      <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Answer</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{resolvedEntry.answer}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Scope Type</p>
                          <p className="text-sm mt-1 font-mono">{resolvedEntry.scopeType}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Category</p>
                          <p className="text-sm mt-1 font-mono">{resolvedEntry.category}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {!resolvedEntry && resolvedFallbackAnswer ? (
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                        {selectedQuestion.resolutionCategory === "closed-without-entry" ? "Close notes" : "Answer"}
                      </p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{resolvedFallbackAnswer}</p>
                    </div>
                  ) : null}

                  {hasMissingLinkedEntry ? (
                    <div className="rounded-xl border border-amber-300/60 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Linked entry missing</p>
                      <p className="text-sm mt-1 text-amber-800 dark:text-amber-200">
                        This question references entry ID {selectedQuestion?.resolutionEntryId}, but that FAQ/context entry no longer exists.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
              {selectedQuestion ? (
                selectedQuestion.status !== "closed" ? (
                  <>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Question</p>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedQuestion.questionText}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 z-10 relative">
                    <CustomSelect
                      value={form.section}
                      options={sectionOptions}
                      onChange={(val) => {
                        const nextSection = val as FaqSection;
                        setForm((current) => ({
                          ...current,
                          section: nextSection,
                          scopeType: getDefaultScopeType(nextSection),
                          title: nextSection === "faq" && !current.title.trim() && selectedQuestion
                            ? selectedQuestion.questionText
                            : current.title,
                        }));
                      }}
                    />

                      <CustomSelect
                        value={form.scopeType}
                        options={scopeOptions}
                        onChange={(val) => setForm((current) => ({ ...current, scopeType: val }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                        {form.section === "faq" ? "Question" : "Context title"}
                      </p>
                      <input
                        value={form.title}
                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder={form.section === "faq" ? "FAQ question" : "Entry title"}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
                      />
                      {form.section === "faq" && selectedQuestion ? (
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, title: selectedQuestion.questionText }))}
                          className="text-xs text-[#6e3102] dark:text-[#d4855a] hover:underline"
                        >
                          Use captured question text
                        </button>
                      ) : null}
                    </div>

                    <textarea
                      value={form.answer}
                      onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
                      placeholder="Answer content"
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
                    />

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => void submitResolution()}
                        disabled={actionLoading !== null || selectedQuestion.status !== "open"}
                        className="px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] dark:text-[#121212] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === "resolve" ? "Resolving..." : "Resolve Question"}
                      </button>

                      <button
                        onClick={requestCloseWithoutResolution}
                        disabled={actionLoading !== null || selectedQuestion.status !== "open"}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Close Without Entry
                      </button>
                    </div>
                  </>
                              ) : null
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {closeModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (actionLoading === null) {
                setCloseModalOpen(false);
              }
            }}
            aria-label="Dismiss close modal"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-5 shadow-xl">
            <h2 className="text-lg font-bold">Close Without Creating Entry</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              This will mark the selected captured question as closed and will not create an FAQ/context entry.
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Optional notes</label>
              <textarea
                value={closeNotes}
                onChange={(event) => setCloseNotes(event.target.value)}
                rows={4}
                placeholder="Reason for closing (optional)"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y focus:outline-none focus:ring-2 focus:ring-[#6e3102] dark:focus:ring-[#d4855a] transition-all"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => setCloseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => void confirmCloseWithoutResolution()}
                className="px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] dark:text-[#121212] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "close" ? "Closing..." : "Confirm Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}