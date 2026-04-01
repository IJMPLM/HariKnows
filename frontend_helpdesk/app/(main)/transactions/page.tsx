"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Hourglass,
  FileCheck,
  FileWarning,
  Package,
  X,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

type StepStatus = "completed" | "in-progress" | "pending";

interface Step {
  label: string;
  description: string;
  date: string;
  status: StepStatus;
}

interface Transaction {
  id: number;
  serviceName: string;
  date: string;
  location: string;
  status: string;
  category: string;
  referenceCode: string;
  steps: Step[];
}

const transactions: Transaction[] = [
  {
    id: 1,
    serviceName: "Certificate of Grades",
    date: "March 27, 2026, 09:00 AM",
    location: "Processing in the College of Engineering",
    status: "Pending",
    category: "Pending",
    referenceCode: "REG-2024-089",
    steps: [
      { label: "Order Placed", description: "Request submitted successfully.", date: "Mar 27, 09:00 AM", status: "completed" },
      { label: "Processing", description: "Processing in the College of Engineering.", date: "Mar 28, 02:15 PM", status: "in-progress" },
      { label: "Prepared", description: "Document ready for release.", date: "Estimated: Mar 30", status: "pending" },
      { label: "Released", description: "Document claimed by student.", date: "", status: "pending" },
    ],
  },
  {
    id: 2,
    serviceName: "Transcript of Records",
    date: "April 1, 2026, 10:30 AM",
    location: "Document prepared and ready for pickup.",
    status: "Prepared",
    category: "Prepared",
    referenceCode: "CISTM-2024-045",
    steps: [
      { label: "Order Placed", description: "Request submitted successfully.", date: "Apr 1, 10:30 AM", status: "completed" },
      { label: "Processing", description: "Reviewed and processed by the Registrar.", date: "Apr 2, 11:00 AM", status: "completed" },
      { label: "Prepared", description: "Document ready for pickup at the OUR window.", date: "Apr 3, 09:00 AM", status: "in-progress" },
      { label: "Released", description: "Document claimed by student.", date: "", status: "pending" },
    ],
  },
  {
    id: 3,
    serviceName: "Certificate of Marriage",
    date: "January 15, 2025, 08:45 AM",
    location: "Released by the Registrar.",
    status: "Complete",
    category: "Complete",
    referenceCode: "ADM-2024-112",
    steps: [
      { label: "Order Placed", description: "Request submitted successfully.", date: "Jan 15, 08:45 AM", status: "completed" },
      { label: "Processing", description: "Processed and verified by Registrar staff.", date: "Jan 16, 01:00 PM", status: "completed" },
      { label: "Prepared", description: "Document sealed and prepared.", date: "Jan 17, 10:00 AM", status: "completed" },
      { label: "Released", description: "Document claimed by student.", date: "Jan 18, 09:30 AM", status: "completed" },
    ],
  },
  {
    id: 4,
    serviceName: "Certificate of Good Moral",
    date: "November 5, 2024, 02:00 PM",
    location: "Archived due to non-claim past 30 days.",
    status: "Expired",
    category: "Expired",
    referenceCode: "NUR-2024-023",
    steps: [
      { label: "Order Placed", description: "Request submitted successfully.", date: "Nov 5, 02:00 PM", status: "completed" },
      { label: "Processing", description: "Processed by the Registrar.", date: "Nov 6, 10:00 AM", status: "completed" },
      { label: "Prepared", description: "Document prepared and awaiting claim.", date: "Nov 7, 09:00 AM", status: "completed" },
      { label: "Released", description: "Unclaimed. Archived after 30 days.", date: "Dec 7, 09:00 AM", status: "completed" },
    ],
  },
  {
    id: 5,
    serviceName: "Official Transcript of Records",
    date: "August 12, 2025, 11:00 AM",
    location: "Awaiting Clearance Approval.",
    status: "Pending",
    category: "Pending",
    referenceCode: "REG-2024-089",
    steps: [
      { label: "Order Placed", description: "Request submitted successfully.", date: "Aug 12, 11:00 AM", status: "completed" },
      { label: "Processing", description: "Awaiting clearance approval.", date: "Aug 13, 08:00 AM", status: "in-progress" },
      { label: "Prepared", description: "Document ready for release.", date: "Estimated: Aug 15", status: "pending" },
      { label: "Released", description: "Document claimed by student.", date: "", status: "pending" },
    ],
  },
];

const tabs = ["All", "Pending", "Prepared", "Complete", "Expired"];

function getStatusStyles(status: string) {
  switch (status) {
    case "Complete":
      return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-green-200 dark:border-green-500/20";
    case "Expired":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-500/20";
    case "Prepared":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
    case "Pending":
    default:
      return "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 border-gray-200 dark:border-white/10";
  }
}

