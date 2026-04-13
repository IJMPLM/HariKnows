"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";
import {
  getUncertainQuestions,
  resolveUncertainQuestion,
  type UncertainQuestion,
} from "../../../lib/registrar-client";

type ResolveForm = {
  category: "faq" | "context";
  scopeType: string;
  programCode: string;
  title: string;
  answer: string;
  isGuestVisible: boolean;
};

const defaultForm: ResolveForm = {
  category: "faq",
  scopeType: "general",
  programCode: "",
  title: "",
  answer: "",
  isGuestVisible: true,
};

function normalizeScope(scopeType: string) {
  const normalized = scopeType.trim().toLowerCase();
  if (normalized === "global") return "general";
  if (normalized === "non_guest" || normalized === "nonguest") return "non-guest";
  return normalized || "general";
}

function deriveCollegeCodeFromScope(scopeType: string) {
  const normalized = normalizeScope(scopeType);
  if (normalized === "general" || normalized === "non-guest") {
    return "";
  }

  return normalized.toUpperCase();
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  });
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<UncertainQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UncertainQuestion | null>(null);
  const [form, setForm] = useState<ResolveForm>(defaultForm);
  const [statusFilter, setStatusFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
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
    setForm({
      category: defaultCategory,
      scopeType: selectedQuestion.studentNo ? "non-guest" : "general",
      programCode: selectedQuestion.programCode,
      title: selectedQuestion.questionText,
      answer: "",
      isGuestVisible: !selectedQuestion.studentNo,
    });
  }, [selectedQuestion]);

  useEffect(() => {
    if (!selectedQuestion || form.category !== "faq") {
      return;
    }

    const fallbackQuestion = selectedQuestion.questionText.trim();
    if (!form.title.trim() && fallbackQuestion) {
      setForm((current) => ({ ...current, title: fallbackQuestion }));
    }
  }, [form.category, form.title, selectedQuestion]);

  const visibleQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((entry) => {
      if (!query) {
        return true;
      }

      return [entry.questionText, entry.studentNo, entry.collegeCode, entry.programCode]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [questions, search]);

  const submitResolution = async () => {
    if (!selectedQuestion || !form.title.trim() || !form.answer.trim()) {
      return;
    }

    setSaving(true);
    try {
      await resolveUncertainQuestion(selectedQuestion.id, {
        category: form.category,
        scopeType: normalizeScope(form.scopeType),
        collegeCode: deriveCollegeCodeFromScope(form.scopeType),
        programCode: form.programCode,
        title: form.title.trim(),
        answer: form.answer.trim(),
        isGuestVisible: form.isGuestVisible,
      });

      await loadQuestions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resolve question.";
      alert(message);
    } finally {
      setSaving(false);
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
              <button onClick={() => void loadQuestions()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </section>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative max-w-sm w-full">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search captured questions..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
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
                            {entry.studentNo || "guest"} · {entry.collegeCode || "-"}/{entry.programCode || "-"} · {formatDate(entry.createdAt)}
                          </p>
                        </button>
                      );
                    })
                  : null}
              </div>
            </section>

            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-3 h-fit">
              <div className="flex items-center gap-2 text-[#6e3102] dark:text-[#d4855a] font-bold uppercase tracking-[0.2em] text-xs">
                <CheckCircle2 size={14} /> Resolve as New Entry
              </div>
              {!selectedQuestion ? <p className="text-sm text-gray-500">Select a question to answer.</p> : null}

              {selectedQuestion ? (
                <>
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 bg-gray-50/80 dark:bg-[#101014]">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Question</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedQuestion.questionText}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={form.category}
                      onChange={(event) => {
                        const nextCategory = event.target.value as "faq" | "context";
                        setForm((current) => ({
                          ...current,
                          category: nextCategory,
                          title: nextCategory === "faq" && !current.title.trim() && selectedQuestion
                            ? selectedQuestion.questionText
                            : current.title,
                        }));
                      }}
                      className="px-3 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                    >
                      <option value="faq">FAQ</option>
                      <option value="context">Context</option>
                    </select>
                    <input
                      value={form.scopeType}
                      onChange={(event) => setForm((current) => ({ ...current, scopeType: event.target.value }))}
                      placeholder="scopeType"
                      className="px-3 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={form.programCode}
                      onChange={(event) => setForm((current) => ({ ...current, programCode: event.target.value }))}
                      placeholder="programCode (optional)"
                      className="px-3 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                    />
                    <div className="px-3 py-3 rounded-xl bg-gray-100/60 dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-xs text-gray-500 flex items-center">
                      college from scopeType: {deriveCollegeCodeFromScope(form.scopeType) || "none"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                      {form.category === "faq" ? "Question" : "Context title"}
                    </p>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder={form.category === "faq" ? "FAQ question" : "Entry title"}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                    />
                    {form.category === "faq" && selectedQuestion ? (
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, title: selectedQuestion.questionText }))}
                        className="text-xs text-[#6e3102] dark:text-[#d4855a] underline"
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
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y"
                  />

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isGuestVisible}
                      onChange={(event) => setForm((current) => ({
                        ...current,
                        isGuestVisible: event.target.checked,
                        scopeType: event.target.checked ? "general" : "non-guest",
                      }))}
                    />
                    Visible to guest users
                  </label>

                  <button
                    onClick={() => void submitResolution()}
                    disabled={saving || selectedQuestion.status !== "open"}
                    className="px-4 py-2 rounded-xl bg-[#6e3102] text-white font-semibold disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Resolve Question"}
                  </button>
                </>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
