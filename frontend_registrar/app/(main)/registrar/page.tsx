"use client";

import { useEffect, useState } from "react";
import { loadRegistrarState, type RegistrarDocument } from "../../../lib/registrar-client";

const statusColors: Record<string, string> = {
  Pending: "bg-[#6e3102] text-[#fafaf9]",
  "In Progress": "bg-yellow-600 text-[#fafaf9]",
  Completed: "bg-green-700 text-[#fafaf9]",
  Rejected: "bg-red-700 text-[#fafaf9]",
};

export default function RegistrarQueuePage() {
  const [documents, setDocuments] = useState<RegistrarDocument[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const state = await loadRegistrarState();
      setDocuments(state.documents ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredData = documents.filter((doc) => {
    const matchesSearch =
      doc.referenceCode?.toLowerCase().includes(search.toLowerCase()) ||
      doc.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All";
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Document Request Queue</h1>

      {error && (
        <div className="mb-4 px-4 py-3 rounded bg-red-900 text-red-200 text-sm">
          Error: {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by ID, name, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#18181b] border border-[#6e3102] rounded px-4 py-2 text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6e3102] w-full md:w-1/3"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#18181b] border border-[#6e3102] rounded px-4 py-2 text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#6e3102] w-full md:w-48"
        >
          <option value="All">All</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg bg-[#18181b]">
        {loading ? (
          <div className="text-center py-12 text-[#d4855a]">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-[#6e3102]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Reference Code</th>
                <th className="px-4 py-3 text-left font-semibold">Student Name</th>
                <th className="px-4 py-3 text-left font-semibold">Document Title</th>
                <th className="px-4 py-3 text-left font-semibold">Date Requested</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#fafaf9]/50">
                    No requests found.
                  </td>
                </tr>
              ) : (
                filteredData.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#280d02] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">{doc.referenceCode}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{doc.studentName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{doc.title}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                      <button className="bg-[#d4855a] hover:bg-[#6e3102] text-[#fafaf9] px-3 py-1 rounded transition-colors text-xs font-semibold">
                        View
                      </button>
                      <button className="bg-red-800 hover:bg-red-900 text-[#fafaf9] px-3 py-1 rounded transition-colors text-xs font-semibold">
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}