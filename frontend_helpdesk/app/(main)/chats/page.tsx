"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BotMessageSquare, Clock } from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";
import { getCurrentUser } from "../../../lib/auth-client";
import { getConversationSessions, type ConversationSession } from "../../../lib/gemini-client";

export default function ChatsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      try {
        setLoading(true);
        const sessions = await getConversationSessions(30);
        setSessions(sessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [router]);

  const handleOpenChat = (conversationId: string) => {
    router.push(`/haribot?conversation=${conversationId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

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
                {error && (
                  <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {loading && (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#6e3102] dark:border-t-[#d4855a] rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading conversations...</p>
                    </div>
                  </div>
                )}
                {!loading && sessions.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No conversations yet. Start chatting with Hari!</p>
                  </div>
                )}
                {!loading && sessions.length > 0 && (
                  <ul className="space-y-3.5">
                    {sessions.map((session) => (
                      <li
                        key={session.conversationId}
                        onClick={() => handleOpenChat(session.conversationId)}
                        className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08] shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/[0.15] transition-all duration-200 cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6e3102]/15 to-[#280d02]/5 dark:bg-[#27272a] flex items-center justify-center flex-shrink-0 group-hover:from-[#6e3102]/25 transition-colors">
                          <BotMessageSquare size={18} className="text-[#6e3102] dark:text-[#d4855a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{session.previewText}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">{formatDate(session.lastMessageAt)}</p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400">{session.messageCount} messages</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex-shrink-0">
                          <Clock size={12} className="text-yellow-600 dark:text-yellow-500" />
                          <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-500">
                            {session.expiresInDays}d
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
