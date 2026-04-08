"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Filter, FileText, Search, ListFilter, ClipboardList } from "lucide-react";

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
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header Section */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-8 pt-8 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#aaaaaa] mb-2">
          <ClipboardList size={12} />
          REGISTRAR · UPLOAD DASHBOARD
        </div>

        {/* Page Header - Split Color Title */}
        <h1 className="text-3xl lg:text-[2rem] font-extrabold tracking-tight leading-tight text-white mb-1">
          Document Upload <span className="text-[#e8834a]">Dashboard</span>
        </h1>
        <p className="text-sm text-[#aaaaaa] mb-6">
          Monitor document submission status across all departments
        </p>
      </div>

      {/* Main Content */}
      <div className="px-8 py-7">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Total Documents</p>
              <FileText className="w-5 h-5 text-[#e8834a]" />
            </div>
            <p className="text-4xl font-extrabold text-white">{totalDocuments}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Complete</p>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-4xl font-extrabold text-white">{completeDocuments}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Incomplete</p>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-4xl font-extrabold text-white">{incompleteDocuments}</p>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">Completion Rate</p>
              <div className="text-sm text-[#e8834a] font-extrabold">{completionRate}%</div>
            </div>
            <div className="w-full bg-[#2a2a2a] rounded-full h-2.5">
              <div
                className="bg-[#e8834a] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Filters & Search Section */}
        <div className="space-y-4 mb-8">
          {/* Department Filter Row */}
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide mb-2">
                <span className="flex items-center gap-1.5">
                  <Filter size={14} />
                  Filter by Department
                </span>
              </label>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8834a]/30 focus:border-[#e8834a] transition-all hover:border-[#3a3a3a]"
              >
                <option value="All">All Departments</option>
              </select>
            </div>
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

        {/* Documents Table */}
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#222222]/50">
                <th className="text-left p-4 text-white font-bold text-sm">Department</th>
                <th className="text-left p-4 text-white font-bold text-sm">Document</th>
                <th className="text-left p-4 text-white font-bold text-sm">Status</th>
                <th className="text-left p-4 text-white font-bold text-sm">Last Updated</th>
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
    </div>
  );
}