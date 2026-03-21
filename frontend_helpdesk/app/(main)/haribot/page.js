"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";
const PAGE_SIZE = 20;

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function HelpdeskPage() {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const threadRef = useRef(null);

  const oldestId = useMemo(() => messages[0]?.id, [messages]);
  const latestId = useMemo(() => messages[messages.length - 1]?.id, [messages]);

  const fetchMessages = async (params = {}) => {
    const url = new URL(`${API_BASE}/api/helpdesk/messages`);
    url.searchParams.set("limit", String(PAGE_SIZE));

    if (params.beforeId) {
      url.searchParams.set("beforeId", String(params.beforeId));
    }

    if (params.afterId) {
      url.searchParams.set("afterId", String(params.afterId));
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Failed to load messages");
    }

    return response.json();
  };

  const loadInitial = async () => {
    const result = await fetchMessages();
    setMessages(result.messages);
    setHasMore(result.hasMore);
    requestAnimationFrame(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    });
  };

  const loadOlder = async () => {
    if (!oldestId || busy || !hasMore) {
      return;
    }

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
    if (!latestId) {
      return;
    }

    const result = await fetchMessages({ afterId: latestId });
    if (result.messages.length > 0) {
      setMessages((current) => [...current, ...result.messages]);
      requestAnimationFrame(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = text.trim();

    if (!trimmed || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/helpdesk/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "user",
          content: trimmed
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send");
      }

      const created = await response.json();
      setMessages((current) => [...current, created]);
      setText("");
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
    const timer = setInterval(() => {
      pollNew().catch(() => {
        // Keep the chat usable even if background polling fails.
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [latestId]);

  return (
    <main className="shell">
      <section className="chat-card">
        <header className="chat-header">
          <h1 className="chat-title">Registrar Helpdesk Chat</h1>
          <p className="chat-subtitle">Ask about enrollment, records, and student processing status.</p>
        </header>

        <div className="thread" ref={threadRef}>
          {hasMore ? (
            <button className="load-more" onClick={loadOlder} disabled={busy}>
              {busy ? "Loading..." : "Load older messages"}
            </button>
          ) : null}

          {messages.map((message) => (
            <article key={message.id} className={`msg ${message.sender === "user" ? "you" : "agent"}`}>
              <div className="bubble">
                <div>{message.content}</div>
                <div className="meta">{message.sender} • {formatTime(message.createdAt)}</div>
              </div>
            </article>
          ))}
        </div>

        <form className="composer" onSubmit={submit}>
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type your message"
            aria-label="Message"
          />
          <button type="submit" disabled={busy}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
