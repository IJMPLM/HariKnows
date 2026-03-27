"use client";

import { useEffect, useState } from "react";
import { BookOpen, Pencil, Trash2, Plus, X, Filter } from "lucide-react";
import {
  loadRegistrarCatalog,
  createProgram,
  updateProgram,
  deleteProgram,
  type College,
  type Program,
} from "../../../lib/registrar-client";

export default function ProgramsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Filter & UI State
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formGroup, setFormGroup] = useState("Undergraduate");
  const [formCollegeId, setFormCollegeId] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const catalog = await loadRegistrarCatalog();
      setColleges(catalog.colleges);
      // Flatten programs from all colleges for the main list
      const allProgs = catalog.colleges.flatMap((c) => 
        c.programs.map(p => ({ ...p, collegeName: c.name }))
      );
      setPrograms(allProgs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setFormName("");
    setFormCode("");
    setFormGroup("Undergraduate");
    setFormCollegeId(colleges[0]?.id || 0);
    setShowModal(true);
  };

  const openEdit = (program: Program) => {
    setEditTarget(program);
    setFormName(program.name);
    setFormCode(program.code);
    setFormGroup(program.group);
    setFormCollegeId(Number(program.collegeId));
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formCode.trim() || busy) return;
    setBusy(true);
    try {
      const payload = { 
      name: formName.trim(), 
      code: formCode.trim(), 
      group: formGroup, 
      collegeId: Number(formCollegeId) 
    };
      if (editTarget) {
        await updateProgram(editTarget.id, payload);
      } else {
        await createProgram(Number(formCollegeId), payload);
      }
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredPrograms = selectedCollegeId === "all" 
    ? programs 
    : programs.filter(p => p.collegeId === selectedCollegeId);

  const groupColors: Record<string, string> = {
    Undergraduate: "bg-[#6e3102]/20 text-[#d4855a]",
    Graduate: "bg-yellow-900/30 text-yellow-400",
    Doctoral: "bg-purple-900/30 text-purple-400",
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#fafaf9]">Academic Programs</h1>
          <p className="text-sm text-[#fafaf9]/50 mt-1">
            Configure degrees, majors, and specializations across PLM colleges.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#d4855a]" />
            <select 
              value={selectedCollegeId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCollegeId(value === "all" ? "all" : Number(value));
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#18181b] border border-[#6e3102]/40 rounded-lg text-sm text-[#fafaf9] focus:ring-1 focus:ring-[#d4855a] appearance-none"
            >
              <option value="all">All Colleges</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#d4855a] hover:bg-[#6e3102] text-[#fafaf9] px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#6e3102]/10"
          >
            <Plus size={16} />
            Add Program
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-950/50 border border-red-900/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-[#d4855a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#d4855a] animate-pulse text-sm">Loading Catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program) => (
            <article
              key={program.id}
              className="group relative rounded-xl border border-[#6e3102]/30 bg-[#18181b] p-5 hover:border-[#d4855a]/50 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${groupColors[program.group] || "bg-zinc-800 text-zinc-400"}`}>
                  {program.group}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(program)} className="p-1.5 hover:bg-[#6e3102]/20 text-[#d4855a] rounded-md">
                    <Pencil size={14} />
                  </button>
                  <button className="p-1.5 hover:bg-red-900/20 text-red-400 rounded-md">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 p-2 rounded-lg bg-[#6e3102]/10 text-[#d4855a]">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-[#fafaf9] leading-tight mb-1">{program.name}</h3>
                  <code className="text-[11px] text-[#d4855a] font-mono bg-[#6e3102]/10 px-1.5 py-0.5 rounded">
                    {program.code}
                  </code>
                  {selectedCollegeId === "all" && (
                    <p className="text-[10px] text-[#fafaf9]/40 mt-3 flex items-center gap-1 uppercase tracking-tighter">
                      {(program as any).collegeName}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Program Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-[#6e3102]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-xl text-[#fafaf9]">{editTarget ? "Edit Program" : "Create New Program"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#fafaf9]/30 hover:text-[#fafaf9] transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#d4855a] uppercase mb-1 ml-1">Assigned College</label>
                <select 
                  value={formCollegeId}
                  onChange={(e) => setFormCollegeId(Number(e.target.value))}
                  className="w-full bg-[#121212] border border-[#6e3102]/40 rounded-lg px-3 py-2.5 text-sm text-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-[#d4855a]"
                >
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[#d4855a] uppercase mb-1 ml-1">Code</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="BSCS"
                    className="w-full bg-[#121212] border border-[#6e3102]/40 rounded-lg px-3 py-2.5 text-sm text-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-[#d4855a]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#d4855a] uppercase mb-1 ml-1">Academic Group</label>
                  <select 
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    className="w-full bg-[#121212] border border-[#6e3102]/40 rounded-lg px-3 py-2.5 text-sm text-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-[#d4855a]"
                  >
                    <option>Undergraduate</option>
                    <option>Graduate</option>
                    <option>Doctoral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#d4855a] uppercase mb-1 ml-1">Program Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. BS in Computer Science"
                  className="w-full bg-[#121212] border border-[#6e3102]/40 rounded-lg px-3 py-2.5 text-sm text-[#fafaf9] focus:outline-none focus:ring-1 focus:ring-[#d4855a]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#6e3102]/40 text-[#fafaf9]/60 hover:bg-zinc-800 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-[#d4855a] hover:bg-[#6e3102] text-[#fafaf9] disabled:opacity-50 shadow-lg shadow-[#d4855a]/10 transition-all"
              >
                {busy ? "Processing..." : editTarget ? "Update Program" : "Confirm Program"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}