
"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, FileText, Clock, XCircle } from "lucide-react";

// Placeholder for dynamic data fetching in the future
const documents: any[] = [];

export default function RegistrarPage() {
  // Example filter state (future: fetch from API)
  const [currentStatus, setCurrentStatus] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered documents (future: dynamic)
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      (doc.documentType?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (doc.referenceCode?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (doc.studentName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (doc.studentId?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = doc.status === currentStatus;
    return matchesSearch && matchesStatus;
  });

  // Statistics (future: dynamic)
  const pendingCount = documents.filter(d => d.status === "Pending").length;
  const preparedCount = documents.filter(d => d.status === "Prepared").length;
  const claimedCount = documents.filter(d => d.status === "Claimed").length;
  const expiredCount = documents.filter(d => d.status === "Expired").length;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Office of the University Registrar</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Administrative workspace for document management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Pending Requests</p>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl">{pendingCount}</p>
        </div>
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Prepared</p>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl">{preparedCount}</p>
        </div>
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Claimed</p>
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl">{claimedCount}</p>
        </div>
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Expired</p>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl">{expiredCount}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by document type, reference code, student name, or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[color:var(--panel)] border border-[color:var(--line)] text-[color:var(--text)] rounded px-3 py-2 w-full"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <FileText className="w-4 h-4 text-[color:var(--muted)]" />
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['Pending', 'Prepared', 'Claimed', 'Expired'].map((status) => (
          <button
            key={status}
            onClick={() => setCurrentStatus(status)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
              ${currentStatus === status
                ? 'bg-[color:var(--brand)] text-white border-[color:var(--brand)]'
                : 'bg-[color:var(--panel)] text-[color:var(--muted)] border-[color:var(--line)] hover:bg-[color:var(--bg-soft)]'}
            `}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-[color:var(--panel)] rounded-2xl overflow-hidden border border-[color:var(--line)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[color:var(--line)]">
              <th className="text-left p-3 text-[color:var(--muted)]">Reference Code</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Student No.</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Document Type</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Status</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Date Requested</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Date Prepared</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-[color:var(--muted)] py-8">
                  No documents found
                </td>
              </tr>
            ) : null}
            {/* Map dynamic data here */}
          </tbody>
        </table>
      </div>
    </div>
  );
}