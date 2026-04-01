"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import { 
  Bot, 
  Send, 
  ChevronLeft, 
  Loader2, 
  MoreHorizontal,
  Image as ImageIcon,
  Sparkles,
  Paperclip,
  Trash2,
} from "lucide-react";

import DesktopSidebar from "../../components/DesktopSidebar"; 
import MobileSidebar from "../../components/MobileSidebar";
import { 
  sendChatMessage, 
  getChatHistory, 
  clearChatHistory, 
  type ChatMessage 
} from "../../../lib/gemini-client";

const PAGE_SIZE = 20;

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HaribotPage() {
  const router = useRouter();
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inFlightRef = useRef(false);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const [conversationId] = useState(() => `haribot-${Date.now()}`);

  // Load initial chat history
  const loadInitial = async () => {
    try {
      setIsLoading(true);
      const history = await getChatHistory(conversationId, PAGE_SIZE);
      setMessages(history);
      requestAnimationFrame(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
      });
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submit = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmed = text.trim();
    
    if (!trimmed || busy || inFlightRef.current) return;

    inFlightRef.current = true;
    setBusy(true);
    try {
      // Send message and get response
      const response = await sendChatMessage(trimmed, conversationId);
      
      // Reload chat history to display both user and assistant messages
      const history = await getChatHistory(conversationId, PAGE_SIZE);
      setMessages(history);
      setText("");
      
      requestAnimationFrame(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setBusy(false);
      inFlightRef.current = false;
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the chat history?")) {
      return;
    }

    try {
      await clearChatHistory(conversationId);
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
      alert("Failed to clear history. Please try again.");
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <>
      <div className="relative h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">
        
        {/* Background Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#6e3102]/5 dark:bg-[#6e3102]/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#d4855a]/5 dark:bg-[#d4855a]/5 blur-[100px]" />
        </div>

        {/* Sidebars */}
        <DesktopSidebar />
        <MobileSidebar />

        <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10 pt-16 lg:pt-0">

          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden relative">
            
            {isEmpty && !isLoading ? (
              /* EMPTY STATE */
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 animate-fade-in">
                
                {/* Mascot Core & Orb Container */}
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute w-32 h-32 bg-[#6e3102]/25 dark:bg-[#d4855a]/25 rounded-full blur-[35px] animate-pulse-slow"></div>
                  <div className="absolute w-24 h-24 bg-[#d4855a]/30 dark:bg-[#e09873]/15 rounded-full blur-[25px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
                  <div className="relative z-10 w-20 h-20 bg-white dark:bg-[#18181b] rounded-full shadow-2xl flex items-center justify-center border border-white/50 dark:border-white/10 overflow-hidden p-0">
                    <Image 
                      src="/Hari_LOGO.png" 
                      alt="Haribot Logo" 
                      width={120}
                      height={120} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Greeting */}
                <h1 className="text-3xl sm:text-4xl font-semibold text-center tracking-tight mb-2">
                  Good Day, <span className="text-[#6e3102] dark:text-[#d4855a]">Jana</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-center">
                  I'm your registrar helpdesk assistant. Ask me about enrollment, document requests, or your processing status.
                </p>  
              </div>
            ) : isLoading ? (
              /* LOADING STATE */
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#6e3102] dark:text-[#d4855a]" />
              </div>
            ) : (
              /* CHAT THREAD STATE */
              <div 
                className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-32 space-y-8 scroll-smooth" 
                ref={threadRef}
              >
                {messages.map((message) => {
                  const isUser = message.role === "user";

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
                            <div className="relative w-8 h-8 rounded-full bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-md overflow-hidden">
                              <Image 
                                src="/Hari_LOGO.png" 
                                alt="Haribot Avatar" 
                                width={24} 
                                height={24} 
                                className="object-contain" 
                              />
                            </div>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`px-5 py-3.5 rounded-2xl text-[0.95rem] leading-relaxed whitespace-pre-wrap ${
                              isUser 
                                ? 'bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] rounded-tr-sm' 
                                : 'bg-gray-100 dark:bg-[#27272a] text-gray-800 dark:text-gray-200 rounded-tl-sm'
                            }`}
                          >
                            {message.content}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {messages.length > 0 && (
                  <div className="flex justify-center">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
                      onClick={handleClearHistory}
                    >
                      <Trash2 size={14} />
                      Clear History
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FLOATING COMPOSER */}
            <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-8">
              <div className="w-full bg-white dark:bg-[#18181b] p-2 pl-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-gray-100 dark:border-white/10 flex items-center gap-2">
                <form onSubmit={submit} className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Ask Haribot..."
                    disabled={busy || isLoading}
                    className="w-full bg-transparent border-none text-gray-900 dark:text-gray-100 px-2 py-3 focus:outline-none focus:ring-0 text-[0.95rem] disabled:opacity-50"
                    aria-label="Message"
                  />
                  
                  <div className="flex items-center gap-2 pr-1">
                    <button 
                      type="submit" 
                      disabled={busy || isLoading || !text.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] hover:bg-[#5a2801] dark:hover:bg-[#e09873] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex-shrink-0"
                      aria-label="Send message"
                    >
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                    </button>
                  </div>
                </form>

              </div>
              
              {/* Footer text */}
              <p className="text-center text-[11px] text-gray-400 mt-3">
                Haribot provides general guidance. Please verify official details directly with the Registrar. <a href="/privacy-policy" className="underline hover:no-underline text-[#6e3102] dark:text-[#d4855a]">Privacy Policy</a>
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