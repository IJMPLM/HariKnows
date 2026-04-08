
"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, FileText, Clock, XCircle, Search, ListFilter, Plus, X, ClipboardList } from "lucide-react";

// Document types for creation
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

// Placeholder for dynamic data fetching in the future
const documents: any[] = [];

export default function RegistrarPage() {
  // Example filter state (future: fetch from API)
  const [currentStatus, setCurrentStatus] = useState("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [documentSearchInput, setDocumentSearchInput] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);

  // Filter document types based on search
  const filteredDocumentTypes = DOCUMENT_TYPES.filter((doc) =>
    doc.toLowerCase().startsWith(documentSearchInput.toLowerCase())
  );

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
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header Section */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-8 pt-8 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#aaaaaa] mb-2">
          <ClipboardList size={12} />
          REGISTRAR · REQUEST TRACKING
        </div>

        {/* Page Header - Split Color Title */}
        <h1 className="text-3xl lg:text-[2rem] font-extrabold tracking-tight leading-tight text-white mb-1">
          Office of the University <span className="text-[#e8834a]">Registrar</span>
        </h1>
        <p className="text-sm text-[#aaaaaa] mb-6">
          Administrative workspace for document management
        </p>
      </div>

      {/* Main Content */}
      <div className="px-8 py-7">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Pending Requests</p>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-4xl font-extrabold text-white">{pendingCount}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Prepared</p>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-4xl font-extrabold text-white">{preparedCount}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Claimed</p>
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-4xl font-extrabold text-white">{claimedCount}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Expired</p>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-4xl font-extrabold text-white">{expiredCount}</p>
          </div>
        </div>

        {/* Status Pills + Search + Sort */}
        <div className="mb-8 space-y-4">
          {/* Status Pills Row */}
          <div className="flex items-center gap-2">
            {[
              { label: 'Pending', key: 'Pending', count: pendingCount },
              { label: 'Prepared', key: 'Prepared', count: preparedCount },
              { label: 'Claimed', key: 'Claimed', count: claimedCount },
              { label: 'Expired', key: 'Expired', count: expiredCount },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentStatus(item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 focus:outline-none ${
                  currentStatus === item.key
                    ? 'bg-[#e8834a] text-[#121212] border border-[#e8834a]'
                    : 'bg-[#1a1a1a] text-white border border-[#2a2a2a] hover:border-[#3a3a3a]'
                }`}
              >
                {item.label}
                <span className={`text-[10px] px-1.5 min-w-[18px] text-center rounded-full font-medium ${
                  currentStatus === item.key
                    ? 'bg-[#d97639]/30 text-[#121212]'
                    : 'bg-[#2a2a2a] text-[#aaaaaa]'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar + Sort Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
              <input
                type="search"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white placeholder-[#666666] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e8834a]/30 focus:border-[#e8834a] transition-all hover:border-[#3a3a3a]"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#e8834a] hover:bg-[#d97639] text-[#121212] rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#e8834a]/20"
            >
              <Plus className="w-4 h-4" />
              Create Request
            </button>
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#e8834a] hover:bg-[#d97639] text-[#121212] font-semibold transition-all shadow-md shadow-[#e8834a]/20"
                title="Sort options"
              >
                <ListFilter className="w-4 h-4" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-lg z-50 overflow-hidden">
                  <p className="px-4 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#aaaaaa]">Sort By</p>
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
        </div>

        {/* Documents Table */}
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#222222]/50">
                <th className="text-left p-4 text-white font-bold text-sm">Reference Code</th>
                <th className="text-left p-4 text-white font-bold text-sm">Student No.</th>
                <th className="text-left p-4 text-white font-bold text-sm">Document Type</th>
                <th className="text-left p-4 text-white font-bold text-sm">Status</th>
                <th className="text-left p-4 text-white font-bold text-sm">Date Requested</th>
                <th className="text-left p-4 text-white font-bold text-sm">Date Prepared</th>
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

      {/* Create Document Request Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-white">Create Document Request</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setDocumentSearchInput("");
                  setSelectedDocumentType(null);
                }}
                className="p-1 hover:bg-[#2a2a2a] rounded-lg transition-colors text-[#aaaaaa]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[#aaaaaa] mb-2">
                  Select Document Type
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaaaaa]" />
                  <input
                    type="text"
                    placeholder="Type to filter..."
                    value={documentSearchInput}
                    onChange={(e) => setDocumentSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#666666] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e8834a]/30 focus:border-[#e8834a] transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Document Type List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredDocumentTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#aaaaaa] text-sm">No documents match your search</p>
                  </div>
                ) : (
                  filteredDocumentTypes.map((docType) => (
                    <button
                      key={docType}
                      onClick={() => setSelectedDocumentType(docType)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-all text-sm font-medium border ${
                        selectedDocumentType === docType
                          ? "bg-[#e8834a] text-[#121212] border-[#e8834a]"
                          : "bg-[#2a2a2a] text-white border-[#2a2a2a] hover:bg-[#e8834a] hover:text-[#121212] hover:border-[#e8834a]"
                      }`}
                    >
                      {docType}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a2a]">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setDocumentSearchInput("");
                  setSelectedDocumentType(null);
                }}
                className="px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedDocumentType) {
                    console.log("Creating request for:", selectedDocumentType);
                    setShowCreateModal(false);
                    setDocumentSearchInput("");
                    setSelectedDocumentType(null);
                  }
                }}
                disabled={!selectedDocumentType}
                className="px-4 py-2.5 bg-[#e8834a] hover:bg-[#d97639] disabled:bg-[#6a6a6a] disabled:cursor-not-allowed text-[#121212] disabled:text-[#999999] rounded-xl transition-all text-sm font-medium shadow-md shadow-[#e8834a]/20 disabled:shadow-none"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}