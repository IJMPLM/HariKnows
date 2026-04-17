"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, Trash2 } from "lucide-react";
import {
  getUncertainQuestions,
  resolveUncertainQuestion,
  deleteUncertainQuestion,
  type UncertainQuestion,
} from "../../lib/registrar-client";
import {
  deriveCategoryFromTag,
  getTagOptions,
  normalizePromptRoleTag,
  type FaqSection,
} from "../../lib/faq-tags";

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

type QuestionSort = "created-desc" | "created-asc" | "confidence-desc" | "confidence-asc";

const defaultForm: ResolveForm = {
  section: "faq",
  scopeType: "faq-general",
  title: "",
  answer: "",
};

const sortOptions: SelectOption[] = [
  { value: "created-desc", label: "Newest first" },
  { value: "created-asc", label: "Oldest first" },
  { value: "confidence-desc", label: "Highest confidence" },
  { value: "confidence-asc", label: "Lowest confidence" },
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

type QuestionsPanelProps = {
  onKnowledgeAdded?: () => Promise<void> | void;
};

export default function QuestionsPanel({ onKnowledgeAdded }: QuestionsPanelProps) {
  const [questions, setQuestions] = useState<UncertainQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UncertainQuestion | null>(null);
  const [form, setForm] = useState<ResolveForm>(defaultForm);
  const [sortBy, setSortBy] = useState<QuestionSort>("created-desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"resolve" | "delete" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getUncertainQuestions({ status: "open", limit: 200 });
      setQuestions(data);
      setSelectedQuestion((current) => {
        if (!current) return data[0] ?? null;
        return data.find((entry) => entry.id === current.id) ?? data[0] ?? null;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, []);

  useEffect(() => {
    if (!selectedQuestion) {
      setForm(defaultForm);
      return;
    }

    const defaultSection = selectedQuestion.routing.startsWith("faq") ? "faq" : "context";
    setForm({
      section: defaultSection,
      scopeType: getDefaultScopeType(defaultSection),
      title: selectedQuestion.questionText,
      answer: "",
    });
  }, [selectedQuestion]);

  const visibleQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scoped = questions.filter((entry) => {
      if (!query) return true;
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

      await onKnowledgeAdded?.();
      await loadQuestions();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to answer question.");
    } finally {
      setActionLoading(null);
    }
  };

  const removeQuestion = async () => {
    if (!selectedQuestion) {
      return;
    }

    const shouldDelete = window.confirm("Delete this question permanently?");
    if (!shouldDelete) {
      return;
    }

    setActionLoading("delete");
    setErrorMessage(null);
    try {
      await deleteUncertainQuestion(selectedQuestion.id);
      await loadQuestions();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete question.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
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

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as QuestionSort)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {loading ? <p className="text-sm text-gray-500">Loading...</p> : null}
          {!loading && visibleQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-500">
              No pending questions.
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
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-400">pending</div>
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
          Answer and Publish
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-300/60 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        {!selectedQuestion ? <p className="text-sm text-gray-500">Select a question to answer.</p> : null}

        {selectedQuestion ? (
          <>
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Question</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{selectedQuestion.questionText}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.section}
                onChange={(event) => {
                  const nextSection = event.target.value as FaqSection;
                  setForm((current) => ({
                    ...current,
                    section: nextSection,
                    scopeType: getDefaultScopeType(nextSection),
                  }));
                }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
              >
                {sectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={form.scopeType}
                onChange={(event) => setForm((current) => ({ ...current, scopeType: event.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
              >
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                {form.section === "faq" ? "Question" : "Context title"}
              </p>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={form.section === "faq" ? "FAQ question" : "Entry title"}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
              />
            </div>

            <textarea
              value={form.answer}
              onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
              placeholder="Answer content"
              rows={6}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y"
            />

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => void submitResolution()}
                disabled={actionLoading !== null}
                className="px-4 py-2 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#d4855a] dark:hover:bg-[#e9a67f] dark:text-[#121212] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === "resolve" ? "Saving..." : "Add to Knowledge"}
              </button>

              <button
                onClick={() => void removeQuestion()}
                disabled={actionLoading !== null}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-300 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-700 dark:text-red-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                {actionLoading === "delete" ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
