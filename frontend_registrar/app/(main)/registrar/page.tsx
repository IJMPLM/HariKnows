
"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Search, RefreshCw, UserSearch, CheckCircle2, Clock3, Ban } from "lucide-react";
import {
  createRegistrarRequest,
  getRegistrarRequests,
  loadRegistrarState,
  searchStudents,
  updateRegistrarRequestStatus,
  type Department,
  type StudentDirectoryEntry,
  type StudentDocumentRequest,
} from "../../../lib/registrar-client";

const DOCUMENT_TYPES = [
  "Certificate of Enrollment",
  "Certificate of Grades",
  "Certificate of GWA",
  "Certificate of Ranking",
  "Certificate of Graduation Candidacy",
  "Certificate of Graduation",
  "Certificate of NSTP",
  "Transcript of Records (TOR)",
  "Certificate of Course Description",
  "Certificate of Course Syllabus",
  "Certificate of Completion",
  "Certificates of Units Earned",
  "Certificate of Diploma",
  "Transfer Credentials (Honorable Dismissal)",
];

const EMPTY_REQUEST = { studentNo: "", documentType: "", departmentId: 0, notes: "" };

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RegistrarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requests, setRequests] = useState<StudentDocumentRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("requested");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<StudentDirectoryEntry[]>([]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const state = await loadRegistrarState();
      const requestData = await getRegistrarRequests(undefined, undefined, 200);
      setDepartments(state.departments);
      setRequests(requestData);
      if (!requestForm.departmentId && state.departments.length > 0) {
        setRequestForm((current) => ({ ...current, departmentId: state.departments[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      if (!studentSearch.trim()) {
        setStudentResults([]);
        return;
      }

      const results = await searchStudents(studentSearch, 8);
      setStudentResults(results);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [studentSearch]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesSearch = [request.requestCode, request.studentName, request.studentNo, request.documentType].join(" ").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requests, searchQuery, statusFilter]);

  const pendingCount = requests.filter((request) => request.status === "requested").length;
  const preparedCount = requests.filter((request) => request.status === "prepared").length;
  const claimedCount = requests.filter((request) => request.status === "claimed").length;
  const disposedCount = requests.filter((request) => request.status === "disposed").length;

  const createRequest = async () => {
    setCreating(true);
    try {
      await createRegistrarRequest(requestForm);
      setShowCreateModal(false);
      setRequestForm({ ...EMPTY_REQUEST, departmentId: departments[0]?.id ?? 0 });
      setStudentSearch("");
      setStudentResults([]);
      await load();
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (requestId: number, status: string, disposedReason?: string) => {
    const handledBy = window.prompt("Handled by (optional)") ?? undefined;
    await updateRegistrarRequestStatus(requestId, { status, handledBy, disposedReason, notes: "" });
    await load();
  };

  return (
    <div className="relative min-h-screen bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 overflow-hidden">
      <div className="pt-16 lg:pt-0 px-5 lg:px-8 py-6 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#6e3102] dark:text-[#d4855a] flex items-center gap-2"><ClipboardList size={13} /> Registrar request workflow</p>
              <h1 className="text-3xl font-extrabold tracking-tight">Document Requests</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => void load()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18181b]"><RefreshCw size={16} /> Refresh</button>
              <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-semibold"><Plus size={16} /> New Request</button>
            </div>
          </header>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Requested", value: pendingCount, icon: Clock3 },
              { label: "Prepared", value: preparedCount, icon: CheckCircle2 },
              { label: "Claimed", value: claimedCount, icon: CheckCircle2 },
              { label: "Disposed", value: disposedCount, icon: Ban },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-500">
                  <span>{item.label}</span>
                  <item.icon size={15} />
                </div>
                <div className="text-3xl font-extrabold mt-3">{item.value}</div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6">
            <div className="rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search requests..." className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014]" />
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#101014]">
                  <option value="all">All</option>
                  <option value="requested">Requested</option>
                  <option value="prepared">Prepared</option>
                  <option value="claimed">Claimed</option>
                  <option value="disposed">Disposed</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.2em] text-gray-500 border-b border-gray-200 dark:border-white/10">
                      <th className="py-3 pr-4">Request</th>
                      <th className="py-3 pr-4">Student</th>
                      <th className="py-3 pr-4">Document</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Updated</th>
                      <th className="py-3 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading...</td></tr> : filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b border-gray-100 dark:border-white/5 align-top">
                        <td className="py-4 pr-4 font-mono text-sm">{request.requestCode}</td>
                        <td className="py-4 pr-4">
                          <div className="font-semibold">{request.studentName}</div>
                          <div className="text-xs text-gray-500">{request.studentNo}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="font-medium">{request.documentType}</div>
                          <div className="text-xs text-gray-500">Dept {request.departmentId}</div>
                        </td>
                        <td className="py-4 pr-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-white/10">{request.status}</span></td>
                        <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">{formatDate(request.updatedAt)}</td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => void updateStatus(request.id, "prepared")} className="px-3 py-1.5 rounded-xl bg-[#6e3102] text-white text-xs font-semibold">Prepared</button>
                            <button onClick={() => void updateStatus(request.id, "claimed")} className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">Claimed</button>
                            <button onClick={() => { const reason = window.prompt("Disposed reason"); if (reason) void updateStatus(request.id, "disposed", reason); }} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold">Disposed</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">New request</p>
                <h3 className="text-xl font-extrabold">Create student document request</h3>
              </div>
              <button className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#242428]" onClick={() => setShowCreateModal(false)}>Close</button>
            </div>

            <div className="relative">
              <UserSearch size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search student by no/name..." className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014]" />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-2 rounded-2xl border border-gray-200 dark:border-white/10 p-2">
              {studentResults.map((student) => (
                <button key={student.studentNo} onClick={() => setRequestForm((current) => ({ ...current, studentNo: student.studentNo }))} className={`w-full text-left p-3 rounded-2xl border ${requestForm.studentNo === student.studentNo ? "border-[#6e3102] dark:border-[#d4855a] bg-[#6e3102]/5 dark:bg-[#d4855a]/10" : "border-gray-200 dark:border-white/10"}`}>
                  <div className="font-semibold">{student.fullName}</div>
                  <div className="text-xs text-gray-500">{student.studentNo} · {student.collegeCode} / {student.programCode}</div>
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <select value={requestForm.departmentId} onChange={(event) => setRequestForm((current) => ({ ...current, departmentId: Number(event.target.value) }))} className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014]">
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
              <select value={requestForm.documentType} onChange={(event) => setRequestForm((current) => ({ ...current, documentType: event.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014]">
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <textarea value={requestForm.notes} onChange={(event) => setRequestForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" rows={3} className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014]" />

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500 leading-relaxed">Requests are student-linked and must move through requested, prepared, claimed, or disposed. Disposed requires a reason.</p>
              <button disabled={creating || !requestForm.studentNo || !requestForm.documentType} onClick={() => void createRequest()} className="px-5 py-3 rounded-2xl bg-[#6e3102] text-white font-bold disabled:opacity-50 whitespace-nowrap">{creating ? "Creating..." : "Create Request"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}