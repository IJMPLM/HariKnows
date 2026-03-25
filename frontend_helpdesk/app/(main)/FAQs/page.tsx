"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus,
  Minus,
  MessageCircle
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

const faqsData = [
  {
    id: 1,
    category: "General",
    question: "Where is the OUR located?",
    answer: "The Office of the University Registrar (OUR) is located at the ground floor of the main building. Turn left from the main gate, then right down the main hallway.",
  },
  {
    id: 2,
    category: "Documents",
    question: "How do I request a True Copy of Grades?",
    answer: "You can request a True Copy of Grades directly through the 'Transaction History' page on this portal. Click on 'New Request', select the document type, and proceed with the payment.",
  },
  {
    id: 3,
    category: "Enrollment",
    question: "What are the requirements for enrollment?",
    answer: "Incoming students must submit their original Form 138 (Report Card), PSA Birth Certificate, Certificate of Good Moral Character, and 2x2 ID pictures.",
  },
  {
    id: 4,
    category: "Documents",
    question: "How long does document processing take?",
    answer: "Standard processing takes 3-5 business days. During peak enrollment seasons, please allow up to 7-10 business days. You can track your status in the Transactions tab.",
  },
  {
    id: 5,
    category: "General",
    question: "Can I authorize someone else to claim my documents?",
    answer: "Yes. Your authorized representative must present an Authorization Letter signed by you, a photocopy of your valid ID, and their own original valid ID upon claiming.",
  },
  {
    id: 6,
    category: "Enrollment",
    question: "How do I add or drop a subject?",
    answer: "Adding or dropping of subjects is only allowed during the official revision period. You must secure a revision form from your college dean and submit it to the OUR.",
  }
];

const categories = ["All", "General", "Enrollment", "Documents"];

export default function FAQsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openId, setOpenId] = useState<number | null>(1); // Default open first item

  // Filter FAQs based on search query and active category
  const filteredFaqs = faqsData.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
        <MobileSidebar /> {/* <-- Added Mobile Sidebar */}

        {/* Main Content Wrapper */}
        <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10 overflow-hidden pt-16 lg:pt-0">

          {/* --- MAIN SCROLLABLE AREA --- */}
          <main className="flex-1 overflow-y-auto w-full flex flex-col pt-4 lg:pt-7 items-center">
            <div className="w-full max-w-3xl px-6 lg:px-8 pb-20">
              
              {/* Hero Section */}
              <div className="flex flex-col items-center text-center mt-4 lg:mt-10 mb-8 lg:mb-10 animate-fade-in-up">
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3 lg:mb-4">
                  Frequently asked questions
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-[1.05rem] max-w-xl">
                  These are the most commonly asked questions about Registrar processes. 
                  Can't find what you're looking for?{" "}
                  <button 
                    onClick={() => router.push('/haribot')}
                    className="text-[#6e3102] dark:text-[#d4855a] font-semibold hover:underline decoration-2 underline-offset-4"
                  >
                    Talk with Hari!
                  </button>
                </p>
              </div>

              {/* Desktop Category Tabs */}
              <div className="hidden lg:flex items-center justify-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeCategory === cat
                        ? "bg-[#6e3102] text-white dark:bg-[#d4855a] dark:text-[#121212] shadow-md"
                        : "bg-white dark:bg-[#18181b] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-[#6e3102]/30 dark:hover:border-[#d4855a]/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar (Mobile & Desktop) */}
              <div className="mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search for questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 text-[0.95rem] focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 transition-all shadow-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="space-y-3.5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq) => {
                    const isOpen = openId === faq.id;
                    
                    return (
                      <article 
                        key={faq.id} 
                        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                          isOpen 
                            ? "bg-white dark:bg-[#18181b] border-[#6e3102]/30 dark:border-[#d4855a]/30 shadow-md" 
                            : "bg-gray-50/80 dark:bg-[#18181b]/60 border-gray-200/80 dark:border-white/10 shadow-sm hover:border-gray-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#18181b]"
                        }`}
                      >
                        <button
                          onClick={() => setOpenId(isOpen ? null : faq.id)}
                          className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none"
                        >
                          <h3 className={`text-[0.95rem] font-bold leading-snug transition-colors ${
                            isOpen ? "text-[#6e3102] dark:text-[#d4855a]" : "text-gray-900 dark:text-gray-100"
                          }`}>
                            {faq.question}
                          </h3>
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${
                            isOpen ? "bg-[#6e3102]/10 dark:bg-[#d4855a]/10 rotate-180" : "bg-gray-200 dark:bg-white/10"
                          }`}>
                            {isOpen 
                              ? <Minus size={14} className="text-[#6e3102] dark:text-[#d4855a]" /> 
                              : <Plus size={14} className="text-gray-600 dark:text-gray-400" />
                            }
                          </div>
                        </button>
                        
                        {/* Expandable Answer Area */}
                        <div 
                          className={`grid transition-all duration-300 ease-in-out ${
                            isOpen ? "grid-rows-[1fr] opacity-100 pb-4 px-5" : "grid-rows-[0fr] opacity-0 px-5"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-1 border-t border-gray-100 dark:border-white/[0.04] mt-2">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center bg-white dark:bg-[#18181b] rounded-3xl border border-gray-200 border-dashed dark:border-white/10">
                    <MessageCircle size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No answers found for "{searchQuery}".</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try asking Haribot instead!</p>
                  </div>
                )}
              </div>

            </div>
          </main>
        </div>
      </div>

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}