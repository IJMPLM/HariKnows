"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Send, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import DesktopSidebar from "../../components/DesktopSidebar"; 
import MobileSidebar from "../../components/MobileSidebar";
import { 
  sendChatMessage, 
  getChatHistory, 
  clearChatHistory, 
  type ChatMessage
} from "../../../lib/gemini-client";
import { initializeSession, type StudentProfile } from "../../../lib/auth-client";

const PAGE_SIZE = 20;
const GUEST_CONVERSATION_KEY = "hk.chat.conversation.guest";

type ParsedFaqReference = {
  id?: number;
  ref: string;
  title: string;
};

type ParsedChatMessage = {
  content: string;
  faqReferences: ParsedFaqReference[];
};

const FAQ_REFERENCE_TOKEN_REGEX = /\[\[FAQ_REF:([^|\]]+)\|([^\]]+)\]\]/gi;
const FAQ_MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/gi;

function parseChatMessageContent(rawContent: string): ParsedChatMessage {
  const referencesByKey = new Map<string, ParsedFaqReference>();

  const addReference = (refRaw: string | number, titleRaw: string, idOverride?: number) => {
    const rawRef = String(refRaw).trim();
    const title = titleRaw.trim();
    if (!rawRef || !title) {
      return;
    }

    const inferredId = Number(rawRef);
    const id = Number.isInteger(idOverride)
      ? idOverride
      : (Number.isInteger(inferredId) && inferredId > 0 ? inferredId : undefined);
    const dedupeKey = id ? `id:${id}` : `ref:${rawRef.toLowerCase()}|title:${title.toLowerCase()}`;

    if (!referencesByKey.has(dedupeKey)) {
      referencesByKey.set(dedupeKey, {
        id,
        ref: rawRef,
        title,
      });
    }
  };

  let cleaned = rawContent.replace(FAQ_REFERENCE_TOKEN_REGEX, (_, faqRef, faqTitle) => {
    addReference(faqRef, faqTitle);
    return "";
  });

  cleaned = cleaned.replace(FAQ_MARKDOWN_LINK_REGEX, (fullMatch, linkText, linkUrl) => {
    const faqIdMatch = linkUrl.match(/[?&]faqId=(\d+)/i);
    const faqRefMatch = linkUrl.match(/[?&]faqRef=([^&#]+)/i);
    const faqTitleMatch = linkUrl.match(/[?&]faqTitle=([^&#]+)/i);

    if (faqIdMatch) {
      const id = Number(faqIdMatch[1]);
      addReference(String(id), linkText, id);
      return "";
    }

    if (faqRefMatch || faqTitleMatch) {
      const rawRef = faqRefMatch?.[1] ?? faqTitleMatch?.[1] ?? "";
      const decodedRef = decodeURIComponent(rawRef.replace(/\+/g, " "));
      addReference(decodedRef, linkText);
      return "";
    }

    return fullMatch;
  });

  cleaned = cleaned
    .replace(/^\s*See related FAQ:\s*\.?\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    content: cleaned,
    faqReferences: Array.from(referencesByKey.values()),
  };
}

function getConversationStorageKey(studentNo: string) {
  return `hk.chat.conversation.${studentNo}`;
}

function formatTime(value: string) {
  const raw = value.trim();
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const normalized = hasExplicitTimezone ? raw : `${raw}Z`;

  return new Date(normalized).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

export default function HaribotPage() {
  const router = useRouter();
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<StudentProfile | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const tempMessageIdRef = useRef(1_000_000_000);
  const inFlightRef = useRef(false);
  const threadRef = useRef<HTMLDivElement | null>(null);

  // Load initial chat history
  const loadInitial = async (activeConversationId: string | null, user: StudentProfile | null) => {
    if (!activeConversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const history = await getChatHistory(activeConversationId, PAGE_SIZE);
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
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    });
    const guestUserMessageId = tempMessageIdRef.current++;
    if (!currentUser) {
      setMessages((previous) => {
        const nowIso = new Date().toISOString();
        return [
          ...previous,
          { id: guestUserMessageId, role: "user", content: trimmed, createdAt: nowIso },
        ];
      });
      setText("");
    }

    try {
      // Send message and get response
      const response = await sendChatMessage(trimmed, conversationId ?? undefined);

      if (!conversationId) {
        if (currentUser) {
          window.localStorage.setItem(getConversationStorageKey(currentUser.studentNo), response.conversationId);
        } else {
          window.localStorage.setItem(GUEST_CONVERSATION_KEY, response.conversationId);
        }
        setConversationId(response.conversationId);
      }
      
      // Guests do not have chat history access; keep their session local.
      let assistantId = response.message.id;
      if (currentUser) {
        const history = await getChatHistory(response.conversationId, PAGE_SIZE);
        setMessages(history);
        setText("");
      } else {
        assistantId = tempMessageIdRef.current++;
        setMessages((previous) => {
          const nowIso = new Date().toISOString();
          return [
            ...previous,
            { ...response.message, id: assistantId },
          ];
        });
      }

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
      if (!conversationId) {
        return;
      }

      if (!currentUser) {
        window.localStorage.removeItem(GUEST_CONVERSATION_KEY);
        setConversationId(null);
        setMessages([]);
        return;
      }

      await clearChatHistory(conversationId);
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
      alert("Failed to clear history. Please try again.");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const resolvedUser = await initializeSession();
      setCurrentUser(resolvedUser ?? null);
      
      // Check for conversation parameter in URL (from recent chats list)
      const queryConversation = typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("conversation");
      const activeConv = queryConversation;
      
      setConversationId(activeConv);
      await loadInitial(activeConv, resolvedUser ?? null);
    };

    void initialize();
  }, [router]);

  const isEmpty = messages.length === 0;
  const displayName = currentUser?.fullName?.split(" ")[0] || "there";

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

          // Line ~328 in your file
          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden relative">
            
            {/* NEW GRADIENT MASK */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#000000] to-transparent pointer-events-none z-10" />

            {isEmpty && !isLoading ? (
              /* EMPTY STATE */
              <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-32 animate-fade-in w-full">
                
                {/* Redesigned Banner Container */}
                <div className="w-full max-w-3xl bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col sm:flex-row items-center gap-8 sm:gap-12 relative overflow-hidden">
                  
                  {/* Mascot Core & Orb Container (Left) */}
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <div className="absolute w-40 h-40 bg-[#6e3102]/25 dark:bg-[#d4855a]/25 rounded-full blur-[35px] animate-pulse-slow"></div>
                    <div className="absolute w-32 h-32 bg-[#d4855a]/30 dark:bg-[#e09873]/15 rounded-full blur-[25px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
                    <div className="relative z-10">
                      <Image 
                        src="/Hari_HI2.gif" 
                        alt="Haribot Mascot" 
                        width={180}
                        height={180} 
                        className="w-44 h-44 object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>

                  {/* Greeting Text (Right) */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left z-10">
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3 text-gray-900 dark:text-gray-100">
                      Let's get started, <span className="text-[#6e3102] dark:text-[#d4855a]">{displayName}</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-[1.05rem] leading-relaxed">
                      I'm Hari! Your AI-powered registrar helpdesk assistant. Ask me about enrollment, document requests, or your processing status.
                    </p>  
                  </div>
                  
                </div>

              </div>
            ) : isLoading ? (
              /* LOADING STATE */
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#6e3102] dark:text-[#d4855a]" />
              </div>
            ) : (
              /* CHAT THREAD STATE */
              <div 
                className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-32 space-y-8 scroll-smooth z-0" 
                ref={threadRef}
              >
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const parsedMessage = isUser
                    ? { content: message.content, faqReferences: [] as ParsedFaqReference[] }
                    : parseChatMessageContent(message.content);

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
                            <Image 
                              src="/Hari_Bubble.png" 
                              alt="Haribot Mascot" 
                              width={35} 
                              height={35} 
                              className="object-contain" 
                            />
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full overflow-hidden`}>
                          <div 
                            className={`px-5 py-3.5 rounded-2xl border backdrop-blur-sm overflow-x-auto ${
                              isUser 
                                ? 'bg-[#6e3102]/80 dark:bg-[#d4855a]/80 border-[#6e3102]/40 dark:border-[#d4855a]/40 text-white dark:text-[#000000] rounded-tr-sm' 
                                : 'bg-gray-100/70 dark:bg-[#27272a]/70 border-gray-200/60 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                            }`}
                          >
                            {/* Rich text - React Markdown */}
                            <div className="flex flex-col gap-2 break-words text-[0.95rem] leading-relaxed">
                              <ReactMarkdown 
                                components={{
                                  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                  p: ({node, ...props}) => <p className="m-0" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 m-0 space-y-1" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 m-0 space-y-1" {...props} />,
                                  li: ({node, ...props}) => <li className="m-0" {...props} />,
                                  code: ({node, ...props}) => <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-[0.85em]" {...props} />
                                }}
                              >
                                {parsedMessage.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                          {!isUser && parsedMessage.faqReferences.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2 max-w-full">
                              {parsedMessage.faqReferences.map((reference) => (
                                <button
                                  key={`${message.id}-${reference.id ?? reference.ref}`}
                                  type="button"
                                  onClick={() => {
                                    if (reference.id) {
                                      router.push(`/FAQs?faqId=${reference.id}`);
                                      return;
                                    }

                                    const titleQuery = encodeURIComponent(reference.title);
                                    router.push(`/FAQs?faqTitle=${titleQuery}`);
                                  }}
                                  className="inline-flex items-center rounded-full border border-[#d4855a]/70 bg-[#fdf1ea] px-3 py-1 text-xs font-medium text-[#6e3102] transition-colors hover:bg-[#f8e4d7] dark:border-[#d4855a]/40 dark:bg-[#3b2518] dark:text-[#f3cdb5] dark:hover:bg-[#4a2d1d]"
                                  title="Open this FAQ"
                                >
                                  FAQ: {reference.title}
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {busy && (
                  <div className="flex w-full justify-start">
                    <div className="flex gap-4 max-w-[85%] sm:max-w-[75%] flex-row">
                      <div className="flex-shrink-0 mt-1">
                        <Image
                          src="/Hari_Bubble.png"
                          alt="Haribot Mascot"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-gray-100/70 dark:bg-[#27272a]/70 border border-gray-200/60 dark:border-white/10 backdrop-blur-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-dot" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-dot" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-dot" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
            <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-8 z-20">
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
        .animate-typing-dot {
          animation: typingDot 1.2s ease-in-out infinite;
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
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