"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Minus, Plus, Search } from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";
import { getCurrentUser, hasLocalSession, type StudentProfile } from "../../../lib/auth-client";
import { loadFaqEntries, type FaqContextEntry } from "../../../lib/registrar-api";

export default function FAQsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [entries, setEntries] = useState<FaqContextEntry[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const init = async () => {
      const localSessionExists = hasLocalSession();
      const user = localSessionExists ? await getCurrentUser() : null;
      const isSignedIn = Boolean(user) || localSessionExists;

      setProfile(user);
      setIsGuest(!isSignedIn);

      const data = await loadFaqEntries(user?.collegeCode, user?.programCode, !isSignedIn);
      setEntries(data);
      const requestedFaqId = typeof window === "undefined"
        ? NaN
        : Number(new URLSearchParams(window.location.search).get("faqId"));
      if (Number.isInteger(requestedFaqId) && requestedFaqId > 0 && data.some((entry) => entry.id === requestedFaqId)) {
        setOpenId(requestedFaqId);
        return;
      }

      if (data.length > 0) {
        setOpenId(data[0].id);
      }
    };

    void init();
  }, [router]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return entries.filter((faq) => {
      if (!faq.isGuestVisible && isGuest) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [faq.title, faq.answer].join(" ").toLowerCase().includes(query);
    });
  }, [entries, isGuest, searchQuery]);

  return (
    <>
      <div className="relative h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none fixed top-[-8%] right-[-6%] w-[420px] h-[420px] rounded-full bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[100px] z-0" />
        <div aria-hidden="true" className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[340px] h-[340px] rounded-full bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[80px] z-0" />

        <DesktopSidebar />
        <MobileSidebar />

        <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10 overflow-hidden pt-16 lg:pt-0">
          <main className="flex-1 overflow-y-auto w-full flex flex-col pt-4 lg:pt-7 items-center">
            <div className="w-full max-w-3xl px-6 lg:px-8 pb-20">
              <div className="flex flex-col items-center text-center mt-4 lg:mt-10 mb-8 lg:mb-10 animate-fade-in-up">
                <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3 lg:mb-4">
                  Frequently asked questions
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-[1.05rem] max-w-xl">
                  These are the published FAQ entries for {isGuest ? "guests" : profile?.collegeCode || "your college"}. Can't find what you're looking for?{" "}
                  <button onClick={() => router.push("/haribot")} className="text-[#6e3102] dark:text-[#d4855a] font-semibold hover:underline decoration-2 underline-offset-4">
                    Talk with Hari!
                  </button>
                </p>
              </div>

              <div className="mb-6 lg:mb-8 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 text-[0.95rem] focus:outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 transition-all shadow-sm"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

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
                          <div className="space-y-1">
                            <h3 className={`text-[0.95rem] font-bold leading-snug transition-colors ${isOpen ? "text-[#6e3102] dark:text-[#d4855a]" : "text-gray-900 dark:text-gray-100"}`}>
                              {faq.title}
                            </h3>
                          </div>
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? "bg-[#6e3102]/10 dark:bg-[#d4855a]/10 rotate-180" : "bg-gray-200 dark:bg-white/10"}`}>
                            {isOpen ? <Minus size={14} className="text-[#6e3102] dark:text-[#d4855a]" /> : <Plus size={14} className="text-gray-600 dark:text-gray-400" />}
                          </div>
                        </button>

                        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 pb-4 px-5" : "grid-rows-[0fr] opacity-0 px-5"}`}>
                          <div className="overflow-hidden">
                            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-1 border-t border-gray-100 dark:border-white/[0.04] mt-2">
                              <p className="whitespace-pre-wrap">{faq.answer}</p>
                            </div>
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
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
