"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, Filter, FileText } from "lucide-react";

const uploadData: any[] = [];

export default function DashboardPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");

  const filteredData =
    selectedDepartment === "All"
      ? uploadData
      : uploadData.filter((item) => item.department === selectedDepartment);

  const totalDocuments = filteredData.length;
  const completeDocuments = filteredData.filter((d) => d.status === "Complete").length;
  const incompleteDocuments = filteredData.filter((d) => d.status === "Incomplete").length;
  const completionRate = totalDocuments > 0 ? Math.round((completeDocuments / totalDocuments) * 100) : 0;

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] p-8">
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Document Upload Dashboard</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Monitor document submission status across all departments
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Total Documents</p>
            <FileText className="w-5 h-5 text-[color:var(--brand)]" />
          </div>
          <p className="text-3xl">{totalDocuments}</p>
        </div>
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Complete</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl">{completeDocuments}</p>
        </div>
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Incomplete</p>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl">{incompleteDocuments}</p>
        </div>
        <div className="bg-[color:var(--panel)] rounded-2xl p-6 border border-[color:var(--line)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[color:var(--muted)]">Completion Rate</p>
            <div className="text-sm text-[color:var(--brand)]">{completionRate}%</div>
          </div>
          <div className="w-full bg-[color:var(--line)] rounded-full h-2 mt-2">
            <div
              className="bg-[color:var(--brand)] h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Department Filter */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[color:var(--muted)]" />
          <span className="text-sm text-[color:var(--muted)]">Filter by Department:</span>
        </div>
        <select
          value={selectedDepartment}
          onChange={e => setSelectedDepartment(e.target.value)}
          className="w-[200px] bg-[color:var(--panel)] border border-[color:var(--line)] text-[color:var(--text)] rounded px-3 py-2"
        >
          <option value="All">All Departments</option>
          {/* Add dynamic department options here */}
        </select>
      </div>

      {/* Document Status Table */}
      <div className="bg-[color:var(--panel)] rounded-2xl overflow-hidden border border-[color:var(--line)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[color:var(--line)]">
              <th className="text-left p-3 text-[color:var(--muted)]">Department</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Document</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Status</th>
              <th className="text-left p-3 text-[color:var(--muted)]">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-[color:var(--muted)] py-8">
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