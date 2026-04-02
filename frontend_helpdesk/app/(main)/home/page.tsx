"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BotMessageSquare,
  MessageCircle,
  BarChart2,
  HelpCircle,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";
import Image from "next/image";

const recentChats = [
  { id: 1, text: "Question #1", time: "2m ago" },
  { id: 2, text: "Question #2", time: "1h ago" },
  { id: 3, text: "Question #3", time: "3h ago" },
  { id: 4, text: "Question #4", time: "Yesterday" },
];

export default function HomePage() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  
  // next-themes setup
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      onClick={() => setOpenMenu(null)} 
      className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[-8%] right-[-6%] 
                    w-[280px] h-[280px] lg:w-[420px] lg:h-[420px] 
                    rounded-full bg-[#6e3102]/15 dark:bg-[#6e3102]/20 
                    blur-[70px] lg:blur-[100px] z-0"
      />
      
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[5%] left-[-8%] 
                    w-[220px] h-[220px] lg:w-[340px] lg:h-[340px] 
                    rounded-full bg-[#280d02]/15 dark:bg-[#d4855a]/10 
                    blur-[60px] lg:blur-[80px] z-0"
      />
      
      <div className="relative z-10 flex flex-col lg:flex-row w-full">
        
        {/* Sidebars */}
        <DesktopSidebar />
        <MobileSidebar />

        {/* MAIN AREA */}
        <main role="main" className="flex-1 lg:ml-64 min-h-screen flex flex-col w-full max-w-full overflow-hidden pt-16 lg:pt-0">

          {/* Desktop top-right controls */}
          <div className="hidden lg:flex items-center justify-end gap-1.5 px-8 pt-5">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center
                          text-gray-500 dark:text-gray-300
                          hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              onClick={(e) => { 
                e.stopPropagation(); 
                setTheme(theme === "dark" ? "light" : "dark"); 
              }}
              aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
            </button>
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center
                          text-gray-500 dark:text-gray-300
                          hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Account settings"
            >
            </button>
          </div>

          {/* Page content */}
          <div className="flex-1 px-5 py-7 lg:px-8 lg:py-6 max-w-3xl mx-auto w-full space-y-8">

            {/* HERO */}
            <section
              aria-labelledby="greeting"
              style={{ animation: "fadeUp 0.5s ease both" }}
            >
              <div className="flex items-center gap-4 lg:gap-5">
                
                {/* Hari_HI GIF */}
                <Image 
                  src="/Hari_HI2.gif" 
                  alt="Hari waving hi" 
                  width={112} 
                  height={112} 
                  className="w-28 h-28 lg:w-28 lg:h-28 object-contain drop-shadow-sm flex-shrink-0"
                  unoptimized 
                />

                {/* Text Block Container */}
                <div className="flex flex-col">
                  <h1 id="greeting" className="text-[2.2rem] lg:text-5xl font-extrabold tracking-tight leading-tight">
                    Hello,{" "}
                    <span className="text-[#6e3102] dark:text-[#d4855a]">
                      Rubilyn!
                    </span>
                  </h1>
                  <p className="mt-1 lg:mt-2 text-gray-600 dark:text-gray-400 text-[0.95rem]">
                    What would you like to explore today?
                  </p>
                </div>

              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section
              aria-label="Quick actions"
              style={{ animation: "fadeUp 0.5s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-[minmax(100px,auto)]">

                {/* Talk with Hari */}
                <article
                  className="row-span-2 lg:row-span-1 rounded-2xl p-5 cursor-pointer select-none
                              bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212]
                              shadow-lg shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10
                              hover:bg-[#5a2801] dark:hover:bg-[#e09873] hover:scale-[1.02] active:scale-[0.98]
                              transition-all duration-200 flex flex-col justify-between"
                  role="button"
                  tabIndex={0}
                  aria-label="Talk with Hari"
                  onClick={() => router.push("/haribot")}
                  onKeyDown={(e) => e.key === "Enter" && router.push("/haribot")}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-black/10 backdrop-blur-sm flex items-center justify-center">
                    <MessageCircle size={20} className="text-white dark:text-[#121212]" />
                  </div>
                  <div>
                    <p className="font-bold text-base leading-snug">Talk with Hari</p>
                    <p className="text-white/80 dark:text-[#121212]/80 text-xs mt-0.5">Try it now!</p>
                  </div>
                </article>

                {/* Transaction History */}
                <article
                  className="rounded-2xl p-4 cursor-pointer select-none
                              bg-white dark:bg-[#18181b]
                              border border-gray-100 dark:border-white/[0.08]
                              hover:border-[#6e3102]/30 dark:hover:border-[#d4855a]/40
                              hover:scale-[1.02] active:scale-[0.98]
                              transition-all duration-200 shadow-sm hover:shadow-md
                              flex flex-col justify-between"
                  role="button"
                  tabIndex={0}
                  aria-label="Transaction History"
                  onClick={() => router.push("/transactions")}
                  onKeyDown={(e) => e.key === "Enter" && router.push("/transactions")}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#6e3102]/10 dark:bg-[#d4855a]/10 flex items-center justify-center">
                    <BarChart2 size={18} className="text-[#6e3102] dark:text-[#d4855a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug">
                      Transaction History
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 hidden lg:block">View your transactions here</p>
                  </div>
                </article>

                {/* FAQs */}
                <article
                  className="rounded-2xl p-4 cursor-pointer select-none
                              bg-white dark:bg-[#18181b]
                              border border-gray-100 dark:border-white/[0.08]
                              hover:border-[#6e3102]/30 dark:hover:border-[#d4855a]/40
                              hover:scale-[1.02] active:scale-[0.98]
                              transition-all duration-200 shadow-sm hover:shadow-md
                              flex flex-col justify-between"
                  role="button"
                  tabIndex={0}
                  aria-label="FAQs"
                  onClick={() => router.push("/faqs")}
                  onKeyDown={(e) => e.key === "Enter" && router.push("/faqs")}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#6e3102]/10 dark:bg-[#d4855a]/10 flex items-center justify-center">
                    <HelpCircle size={18} className="text-[#6e3102] dark:text-[#d4855a]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug">FAQs</p>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 hidden lg:block">Find answers to common questions</p>
                  </div>
                </article>

              </div>
            </section>

            {/* RECENT CHATS */}
            <section
              aria-labelledby="recent-chats-heading"
              style={{ animation: "fadeUp 0.5s 0.2s ease both", opacity: 0, animationFillMode: "forwards" }}
            >
              <div className="flex items-center justify-between mb-3.5">
                <h2 id="recent-chats-heading" className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Chats
                </h2>
                <a
                  href="/chats"
                  aria-label="See all recent chats"
                  className="flex items-center gap-0.5 text-sm font-medium
                              text-[#6e3102] dark:text-[#d4855a]
                              hover:text-[#280d02] dark:hover:text-[#e8954a] transition-colors"
                >
                  See All <ChevronRight size={14} />
                </a>
              </div>

              <ul className="space-y-2.5" role="list">
                {recentChats.map((chat) => (
                  <li
                    key={chat.id}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer
                                bg-white dark:bg-[#18181b]
                                border border-gray-100 dark:border-white/[0.08]
                                hover:border-[#6e3102]/20 dark:hover:border-[#d4855a]/30
                                transition-all duration-150 shadow-sm hover:shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full
                                  bg-gradient-to-br from-[#6e3102]/15 to-[#280d02]/5
                                  dark:bg-[#27272a] dark:from-transparent dark:to-transparent
                                  flex items-center justify-center flex-shrink-0"
                    >
                      <BotMessageSquare size={18} className="text-[#6e3102] dark:text-[#d4855a]" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {chat.text}
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{chat.time}</p>
                    </div>

                    {/* Context menu */}
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center
                                    text-gray-300 dark:text-gray-500
                                    hover:text-gray-600 dark:hover:text-gray-300
                                    hover:bg-gray-100 dark:hover:bg-white/10
                                    opacity-0 group-hover:opacity-100
                                    transition-all duration-150"
                        aria-label={`Options for: ${chat.text}`}
                        aria-expanded={openMenu === chat.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === chat.id ? null : chat.id);
                        }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenu === chat.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-36 py-1
                                      bg-white dark:bg-[#27272a]
                                      rounded-xl border border-gray-100 dark:border-white/10
                                      shadow-xl shadow-black/10 dark:shadow-black/30 z-50"
                          role="menu"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                                        hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                            role="menuitem"
                          >
                            Open Chat
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-[#6e3102] dark:text-[#d4855a]
                                        hover:bg-[#6e3102]/10 dark:hover:bg-white/[0.06] transition-colors"
                            role="menuitem"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}