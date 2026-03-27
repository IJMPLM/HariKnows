"use client";

import type { DragEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, Loader2, Plus, Send, Pencil, Trash2, BookOpen } from "lucide-react";
import DesktopSidebar from "./components/DesktopSidebar";
import MobileSidebar from "./components/MobileSidebar";
import {
  createCollege,
  createDepartment,
  createDocument,
  createProgram,
  deleteCollege,
  deleteProgram,
  loadRegistrarCatalog,
  loadRegistrarState,
  moveDocument,
  updateCollege,
  updateProgram,
  type ActivityEntry,
  type College,
  type Department,
  type Program,
  type RegistrarDocument,
} from "../lib/registrar-client";

export default function RegistrarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [documents, setDocuments] = useState<RegistrarDocument[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newDocumentTitle, setNewDocumentTitle] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramCode, setNewProgramCode] = useState("");
  const [newProgramGroup, setNewProgramGroup] = useState("Undergraduate");
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hoveredDepartmentId, setHoveredDepartmentId] = useState<number | null>(null);

  const loadState = async () => {
    const state = await loadRegistrarState();
    const catalog = await loadRegistrarCatalog();
    setDepartments(state.departments);
    setDocuments(state.documents);
    setActivity(state.activity);
    setColleges(catalog.colleges);
    setSelectedCollegeId((previous) => {
      if (previous && catalog.colleges.some((college) => college.id === previous)) {
        return previous;
      }

      return catalog.colleges[0]?.id ?? null;
    });
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadState();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load registrar data.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const documentCountByDepartment = useMemo(() => {
    const map = new Map<number, number>();
    for (const department of departments) {
      map.set(department.id, 0);
    }

    for (const document of documents) {
      map.set(document.departmentId, (map.get(document.departmentId) ?? 0) + 1);
    }

    return map;
  }, [departments, documents]);

  const addDepartment = async () => {
    const trimmed = newDepartmentName.trim();
    if (!trimmed || busy) {
      return;
    }

    setBusy(true);

    try {
      await createDepartment(trimmed);

      setNewDepartmentName("");
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add department.");
    } finally {
      setBusy(false);
    }
  };

  const addDocument = async () => {
    const studentName = newStudentName.trim();
    const title = newDocumentTitle.trim();

    if (!studentName || !title || departments.length === 0 || busy) {
      return;
    }

    setBusy(true);

    try {
      await createDocument(studentName, title, departments[0].id);

      setNewStudentName("");
      setNewDocumentTitle("");
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create document.");
    } finally {
      setBusy(false);
    }
  };

  const onDropDocument = async (event: DragEvent<HTMLDivElement>, departmentId: number) => {
    event.preventDefault();
    setHoveredDepartmentId(null);

    const rawId = event.dataTransfer.getData("text/plain");
    const documentId = Number.parseInt(rawId, 10);
    if (Number.isNaN(documentId) || busy) {
      return;
    }

    setBusy(true);

    try {
      await moveDocument(documentId, departmentId);

      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to move document.");
    } finally {
      setBusy(false);
    }
  };

  const addCollege = async () => {
    const trimmed = newCollegeName.trim();
    if (!trimmed || busy) {
      return;
    }

    setBusy(true);
    try {
      await createCollege(trimmed);
      setNewCollegeName("");
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create college.");
    } finally {
      setBusy(false);
    }
  };

  const editCollege = async (college: College) => {
    const nextName = window.prompt("Update college name", college.name)?.trim();
    if (!nextName || nextName === college.name) {
      return;
    }

    setBusy(true);
    try {
      await updateCollege(college.id, nextName);
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update college.");
    } finally {
      setBusy(false);
    }
  };

  const removeCollege = async (college: College) => {
    if (!window.confirm(`Delete ${college.name}? This also removes its programs.`)) {
      return;
    }

    setBusy(true);
    try {
      await deleteCollege(college.id);
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete college.");
    } finally {
      setBusy(false);
    }
  };

  const addProgram = async () => {
    const collegeId = selectedCollegeId;
    const name = newProgramName.trim();
    const code = newProgramCode.trim();
    const group = newProgramGroup.trim();

    if (!collegeId || !name || !code || !group || busy) {
      return;
    }

    setBusy(true);
    try {
      await createProgram(collegeId, { name, code, group });
      setNewProgramName("");
      setNewProgramCode("");
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create program.");
    } finally {
      setBusy(false);
    }
  };

  const editProgram = async (program: Program, currentCollegeId: number) => {
    const nextName = window.prompt("Update program name", program.name)?.trim();
    if (!nextName) {
      return;
    }

    const nextCode = window.prompt("Update program code", program.code)?.trim();
    if (!nextCode) {
      return;
    }

    const nextGroup = window.prompt("Update program group", program.group)?.trim();
    if (!nextGroup) {
      return;
    }

    setBusy(true);
    try {
      await updateProgram(program.id, {
        name: nextName,
        code: nextCode,
        group: nextGroup,
        collegeId: currentCollegeId,
      });
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update program.");
    } finally {
      setBusy(false);
    }
  };

  const removeProgram = async (program: Program) => {
    if (!window.confirm(`Delete program ${program.code}?`)) {
      return;
    }

    setBusy(true);
    try {
      await deleteProgram(program.id);
      setError(null);
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete program.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen text-[color:var(--text)]">
      <DesktopSidebar />
      <MobileSidebar />

      <div className="lg:ml-64 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6 pb-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-4 py-3 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid grid-cols-1 2xl:grid-cols-12 gap-4 lg:gap-6">
          <aside className="2xl:col-span-3 space-y-4">
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <h2 className="text-lg font-bold">Command Center</h2>
              <p className="text-sm text-[color:var(--muted)] mt-1">Create units and records for queue simulation.</p>
              <div className="mt-4 space-y-2">
                <input
                  value={newDepartmentName}
                  onChange={(event) => setNewDepartmentName(event.target.value)}
                  placeholder="Add department name"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addDepartment}
                  disabled={busy}
                  className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-strong)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add New Department
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <h2 className="text-lg font-bold">Create Document</h2>
              <div className="mt-4 space-y-2">
                <input
                  value={newStudentName}
                  onChange={(event) => setNewStudentName(event.target.value)}
                  placeholder="Student name"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                />
                <input
                  value={newDocumentTitle}
                  onChange={(event) => setNewDocumentTitle(event.target.value)}
                  placeholder="Document task"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addDocument}
                  disabled={busy || departments.length === 0}
                  className="w-full rounded-xl px-3 py-2 text-sm font-semibold border border-[color:var(--line)] bg-[color:var(--card)] hover:bg-[color:var(--bg-soft)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  Add to first department
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[color:var(--brand)]" />
                <h2 className="text-lg font-bold">College Admin</h2>
              </div>
              <div className="mt-3 space-y-2">
                <input
                  value={newCollegeName}
                  onChange={(event) => setNewCollegeName(event.target.value)}
                  placeholder="New college name"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addCollege}
                  disabled={busy}
                  className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-strong)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add College
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[color:var(--brand)]" />
                <h2 className="text-lg font-bold">Program Admin</h2>
              </div>
              <div className="mt-3 space-y-2">
                <select
                  value={selectedCollegeId ?? ""}
                  onChange={(event) => setSelectedCollegeId(Number(event.target.value))}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                >
                  {colleges.map((college) => (
                    <option key={college.id} value={college.id}>
                      {college.name}
                    </option>
                  ))}
                </select>
                <input
                  value={newProgramName}
                  onChange={(event) => setNewProgramName(event.target.value)}
                  placeholder="Program name"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                />
                <input
                  value={newProgramCode}
                  onChange={(event) => setNewProgramCode(event.target.value)}
                  placeholder="Program code"
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                />
                <select
                  value={newProgramGroup}
                  onChange={(event) => setNewProgramGroup(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-3 py-2 text-sm"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                </select>
                <button
                  type="button"
                  onClick={addProgram}
                  disabled={busy || !selectedCollegeId}
                  className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-white bg-[color:var(--brand)] hover:bg-[color:var(--brand-strong)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Program
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[color:var(--brand)]" />
                <h2 className="text-lg font-bold">Catalog Snapshot</h2>
              </div>
              <p className="text-sm text-[color:var(--muted)] mt-1">Configured colleges and programs from backend defaults.</p>
              <div className="mt-3 max-h-64 overflow-auto space-y-3 pr-1">
                {colleges.map((college) => (
                  <article key={college.id} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] p-3">
                    <h3 className="text-sm font-semibold">{college.name}</h3>
                    <p className="text-xs text-[color:var(--muted)] mt-1">{college.programs.length} program(s)</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(new Set(college.programs.map((program) => program.group))).map((group) => (
                        <span key={`${college.id}-${group}`} className="rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--brand)]">
                          {group}
                        </span>
                      ))}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {college.programs.slice(0, 3).map((program) => (
                        <li key={program.id} className="text-xs text-[color:var(--muted)]">
                          {program.code} • {program.name}
                        </li>
                      ))}
                    </ul>
                    {college.programs.length > 3 && (
                      <p className="mt-1 text-[11px] text-[color:var(--muted)]">+{college.programs.length - 3} more</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </aside>

          <section className="2xl:col-span-6 rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 sm:p-5 shadow-sm">
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Department Workflow</h2>
                <p className="text-sm text-[color:var(--muted)] mt-1">Move document cards between departments to reflect queue processing.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-[color:var(--brand)] font-semibold">Filter: Active</span>
                <span className="rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-[color:var(--brand)] font-semibold">Sort: Priority</span>
              </div>
            </header>

            {loading ? (
              <div className="min-h-[320px] flex items-center justify-center">
                <Loader2 size={26} className="animate-spin text-[color:var(--brand)]" />
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {departments.map((department) => {
                  const departmentDocuments = documents.filter((doc) => doc.departmentId === department.id);
                  const isHovered = hoveredDepartmentId === department.id;

                  return (
                    <article key={department.id} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm">{department.name}</h3>
                        <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-1 text-[11px] font-bold text-[color:var(--brand)]">
                          {documentCountByDepartment.get(department.id) ?? 0} docs
                        </span>
                      </div>

                      <div
                        className={`mt-3 rounded-xl border-2 border-dashed min-h-[200px] p-2 space-y-2 transition-colors ${
                          isHovered
                            ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)]/50"
                            : "border-[color:var(--line)]"
                        }`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setHoveredDepartmentId(department.id);
                        }}
                        onDragLeave={() => setHoveredDepartmentId(null)}
                        onDrop={(event) => onDropDocument(event, department.id)}
                      >
                        {departmentDocuments.map((document) => (
                          <div
                            key={document.id}
                            className="rounded-lg bg-[color:var(--success)] text-white p-2 cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(document.id))}
                          >
                            <strong className="text-xs">{document.referenceCode}</strong>
                            <h4 className="text-sm mt-1 font-semibold">{document.studentName}</h4>
                            <p className="text-[11px] mt-1 uppercase tracking-wide opacity-90">{document.title}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="2xl:col-span-3 space-y-4">
            <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[color:var(--brand)]" />
                <h2 className="text-lg font-bold">Catalog</h2>
              </div>
              <p className="text-sm text-[color:var(--muted)] mt-1">Manage colleges and programs from the dashboard.</p>
              <div className="mt-3 max-h-[360px] overflow-auto space-y-3 pr-1">
                {colleges.map((college) => (
                  <article key={college.id} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold">{college.name}</h3>
                        <p className="text-xs text-[color:var(--muted)] mt-1">{college.programs.length} program(s)</p>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => editCollege(college)} className="p-1.5 rounded-lg hover:bg-[color:var(--brand-soft)] text-[color:var(--brand)]" aria-label="Edit college">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => removeCollege(college)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600" aria-label="Delete college">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(new Set(college.programs.map((program) => program.group))).map((group) => (
                        <span key={`${college.id}-${group}`} className="rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--brand)]">
                          {group}
                        </span>
                      ))}
                    </div>

                    <ul className="mt-2 space-y-1">
                      {college.programs.slice(0, 5).map((program) => (
                        <li key={program.id} className="flex items-center justify-between gap-2 text-xs text-[color:var(--muted)]">
                          <span className="truncate">{program.code} • {program.name}</span>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => editProgram(program, college.id)} className="p-1 rounded hover:bg-[color:var(--brand-soft)] text-[color:var(--brand)]" aria-label="Edit program">
                              <Pencil size={12} />
                            </button>
                            <button type="button" onClick={() => removeProgram(program)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600" aria-label="Delete program">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {college.programs.length > 5 && (
                      <p className="mt-1 text-[11px] text-[color:var(--muted)]">+{college.programs.length - 5} more</p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-sm">
              <h2 className="text-lg font-bold">Activity Log</h2>
              <div className="mt-4 space-y-3 max-h-[280px] overflow-auto pr-1">
                {activity.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] p-3">
                    <h3 className="text-sm font-semibold leading-tight">{entry.action}</h3>
                    <p className="text-xs text-[color:var(--muted)] mt-1">
                      {entry.actor} • {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
