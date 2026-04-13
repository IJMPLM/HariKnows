"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search, Pencil, Trash2 } from "lucide-react";
import { createFaqEntry, deleteFaqEntry, getFaqEntries, updateFaqEntry, type FaqContextEntry } from "../../../lib/registrar-client";

type Section = "faq" | "context";

type FaqFormState = {
  scopeType: string;
  category: string;
  title: string;
  answer: string;
  isGuestVisible: boolean;
};

const FAQ_TAG_OPTIONS = ["faq-general", "faq-non-guest"];

const CONTEXT_TAG_OPTIONS = [
  "assistant-identity",
  "guidance-header",
  "context-unavailable",
  "guest-mode-tag",
  "auth-status-guest",
  "auth-status-signed-in",
  "redirect-reply-guest",
  "redirect-reply-signed-in",
  "redirect-note-guest",
  "redirect-note-signed-in",
  "response-guardrail",
  "context-general",
  "context-non-guest",
  "other",
];

const CATEGORY_BY_TAG: Record<string, string> = {
  "assistant-identity": "assistant",
  "guidance-header": "assistant",
  "context-unavailable": "assistant",
  "guest-mode-tag": "assistant",
  "auth-status-guest": "assistant",
  "auth-status-signed-in": "assistant",
  "redirect-reply-guest": "assistant",
  "redirect-reply-signed-in": "assistant",
  "redirect-note-guest": "assistant",
  "redirect-note-signed-in": "assistant",
  "response-guardrail": "guardrail",
  "context-general": "context",
  "context-non-guest": "context",
  "other": "context",
  "faq-general": "faq",
  "faq-non-guest": "faq",
};

const createEmptyForm = (section: Section): FaqFormState => ({
  scopeType: section === "faq" ? "faq-general" : "context-general",
  category: section === "faq" ? "faq" : "context",
  title: "",
  answer: "",
  isGuestVisible: true,
});

const isFaqEntry = (entry: FaqContextEntry) => entry.category.trim().toLowerCase() === "faq";

function normalizeScope(scopeType: string) {
  return scopeType.trim().toLowerCase();
}

export default function FaqContextPage() {
  const [entries, setEntries] = useState<FaqContextEntry[]>([]);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<Section>("faq");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FaqContextEntry | null>(null);
  const [form, setForm] = useState<FaqFormState>(createEmptyForm("faq"));

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
    if (!editing) {
      setForm(createEmptyForm(activeSection));
    }
  }, [activeSection, editing]);

  const visibleEntries = useMemo(() => entries.filter((entry) => (activeSection === "faq" ? isFaqEntry(entry) : !isFaqEntry(entry))), [entries, activeSection]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleEntries.filter((entry) => {
      if (!query) {
        return true;
      }

      return [entry.title, entry.answer, entry.category, entry.scopeType, entry.collegeCode, entry.programCode]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [visibleEntries, search]);

  const startEdit = (entry: FaqContextEntry) => {
    setEditing(entry);
    setActiveSection(isFaqEntry(entry) ? "faq" : "context");
    setForm({
      scopeType: normalizeScope(entry.scopeType),
      category: entry.category,
      title: entry.title,
      answer: entry.answer,
      isGuestVisible: entry.isGuestVisible,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(createEmptyForm(activeSection));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.answer.trim()) {
      return;
    }

    const payload = {
      scopeType: normalizeScope(form.scopeType),
      collegeCode: "",
      programCode: "",
      category: activeSection === "faq"
        ? "faq"
        : (form.scopeType === "other" ? (form.category.trim() || "context") : (CATEGORY_BY_TAG[form.scopeType] ?? "context")),
      title: form.title.trim(),
      answer: form.answer.trim(),
      isGuestVisible: form.isGuestVisible,
    };

    if (editing) {
      await updateFaqEntry(editing.id, payload);
    } else {
      await createFaqEntry(payload);
    }

    setEditing(null);
    setForm(createEmptyForm(activeSection));
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
    ? "FAQ entries use explicit faq-general/faq-non-guest tags."
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
              <button onClick={() => void load()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
          </section>

          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-2 inline-flex gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("faq")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeSection === "faq" ? "bg-[#6e3102] text-white" : "text-gray-600 dark:text-gray-300"}`}
            >
              FAQ CRUD
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("context")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeSection === "context" ? "bg-[#6e3102] text-white" : "text-gray-600 dark:text-gray-300"}`}
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => (
                    <article key={entry.id} className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50/60 dark:bg-white/[0.03]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400">
                            <span>{entry.category}</span>
                            <span>·</span>
                            <span className="rounded-full bg-[#f2e8e1] dark:bg-[#39261a] px-2 py-1 text-[#6e3102] dark:text-[#d4855a] font-bold">{entry.scopeType}</span>
                            {entry.isGuestVisible ? <span className="text-emerald-600 dark:text-emerald-400">Guest visible</span> : <span>Signed-in users</span>}
                          </div>
                          <h2 className="font-bold mt-1">{entry.title}</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{entry.answer}</p>
                          {entry.scopeType === "other" ? <p className="text-xs text-gray-400">Custom category: {entry.category}</p> : null}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => startEdit(entry)} className="p-2 rounded-xl bg-white dark:bg-[#101014] border border-gray-200 dark:border-white/10">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => void remove(entry.id)} className="p-2 rounded-xl bg-white dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center text-sm text-gray-500">
                    No entries match the current search.
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-3xl p-5 space-y-3 h-fit">
              <div className="flex items-center gap-2 text-[#6e3102] dark:text-[#d4855a] font-bold uppercase tracking-[0.2em] text-xs">
                <Plus size={14} /> {editing ? "Edit entry" : "New entry"}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{sectionDescription}</p>

              <select
                value={form.scopeType}
                onChange={(event) => {
                  const nextScope = event.target.value;
                  setForm({
                    ...form,
                    scopeType: nextScope,
                    category: activeSection === "faq" ? "faq" : (nextScope === "other" ? form.category : (CATEGORY_BY_TAG[nextScope] ?? "context")),
                    isGuestVisible: nextScope.endsWith("non-guest") ? false : form.isGuestVisible,
                  });
                }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
              >
                {(activeSection === "faq" ? FAQ_TAG_OPTIONS : CONTEXT_TAG_OPTIONS).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              {activeSection === "context" && form.scopeType === "other" ? (
                <input
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  placeholder="custom category label"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
                />
              ) : (
                <input value={activeSection === "faq" ? "faq" : (CATEGORY_BY_TAG[form.scopeType] ?? "context")} disabled className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#101014] border border-gray-200 dark:border-white/10 text-gray-500" />
              )}

              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder={activeSection === "faq" ? "title" : "context title"}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10"
              />
              <textarea
                value={form.answer}
                onChange={(event) => setForm({ ...form, answer: event.target.value })}
                placeholder={activeSection === "faq" ? "answer" : "context paragraphs"}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#101014] border border-gray-200 dark:border-white/10 resize-y min-h-[140px]"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isGuestVisible} onChange={(event) => setForm({ ...form, isGuestVisible: event.target.checked })} />
                Visible to guest users
              </label>

              <div className="flex gap-3 pt-2">
                <button onClick={() => void submit()} className="px-4 py-2 rounded-xl bg-[#6e3102] text-white font-semibold">
                  {editing ? "Save" : "Create"}
                </button>
                <button onClick={resetForm} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10">Reset</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
