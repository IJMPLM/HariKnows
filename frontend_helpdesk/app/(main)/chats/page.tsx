"use client";

import { BotMessageSquare } from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

const recentChats = [
  { id: 1, text: "Question #1", time: "2m ago" },
  { id: 2, text: "Question #2", time: "1h ago" },
  { id: 3, text: "Question #3", time: "3h ago" },
  { id: 4, text: "Question #4", time: "Yesterday" },
];

export default function ChatsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Ambient gradient blobs for consistency */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-[-8%] right-[-6%] w-[280px] h-[280px] lg:w-[420px] lg:h-[420px] rounded-full bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[70px] lg:blur-[100px] z-0"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[220px] h-[220px] lg:w-[340px] lg:h-[340px] rounded-full bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[60px] lg:blur-[80px] z-0"
      />
      <div className="relative z-10 flex flex-col lg:flex-row w-full">
        <DesktopSidebar />
        <MobileSidebar />
        <main role="main" className="flex-1 lg:ml-64 min-h-screen flex flex-col w-full max-w-full overflow-hidden pt-16 lg:pt-0">
          <div className="flex flex-1 flex-col justify-center" style={{ minHeight: '60vh' }}>
            <div className="px-5 py-7 lg:px-8 lg:py-6 max-w-3xl mx-auto w-full">
              <section style={{ animation: "fadeUp 0.5s ease both" }}>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 text-center">Recent Chats</h1>
                <ul className="space-y-3.5">
                  {recentChats.map((chat) => (
                    <li
                      key={chat.id}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08] shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6e3102]/15 to-[#280d02]/5 dark:bg-[#27272a] flex items-center justify-center flex-shrink-0">
                        <BotMessageSquare size={18} className="text-[#6e3102] dark:text-[#d4855a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{chat.text}</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{chat.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
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
