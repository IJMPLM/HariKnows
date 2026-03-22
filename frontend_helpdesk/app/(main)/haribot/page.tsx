"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Bot, 
  Send, 
  ChevronLeft, 
  Loader2, 
  MoreHorizontal,
  Image as ImageIcon,
  Sparkles,
  Paperclip,
} from "lucide-react";

import DesktopSidebar from "../../components/DesktopSidebar"; 

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";
const PAGE_SIZE = 20;

type Message = {
  id: number;
  sender: string;
  content: string;
  createdAt: string;
};

type MessagePage = {
  messages: Message[];
  hasMore: boolean;
};

type FetchParams = {
  beforeId?: number;
  afterId?: number;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HaribotPage() {
  const router = useRouter();
  
  // next-themes setup
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const oldestId = useMemo(() => messages[0]?.id, [messages]);
  const latestId = useMemo(() => messages[messages.length - 1]?.id, [messages]);

  // --- API LOGIC ---
  const fetchMessages = async (params: FetchParams = {}): Promise<MessagePage> => {
    const url = new URL(`${API_BASE}/api/helpdesk/messages`);
    url.searchParams.set("limit", String(PAGE_SIZE));

    if (params.beforeId) url.searchParams.set("beforeId", String(params.beforeId));
    if (params.afterId) url.searchParams.set("afterId", String(params.afterId));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to load messages");
    return (await response.json()) as MessagePage;
  };

  const loadInitial = async () => {
    try {
      const result = await fetchMessages();
      setMessages(result.messages);
      setHasMore(result.hasMore);
      requestAnimationFrame(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
      });
    } catch (error) {
      console.error(error);
    }
  };

  const loadOlder = async () => {
    if (!oldestId || busy || !hasMore) return;
    const previousHeight = threadRef.current?.scrollHeight ?? 0;
    setBusy(true);
    try {
      const result = await fetchMessages({ beforeId: oldestId });
      setMessages((current) => [...result.messages, ...current]);
      setHasMore(result.hasMore);
      requestAnimationFrame(() => {
        const currentHeight = threadRef.current?.scrollHeight ?? 0;
        threadRef.current?.scrollTo({ top: currentHeight - previousHeight });
      });
    } finally {
      setBusy(false);
    }
  };

  const pollNew = async () => {
    if (!latestId) return;
    try {
      const result = await fetchMessages({ afterId: latestId });
      if (result.messages.length > 0) {
        setMessages((current) => [...current, ...result.messages]);
        requestAnimationFrame(() => {
          threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
        });
      }
    } catch (error) {
      // Silently fail polling
    }
  };

  const submit = async (event?: React.FormEvent<HTMLFormElement>, overrideText?: string) => {
    if (event) event.preventDefault();
    const contentToSend = overrideText || text;
    const trimmed = contentToSend.trim();
    
    if (!trimmed || busy) return;

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/helpdesk/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", content: trimmed }),
      });

      if (!response.ok) throw new Error("Failed to send");

      const created = (await response.json()) as Message;
      setMessages((current) => [...current, created]);
      if (!overrideText) setText("");
      
      requestAnimationFrame(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => pollNew(), 3500);
    return () => clearInterval(timer);
  }, [latestId]);

  const isEmpty = messages.length === 0;

  return (
    <>
      <div className="relative h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">
        
        {/* Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#6e3102]/5 dark:bg-[#6e3102]/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#d4855a]/5 dark:bg-[#d4855a]/5 blur-[100px]" />
        </div>

        {/* Desktop Sidebar */}
        <DesktopSidebar />

        <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10">

          {/* MOBILE Header */}
          <header className="lg:hidden flex items-center justify-between px-6 py-4">
            <button 
              onClick={() => router.push('/home')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={18} />
              Back
            </button>
          </header>

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden relative">
            
            {isEmpty ? (
              /* EMPTY STATE */
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 animate-fade-in">
                <div className="relative flex items-center justify-center mb-8">
                  {/* Glowing Orbs */}
                  <div className="absolute w-32 h-32 bg-[#6e3102]/30 dark:bg-[#d4855a]/30 rounded-full blur-[40px] animate-pulse-slow"></div>
                  <div className="absolute w-24 h-24 bg-[#d4855a]/40 dark:bg-[#e09873]/20 rounded-full blur-[30px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
                  
                  {/* Mascot Core (Replace Bot with mascot when im done lel) */}
                  <div className="relative z-10 w-20 h-20 bg-white dark:bg-[#18181b] rounded-full shadow-2xl flex items-center justify-center border border-white/50 dark:border-white/10">
                    <Bot size={40} className="text-[#6e3102] dark:text-[#d4855a]" />
                  </div>
                </div>

                {/* Greeting */}
                <h1 className="text-3xl sm:text-4xl font-semibold text-center tracking-tight mb-2">
                  Good Day, <span className="text-[#6e3102] dark:text-[#d4855a]">Jana</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-center">
                  Ask about enrollment, document requests, or your processing status.
                </p>

                {/* Prompt Suggestions */}
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl">
                  {[
                    { text: "What are the requirements for enrollment?", icon: <Sparkles size={16} /> },
                    { text: "How do I request a True Copy of Grades?", icon: <Paperclip size={16} /> },
                    { text: "Check my clearance status", icon: <Loader2 size={16} /> },
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setText(prompt.text);
                        submit(undefined, prompt.text);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300 hover:border-[#6e3102]/30 dark:hover:border-[#d4855a]/50 hover:shadow-md transition-all"
                    >
                      <span className="text-[#6e3102] dark:text-[#d4855a]">{prompt.icon}</span>
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* CHAT THREAD STATE */
              <div 
                className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-32 space-y-8 scroll-smooth" 
                ref={threadRef}
              >
                {hasMore && (
                  <div className="flex justify-center">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                      onClick={loadOlder} 
                      disabled={busy}
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                      {busy ? "Loading..." : "Load previous messages"}
                    </button>
                  </div>
                )}

                {messages.map((message) => {
                  const isUser = message.sender === "user";

                  return (
                    <div key={message.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-4 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        <div className="flex-shrink-0 mt-1">
                          {isUser ? (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#27272a] flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                                ME
                              </div>
                          ) : (
                            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#6e3102] to-[#280d02] flex items-center justify-center shadow-md">
                              <Bot size={16} className="text-white" />
                            </div>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`px-5 py-3.5 rounded-2xl text-[0.95rem] leading-relaxed ${
                              isUser 
                                ? 'bg-gray-100 dark:bg-[#27272a] text-gray-900 dark:text-gray-100 rounded-tr-sm' 
                                : 'bg-transparent text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FLOATING COMPOSER */}
            <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-8">
              <div className="w-full bg-white dark:bg-[#18181b] p-2 pl-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-gray-100 dark:border-white/10 flex items-center gap-2">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10 hidden sm:block">
                  <Paperclip size={20} />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10 hidden sm:block">
                  <ImageIcon size={20} />
                </button>

                <form onSubmit={submit} className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Ask Haribot whatever you want..."
                    disabled={busy}
                    className="w-full bg-transparent border-none text-gray-900 dark:text-gray-100 px-2 py-3 focus:outline-none focus:ring-0 text-[0.95rem] disabled:opacity-50"
                    aria-label="Message"
                  />
                  
                  <div className="flex items-center gap-2 pr-1">
                    <button 
                      type="submit" 
                      disabled={busy || !text.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] hover:bg-[#5a2801] dark:hover:bg-[#e09873] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
                      aria-label="Send message"
                    >
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </button>
                  </div>
                </form>

              </div>
              
              {/* Footer text */}
              <p className="text-center text-[10px] text-gray-400 mt-3">
                Haribot may display inaccurate info, so please verify important details with the Registrar.
              </p>
            </div>

          </main>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(15px, -20px) scale(1.1); }
          66% { transform: translate(-15px, 10px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </>
  );
}