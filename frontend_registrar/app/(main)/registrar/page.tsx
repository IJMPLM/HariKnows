
"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, FileText, Clock, XCircle, Search, ListFilter } from "lucide-react";

// Placeholder for dynamic data fetching in the future
const documents: any[] = [];

export default function RegistrarPage() {
  // Example filter state (future: fetch from API)
  const [currentStatus, setCurrentStatus] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-xs font-semibold text-[#aaaaaa] tracking-wide uppercase">
        REGISTRAR OFFICE · REQUEST TRACKING
      </div>

      {/* Page Header - Split Color Title */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-2">
          <h1 className="text-4xl font-bold text-white">Office of the University</h1>
          <h1 className="text-4xl font-bold text-[#e8834a]">Registrar</h1>
        </div>
        <p className="text-sm text-[#aaaaaa]">
          Administrative workspace for document management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Pending Requests</p>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Prepared</p>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">{preparedCount}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Claimed</p>
            <FileText className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">{claimedCount}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Expired</p>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">{expiredCount}</p>
        </div>
      </div>

      {/* Search Bar + Sort Button */}
      <div className="mb-6 flex items-center gap-3 justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#666666] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#e8834a] focus:border-[#e8834a] transition-colors"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-[#e8834a] hover:bg-[#d97639] text-[#121212] transition-colors"
            title="Sort options"
          >
            <ListFilter className="w-4 h-4" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[10px] shadow-lg z-50 overflow-hidden">
              <p className="px-4 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-[#aaaaaa]">Sort By</p>
              <button
                onClick={() => { setSortOrder("asc"); setSortOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortOrder === "asc"
                    ? "bg-[#e8834a] text-[#121212] font-semibold"
                    : "text-white hover:bg-[#2a2a2a]"
                }`}
              >
                Date Requested (Oldest)
              </button>
              <button
                onClick={() => { setSortOrder("desc"); setSortOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortOrder === "desc"
                    ? "bg-[#e8834a] text-[#121212] font-semibold"
                    : "text-white hover:bg-[#2a2a2a]"
                }`}
              >
                Date Requested (Newest)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['Pending', 'Prepared', 'Claimed', 'Expired'].map((status) => (
          <button
            key={status}
            onClick={() => setCurrentStatus(status)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors border ${
              currentStatus === status
                ? 'bg-[#e8834a] text-[#121212] border-[#e8834a]'
                : 'bg-[#1a1a1a] text-white border-[#2a2a2a] hover:border-[#3a3a3a]'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-[#1a1a1a] rounded-[10px] overflow-hidden border border-[#2a2a2a]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left p-4 text-white font-bold">Reference Code</th>
              <th className="text-left p-4 text-white font-bold">Student No.</th>
              <th className="text-left p-4 text-white font-bold">Document Type</th>
              <th className="text-left p-4 text-white font-bold">Status</th>
              <th className="text-left p-4 text-white font-bold">Date Requested</th>
              <th className="text-left p-4 text-white font-bold">Date Prepared</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-[#aaaaaa] py-8">
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