"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Trash2, Plus, X } from "lucide-react";
import {
  loadRegistrarCatalog,
  createCollege,
  updateCollege,
  deleteCollege,
  type College,
} from "../../../lib/registrar-client";

export default function CollegesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<College | null>(null);
  const [formName, setFormName] = useState("");

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const catalog = await loadRegistrarCatalog();
      setColleges(catalog.colleges);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setFormName("");
    setShowModal(true);
  };

  const openEdit = (college: College) => {
    setEditTarget(college);
    setFormName(college.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormName("");
    setEditTarget(null);
  };

  const handleSubmit = async () => {
    const name = formName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      if (editTarget) {
        await updateCollege(editTarget.id, name);
      } else {
        await createCollege(name);
      }
      setError(null);
      closeModal();
      await fetchColleges();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (college: College) => {
    if (!window.confirm(`Delete ${college.name}? This also removes its programs.`)) return;
    setBusy(true);
    try {
      await deleteCollege(college.id);
      setError(null);
      await fetchColleges();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const groupColors: Record<string, string> = {
    Undergraduate: "bg-[#6e3102]/20 text-[#d4855a]",
    Graduate: "bg-yellow-900/30 text-yellow-400",
    Doctoral: "bg-purple-900/30 text-purple-400",
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Colleges</h1>
          <p className="text-sm text-[#fafaf9]/50 mt-1">Manage PLM colleges and their programs.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#d4855a] hover:bg-[#6e3102] text-[#fafaf9] px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Add College
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded bg-red-900 text-red-200 text-sm">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[#d4855a]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {colleges.map((college) => {
            const groups = Array.from(new Set(college.programs.map((p) => p.group)));
            return (
              <article
                key={college.id}
                className="rounded-xl border border-[#6e3102]/40 bg-[#18181b] p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Building2 size={16} className="text-[#d4855a] mt-0.5 shrink-0" />
                    <h2 className="text-sm font-bold leading-snug">{college.name}</h2>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(college)}
                      className="p-1.5 rounded-lg hover:bg-[#6e3102]/20 text-[#d4855a]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(college)}
                      className="p-1.5 rounded-lg hover:bg-red-900/30 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#fafaf9]/50">{college.programs.length} program(s)</p>

                <div className="flex flex-wrap gap-1">
                  {groups.map((g) => (
                    <span
                      key={g}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${groupColors[g] ?? "bg-gray-700 text-gray-300"}`}
                    >
                      {g}
                    </span>
                  ))}
                </div>

                <ul className="space-y-1">
                  {college.programs.slice(0, 5).map((p) => (
                    <li key={p.id} className="text-xs text-[#fafaf9]/60 truncate">
                      {p.code} • {p.name}
                    </li>
                  ))}
                  {college.programs.length > 5 && (
                    <li className="text-xs text-[#fafaf9]/40">+{college.programs.length - 5} more</li>
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#18181b] border border-[#6e3102]/40 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">{editTarget ? "Edit College" : "Add College"}</h2>
              <button onClick={closeModal} className="text-[#fafaf9]/50 hover:text-[#fafaf9]">
                <X size={18} />
              </button>
            </div>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="College name"
              className="w-full bg-[#121212] border border-[#6e3102]/40 rounded-lg px-3 py-2 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6e3102] mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm border border-[#6e3102]/40 text-[#fafaf9]/60 hover:text-[#fafaf9]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#d4855a] hover:bg-[#6e3102] text-[#fafaf9] disabled:opacity-50"
              >
                {editTarget ? "Save Changes" : "Add College"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}