function getTransactionIcon(category: string, className = "w-5 h-5 lg:w-6 lg:h-6") {
  switch (category) {
    case "Complete":
      return <FileCheck className={`text-green-600 dark:text-green-400 ${className}`} />;
    case "Expired":
      return <FileWarning className={`text-red-600 dark:text-red-400 ${className}`} />;
    case "Prepared":
      return <Package className={`text-blue-600 dark:text-blue-400 ${className}`} />;
    case "Pending":
    default:
      return <Hourglass className={`text-gray-500 dark:text-gray-400 ${className}`} />;
  }
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return (
      <div className="w-8 h-8 rounded-full bg-[#6e3102] dark:bg-[#d4855a] flex items-center justify-center flex-shrink-0 shadow-sm">
        <CheckCircle2 size={16} className="text-white dark:text-[#121212]" />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-[#6e3102] dark:border-[#d4855a] bg-white dark:bg-[#18181b] flex items-center justify-center flex-shrink-0 text-[#6e3102] dark:text-[#d4855a] font-bold text-sm shadow-sm">
        <Clock size={14} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-white/20 bg-white dark:bg-[#18181b] flex items-center justify-center flex-shrink-0">
      <Circle size={10} className="text-gray-300 dark:text-white/20" />
    </div>
  );
}

function TransactionModal({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-modal-in">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {transaction.serviceName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
              {transaction.referenceCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={15} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Details */}
        <div className="px-6 py-4 flex flex-col gap-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Document</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[60%]">{transaction.serviceName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Reference Code</span>
            <span className="font-mono font-semibold text-[#6e3102] dark:text-[#d4855a]">{transaction.referenceCode}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Requested On</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-right max-w-[60%]">{transaction.date}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(transaction.status)}`}>
              {transaction.status}
            </span>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Progress Tracker</p>
          <div className="flex flex-col gap-0">
            {transaction.steps.map((step, index) => {
              const isLast = index === transaction.steps.length - 1;
              const isDimmed = step.status === "pending";
              return (
                <div key={index} className="flex gap-4">
                  {/* Left: icon + connector line */}
                  <div className="flex flex-col items-center">
                    <StepIcon status={step.status} />
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 rounded-full ${
                        step.status === "completed"
                          ? "bg-[#6e3102]/40 dark:bg-[#d4855a]/40"
                          : "bg-gray-200 dark:bg-white/10"
                      }`} style={{ minHeight: "24px" }} />
                    )}
                  </div>
                  {/* Right: text */}
                  <div className={`pb-5 ${isLast ? "pb-0" : ""} ${isDimmed ? "opacity-40" : ""}`}>
                    <p className={`text-sm font-bold leading-tight ${
                      step.status === "in-progress"
                        ? "text-[#6e3102] dark:text-[#d4855a]"
                        : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                    {step.date && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{step.date}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const matchesTab = activeTab === "All" || t.category === activeTab;
    const matchesSearch = t.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <div className="relative h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">

        {/* Ambient gradient blobs */}
        <div aria-hidden="true" className="pointer-events-none fixed top-[-8%] right-[-6%] w-[420px] h-[420px] rounded-full bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[100px] z-0" />
        <div aria-hidden="true" className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[340px] h-[340px] rounded-full bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[80px] z-0" />

        {/* Sidebars */}
        <DesktopSidebar />
        <MobileSidebar />

        {/* RESPONSIVE LAYOUT */}
        <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10 overflow-hidden pt-16 lg:pt-0">
          <main className="flex-1 overflow-hidden flex flex-col w-full max-w-5xl mx-auto">

            {/* Header */}
            <header className="px-4 lg:px-8 pt-6 lg:pt-10 pb-2">
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Transaction History
              </h1>
            </header>

            {/* Tabs */}
            <div className="flex items-center justify-around lg:justify-start lg:gap-6 border-b border-gray-200 dark:border-white/10 mt-2 lg:mt-4 px-2 lg:px-8 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 pb-3 px-1 text-[0.85rem] lg:text-sm font-semibold text-center relative transition-colors ${
                    activeTab === tab
                      ? "text-[#6e3102] dark:text-[#d4855a]"
                      : "text-gray-500 dark:text-gray-400 hover:text-[#6e3102]/80 dark:hover:text-[#d4855a]/80"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#6e3102] dark:bg-[#d4855a]" />
                  )}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="px-4 lg:px-8 mt-5 lg:mt-6 mb-4 lg:mb-2 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 lg:py-2.5 rounded-full lg:rounded-xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-[#6e3102]/50 dark:focus:ring-[#d4855a]/50 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Card List */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4 lg:space-y-5 pb-8 lg:pb-12">
              {filteredTransactions.map((t) => (
                <article
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="rounded-2xl bg-white lg:bg-gray-50/50 dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-[#6e3102]/20 dark:hover:border-[#d4855a]/30 transition-all duration-200 cursor-pointer"
                >
                  {/* Top Section */}
                  <div className="p-4 lg:p-5 flex items-center gap-4 lg:gap-5">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gray-50 lg:bg-white dark:bg-[#27272a] border border-gray-200 dark:border-white/10 flex-shrink-0 flex items-center justify-center shadow-sm">
                      {getTransactionIcon(t.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-[1.1rem] lg:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight lg:tracking-tight truncate">
                        {t.serviceName}
                      </h2>
                      <p className="text-sm lg:text-[0.95rem] text-gray-500 dark:text-gray-400 mt-0.5">
                        Requested: {t.date}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="bg-gray-50/80 lg:bg-white dark:bg-[#1f1f22] border-t border-gray-100 dark:border-white/[0.04] px-4 py-3 lg:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-0">
                    <p className="text-[0.8rem] lg:text-sm text-gray-600 dark:text-gray-400 leading-snug">
                      <span className="font-semibold text-gray-900 dark:text-gray-200">Status: </span>
                      {t.location}
                    </p>
                    <div className="flex justify-end lg:block mt-1 lg:mt-0">
                      <span className={`px-3 py-1 rounded-full text-[10px] lg:text-[11px] font-bold uppercase tracking-wider lg:tracking-wide border ${getStatusStyles(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                </article>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm lg:text-base">
                  No {activeTab === "All" ? "" : activeTab.toLowerCase() + " "}transactions found.
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      {/* Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in {
          animation: modalIn 0.22s ease both;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
