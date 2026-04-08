"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Filter, FileText, Search, ListFilter } from "lucide-react";

const uploadData: any[] = [];

export default function DashboardPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const filteredData =
    selectedDepartment === "All"
      ? uploadData
      : uploadData.filter((item) => item.department === selectedDepartment);

  const totalDocuments = filteredData.length;
  const completeDocuments = filteredData.filter((d) => d.status === "Complete").length;
  const incompleteDocuments = filteredData.filter((d) => d.status === "Incomplete").length;
  const completionRate = totalDocuments > 0 ? Math.round((completeDocuments / totalDocuments) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-xs font-semibold text-[#aaaaaa] tracking-wide uppercase">
        REGISTRAR OFFICE · DOCUMENT UPLOAD
      </div>

      {/* Page Header - Split Color Title */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2 mb-2">
          <h1 className="text-4xl font-bold text-white">Document Upload</h1>
          <h1 className="text-4xl font-bold text-[#e8834a]">Dashboard</h1>
        </div>
        <p className="text-sm text-[#aaaaaa]">
          Monitor document submission status across all departments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Total Documents</p>
            <FileText className="w-5 h-5 text-[#e8834a]" />
          </div>
          <p className="text-3xl font-bold text-white">{totalDocuments}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Complete</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">{completeDocuments}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Incomplete</p>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">{incompleteDocuments}</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-[10px] p-6 border border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#aaaaaa]">Completion Rate</p>
            <div className="text-sm text-[#e8834a] font-bold">{completionRate}%</div>
          </div>
          <div className="w-full bg-[#2a2a2a] rounded-full h-2 mt-2">
            <div
              className="bg-[#e8834a] h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Department Filter + Search + Sort */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#aaaaaa]" />
            <span className="text-sm text-[#aaaaaa] font-semibold uppercase">Filter by Department:</span>
          </div>
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-[200px] bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-[10px] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e8834a] focus:border-[#e8834a] transition-colors"
          >
            <option value="All">All Departments</option>
            {/* Add dynamic department options here */}
          </select>
        </div>

        {/* Search Bar + Sort Button */}
        <div className="flex items-center gap-3">
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
                  Department (A-Z)
                </button>
                <button
                  onClick={() => { setSortOrder("desc"); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    sortOrder === "desc"
                      ? "bg-[#e8834a] text-[#121212] font-semibold"
                      : "text-white hover:bg-[#2a2a2a]"
                  }`}
                >
                  Department (Z-A)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Status Table */}
      <div className="bg-[#1a1a1a] rounded-[10px] overflow-hidden border border-[#2a2a2a]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left p-4 text-white font-bold">Department</th>
              <th className="text-left p-4 text-white font-bold">Document</th>
              <th className="text-left p-4 text-white font-bold">Status</th>
              <th className="text-left p-4 text-white font-bold">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-[#aaaaaa] py-8">
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