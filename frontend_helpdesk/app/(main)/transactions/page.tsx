"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Hourglass,
  FileCheck,
  FileWarning,
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

const transactions = [
  { 
    id: 1, 
    serviceName: "Certificate of Grades",
    date: "6/7/6767",
    location: "Processing in the College of Engineering",
    status: "Pending", 
    category: "Pending" 
  },
  { 
    id: 2, 
    serviceName: "Certificate of Good Moral Character",
    date: "3/18/2026",
    location: "Ready for pickup at the Registrar Office",
    status: "Prepared", 
    category: "Pending" 
  },
  { 
    id: 3, 
    serviceName: "Certificate of Marriage",
    date: "6/7/6767",
    location: "Released by the Registrar",
    status: "Complete",
    category: "Complete"
  },
  { 
    id: 4, 
    serviceName: "Certificate of Divorce",
    date: "6/7/6767",
    location: "Archived due to non-claim past 30 days",
    status: "Expired",
    category: "Expired"
  },
  { 
    id: 5, 
    serviceName: "Official Transcript of Records",
    date: "8/12/2025",
    location: "Awaiting Clearance Approval",
    status: "Pending",
    category: "Pending"
  },
];

const tabs = ["Pending", "Complete", "Expired"];

function getStatusStyles(status: string) {
  switch (status) {
    case 'Complete':
      return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 border-green-200 dark:border-green-500/20';
    case 'Expired':
      return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200 dark:border-red-500/20';
    case 'Prepared':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
    case 'Pending':
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 border-gray-200 dark:border-white/10';
  }
}

// Updated to accept Tailwind classes for responsive sizing
function getTransactionIcon(category: string, className: string = "w-5 h-5 lg:w-6 lg:h-6") {
  switch (category) {
    case 'Complete':
      return <FileCheck className={`text-green-600 dark:text-green-400 ${className}`} />;
    case 'Expired':
      return <FileWarning className={`text-red-600 dark:text-red-400 ${className}`} />;
    case 'Pending':
    default:
      return <Hourglass className={`text-gray-500 dark:text-gray-400 ${className}`} />;
  }
}

export default function TransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");

  // Filter logic
  const filteredTransactions = transactions.filter(t => 
    t.category === activeTab && 
    t.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="relative h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">
        
        {/* Ambient gradient blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-[-8%] right-[-6%] w-[420px] h-[420px] rounded-full
                      bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[100px] z-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[340px] h-[340px] rounded-full
                      bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[80px] z-0"
        />

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
            <div className="flex items-center justify-around lg:justify-start lg:gap-8 border-b border-gray-200 dark:border-white/10 mt-2 lg:mt-4 px-2 lg:px-8">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 lg:flex-none pb-3 text-[0.9rem] lg:text-sm font-semibold text-center lg:text-left relative transition-colors ${
                    activeTab === tab 
                      ? 'text-[#6e3102] dark:text-[#d4855a]' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-[#6e3102]/80 dark:hover:text-[#d4855a]/80'
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

            {/* Responsive Card List */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-4 lg:space-y-5 pb-8 lg:pb-12">
              {filteredTransactions.map((t) => (
                <article key={t.id} className="rounded-2xl bg-white lg:bg-gray-50/50 dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-[#6e3102]/20 dark:hover:border-[#d4855a]/30 transition-all duration-200">
                  
                  {/* Top Section */}
                  <div className="p-4 lg:p-5 flex items-center gap-4 lg:gap-5">
                    {/* Circle with dynamic Icon */}
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

                  {/* Bottom Divider Section */}
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
                  No {activeTab.toLowerCase()} transactions found.
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        main > div:last-child > article {
           animation: fadeUp 0.4s ease both;
        }
      `}</style>
    </>
  );
}