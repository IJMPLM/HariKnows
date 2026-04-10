"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BotMessageSquare, Clock, Trash2 } from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";
import { getCurrentUser } from "../../../lib/auth-client";
import { getConversationSessions, type ConversationSession } from "../../../lib/gemini-client";

export default function ChatsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

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

  // Delete Handlers
  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevents the list item click from firing
    setChatToDelete(conversationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      // Remove the session purely from frontend state
      setSessions((prevSessions) => 
        prevSessions.filter((session) => session.conversationId !== chatToDelete)
      );
    }
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setChatToDelete(null);
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
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08] shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-white/[0.15] transition-all duration-200 cursor-pointer group"
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
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                            <Clock size={12} className="text-yellow-600 dark:text-yellow-500" />
                            <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-500">
                              {session.expiresInDays}d
                            </span>
                          </div>
                          {/* Removed opacity-0 and group-hover:opacity-100 from here to make it permanently visible */}
                          <button
                            onClick={(e) => handleDeleteClick(e, session.conversationId)}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label="Delete chat"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-lg max-w-md w-full animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Chat History</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to permanently delete this chat? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-bold text-[0.95rem] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-bold text-[0.95rem] hover:bg-[#5a2801] dark:hover:bg-[#e09873] active:scale-[0.98] transition-all shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}