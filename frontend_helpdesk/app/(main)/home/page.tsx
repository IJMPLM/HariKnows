"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, BarChart2, HelpCircle, Sun, Moon, User, MoreHorizontal, ChevronRight } from "lucide-react";
import Image from "next/image";

const recentChats = [
  { id: 1, text: "Ako pa rin ba?", time: "2m ago" },
  { id: 2, text: "Nasa PLM ba si Tomboy Ice Scramble?", time: "1h ago" },
  { id: 3, text: "How to Factory Reset si bff?", time: "3h ago" },
  { id: 4, text: "Please head to your AIMs account bes", time: "Yesterday" },
];

export default function HomePage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #FBFBFB;
          --surface: rgba(255,255,255,0.55);
          --surface-hover: rgba(255,255,255,0.78);
          --border: rgba(163,68,68,0.10);   
          --border-strong: rgba(163,68,68,0.20);
          --text-primary: #1A0808;
          --text-secondary: #6B3030;
          --text-muted: #B08080;
          --accent: #A34444;
          --shadow: 0 4px 32px rgba(163,68,68,0.08), 0 1px 4px rgba(163,68,68,0.05);
          --shadow-card: 0 8px 32px rgba(163,68,68,0.10), 0 1px 2px rgba(163,68,68,0.06);
        }

        .dark-mode {
          --bg: #0C1015;
          --surface: rgba(255,255,255,0.05);
          --surface-hover: rgba(255,255,255,0.09);
          --border: rgba(255,255,255,0.07);
          --border-strong: rgba(255,255,255,0.14);
          --text-primary: #F5EDED;
          --text-secondary: #C99090;
          --text-muted: #7A5A5A;
          --accent: #D97373;
          --shadow: 0 4px 32px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.20);
          --shadow-card: 0 8px 40px rgba(0,0,0,0.40), 0 1px 2px rgba(0,0,0,0.25);
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--bg);
          color: var(--text-primary);
          transition: background 0.35s, color 0.35s;
        }

        /* ── SHELL: sidebar + main ── */
        .shell {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
          background: var(--bg);
          transition: background 0.35s;
          position: relative;
        }
        @media (min-width: 768px) {
          .shell { grid-template-columns: 220px 1fr; }
        }
        @media (min-width: 1280px) {
          .shell { grid-template-columns: 260px 1fr; }
        }

        /* ── BLOBS ── */
        .blob {
          position: fixed; border-radius: 50%;
          filter: blur(90px); opacity: 0.16;
          pointer-events: none; z-index: 0;
          transition: opacity 0.35s;
        }
        .blob-1 { width: 400px; height: 400px; background: #D97373; top: -120px; right: -100px; }
        .blob-2 { width: 320px; height: 320px; background: #A34444; bottom: 60px; left: -130px; }
        .dark-mode .blob { opacity: 0.22; }

        /* ── SIDEBAR (tablet / desktop only) ── */
        .sidebar {
          display: none;
          flex-direction: column;
          padding: 28px 16px;
          border-right: 1px solid var(--border);
          position: sticky; top: 0;
          height: 100vh; overflow-y: auto;
          z-index: 10;
        }
        @media (min-width: 768px) { .sidebar { display: flex; } }

        .sidebar-brand {
          display: flex; align-items: center; gap: 10px;
          font-weight: 800; font-size: 1.05rem;
          color: var(--text-primary); text-decoration: none;
          letter-spacing: -0.02em; margin-bottom: 32px;
        }
        .brand-icon {
          width: 36px; height: 36px;
          background: transparent; border-radius: 10px;
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .brand-icon svg { color: #FBFBFB; }

        .sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }

        .sidebar-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px; border-radius: 12px;
          font-size: 0.865rem; font-weight: 600;
          color: var(--text-secondary); text-decoration: none;
          transition: background 0.18s, color 0.18s;
          cursor: pointer; border: none; background: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          width: 100%; text-align: left;
        }
        .sidebar-link svg { color: var(--text-muted); flex-shrink: 0; transition: color 0.18s; }
        .sidebar-link:hover { background: var(--border); color: var(--text-primary); }
        .sidebar-link:hover svg { color: var(--accent); }
        .sidebar-link.active { background: var(--accent); color: #FBFBFB; }
        .sidebar-link.active svg { color: #FBFBFB; }
        .sidebar-link.active:hover svg { color: #FBFBFB; }

        .sidebar-divider { height: 1px; background: var(--border); margin: 12px 0; }

        .sidebar-bottom {
          display: flex; flex-direction: column; gap: 2px;
          margin-top: auto; padding-top: 14px;
          border-top: 1px solid var(--border);
        }

        /* ── MAIN AREA ── */
        .main-area {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          min-height: 100vh;
        }

        /* ── MOBILE TOP NAV ── */
        .topnav {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 18px 20px 10px;
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 768px) { .topnav { display: none; } }

        /* ── DESKTOP TOPBAR (icon buttons top-right) ── */
        .desktop-topbar {
          display: none;
          justify-content: flex-end;
          align-items: center; gap: 8px;
          padding: 20px 40px 0;
        }
        @media (min-width: 768px) { .desktop-topbar { display: flex; } }

        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          font-weight: 800; font-size: 1.1rem;
          color: var(--text-primary); text-decoration: none;
          letter-spacing: -0.02em;
        }
        .nav-actions { display: flex; align-items: center; gap: 8px; }

        .icon-btn {
          width: 38px; height: 38px;
          background: var(--surface);
          border: 1px solid var(--border); border-radius: 12px;
          display: grid; place-items: center; cursor: pointer;
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          color: var(--text-secondary);
        }
        .icon-btn:hover {
          background: var(--surface-hover);
          border-color: var(--border-strong);
          box-shadow: var(--shadow);
        }

        /* ── PAGE CONTENT ── */
        .page {
          padding: 28px 20px 64px;
          width: 100%;
          max-width: 860px;
        }
        @media (min-width: 768px)  { .page { padding: 28px 36px 64px; } }
        @media (min-width: 1280px) { .page { padding: 36px 56px 72px; max-width: 980px; } }

        /* ── HERO ── */
        .hero { padding-bottom: 28px; }
        .hero-greeting {
          font-size: clamp(2rem, 4.5vw, 3rem);
          font-weight: 900; color: var(--text-primary);
          line-height: 1.1; letter-spacing: -0.03em;
        }
        .hero-greeting span { color: var(--accent); transition: color 0.35s; }
        .hero-sub {
          font-size: 0.9rem; color: var(--text-muted);
          margin-top: 7px; font-weight: 500;
        }

        /* ── CARDS GRID ── */
        /* Mobile: 2-col, large card spans 2 rows */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .card-large { grid-row: 1 / 3; min-height: 230px; }

        /* Tablet: 3 equal columns, large card no longer spans */
        @media (min-width: 768px) {
          .cards-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
          .card-large { grid-row: auto; min-height: 200px; }
        }

        @media (min-width: 1280px) {
          .cards-grid { gap: 20px; }
          .card-large { min-height: 220px; }
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 20px;
          cursor: pointer;
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: var(--shadow-card);
          transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          justify-content: space-between;
        }
        .card:hover {
          background: var(--surface-hover);
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(163,68,68,0.16);
        }
        .dark-mode .card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.45); }

        .card-icon-wrap {
          width: 40px; height: 40px;
          background: var(--border);
          border: 1px solid var(--border-strong);
          border-radius: 12px; display: grid; place-items: center;
          color: var(--accent); transition: color 0.35s;
        }
        .card-body { margin-top: 14px; }
        .card-title {
          font-size: 1rem; font-weight: 800;
          color: var(--text-primary);
          line-height: 1.25; letter-spacing: -0.02em;
        }
        .card-sub {
          font-size: 0.78rem; color: var(--text-muted);
          margin-top: 4px; font-weight: 500;
        }
        .card-arrow {
          position: absolute; bottom: 16px; right: 16px;
          width: 28px; height: 28px;
          background: var(--accent); border-radius: 8px;
          display: grid; place-items: center;
          color: #FBFBFB; opacity: 0;
          transform: translateX(-6px);
          transition: opacity 0.2s, transform 0.2s, background 0.35s;
        }
        .card:hover .card-arrow { opacity: 1; transform: translateX(0); }

        /* ── RECENT CHATS ── */
        .section-header {
          display: flex; align-items: center;
          justify-content: space-between;
          margin: 36px 0 14px;
        }
        .section-title {
          font-size: 1.15rem; font-weight: 800;
          color: var(--text-primary); letter-spacing: -0.02em;
        }
        .see-all {
          font-size: 0.8rem; font-weight: 600;
          color: var(--accent); cursor: pointer;
          text-decoration: none;
          display: flex; align-items: center; gap: 2px;
          transition: opacity 0.2s, color 0.35s;
        }
        .see-all:hover { opacity: 0.65; }

        /* Chat list: 1 col mobile, 2 col tablet+ */
        .chat-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 768px) {
          .chat-list { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
        @media (min-width: 1280px) {
          .chat-list { gap: 12px; }
        }

        .chat-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px; padding: 13px 14px;
          display: flex; align-items: center; gap: 12px;
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: var(--shadow);
          transition: background 0.18s, border-color 0.18s, transform 0.18s;
          cursor: pointer; position: relative;
        }
        .chat-item:hover {
          background: var(--surface-hover);
          border-color: var(--border-strong);
          transform: translateX(3px);
        }

        .chat-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--border);
          border: 1px solid var(--border-strong);
          flex-shrink: 0; display: grid; place-items: center;
          color: var(--text-muted);
        }
        .chat-text { flex: 1; min-width: 0; }
        .chat-msg {
          font-size: 0.86rem; font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-time {
          font-size: 0.7rem; color: var(--text-muted);
          margin-top: 3px; font-weight: 500;
        }

        .chat-menu-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 4px;
          border-radius: 8px; display: grid; place-items: center;
          transition: background 0.15s, color 0.15s; position: relative;
        }
        .chat-menu-btn:hover { background: var(--border); color: var(--text-primary); }

        .dropdown {
          position: absolute; right: 0; top: 38px;
          background: var(--surface-hover);
          border: 1px solid var(--border-strong);
          border-radius: 14px; padding: 6px;
          z-index: 100;
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          box-shadow: var(--shadow-card); min-width: 130px;
        }
        .dropdown button {
          display: block; width: 100%;
          background: none; border: none;
          padding: 8px 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.82rem; font-weight: 600;
          color: var(--text-primary); cursor: pointer;
          border-radius: 8px; text-align: left;
          transition: background 0.15s;
        }
        .dropdown button:hover { background: var(--border); }
        .dropdown button.danger { color: #E05555; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .d1 { animation-delay: 0.04s; }
        .d2 { animation-delay: 0.10s; }
        .d3 { animation-delay: 0.16s; }
        .d4 { animation-delay: 0.22s; }
        .d5 { animation-delay: 0.28s; }
        .d6 { animation-delay: 0.34s; }
        .d7 { animation-delay: 0.40s; }
        .d8 { animation-delay: 0.46s; }
      `}</style>

      <div className={dark ? "dark-mode" : ""} onClick={() => setOpenMenu(null)}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />

        <div className="shell">

          {/* ── SIDEBAR ── */}
          <aside className="sidebar" aria-label="Sidebar navigation">
            <a href="/home" className="sidebar-brand" aria-label="HariKnows Home">
            <div className="brand-icon" aria-hidden="true">
            <Image src="/logo1.png" alt="HariKnows logo" width={40} height={30} style={{ objectFit: "contain" }} />
            </div>
              HariKnows!
            </a>

            <nav className="sidebar-nav" aria-label="Primary">
              <a href="/" className="sidebar-link active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Home
              </a>
              <a href="/haribot" className="sidebar-link">
                <MessageCircle size={16} />
                Talk with Hari
              </a>
              <a href="/transactions" className="sidebar-link">
                <BarChart2 size={16} />
                Transaction History
              </a>
              <a href="/faqs" className="sidebar-link">
                <HelpCircle size={16} />
                FAQs
              </a>
              <div className="sidebar-divider" />
              <a href="/chats" className="sidebar-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Recent Chats
              </a>
            </nav>

            <div className="sidebar-bottom">
              <button
                className="sidebar-link"
                onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? "Light Mode" : "Dark Mode"}
              </button>
              <a href="/account" className="sidebar-link">
                <User size={16} />
                Account
              </a>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="main-area" role="main">

            {/* Mobile top nav */}
            <nav className="topnav" aria-label="Main navigation">
              <a href="/" className="nav-brand" aria-label="HariKnows Home">
                <div className="brand-icon" aria-hidden="true">
                  <Image src="/logo1.png" alt="HariKnows logo" width={40} height={40} style={{ objectFit: "contain" }} />
                </div>
                HariKnows!
              </a>
              <div className="nav-actions">
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button className="icon-btn" aria-label="Account settings">
                  <User size={16} />
                </button>
              </div>
            </nav>

            {/* Tablet / desktop top-right */}
            <div className="desktop-topbar">
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button className="icon-btn" aria-label="Account settings">
                <User size={16} />
              </button>
            </div>

            <div className="page">

              {/* HERO */}
              <section className="hero fade-up d1" aria-labelledby="greeting">
                <h1 id="greeting" className="hero-greeting">
                  Hello, <span>Juan!</span>
                </h1>
                <p className="hero-sub">What would you like to explore today?</p>
              </section>

              {/* QUICK ACTIONS */}
              <section aria-label="Quick actions">
                <div className="cards-grid">

                  <article
                    className="card card-large fade-up d2"
                    role="button" tabIndex={0}
                    aria-label="Talk with Hari — Let's try it now"
                    onClick={() => router.push("/haribot")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/haribot")}
                  >
                    <div className="card-icon-wrap" aria-hidden="true"><MessageCircle size={20} /></div>
                    <div className="card-body">
                      <p className="card-title">Talk with Hari</p>
                      <p className="card-sub">Let's try it now</p>
                    </div>
                    <div className="card-arrow" aria-hidden="true"><ChevronRight size={14} /></div>
                  </article>

                  <article
                    className="card fade-up d3"
                    role="button" tabIndex={0}
                    aria-label="Transaction History"
                    onClick={() => router.push("/transactions")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/transactions")}
                  >
                    <div className="card-icon-wrap" aria-hidden="true"><BarChart2 size={20} /></div>
                    <div className="card-body">
                      <p className="card-title">Transaction History</p>
                      <p className="card-sub">View your transactions here</p>
                    </div>
                    <div className="card-arrow" aria-hidden="true"><ChevronRight size={14} /></div>
                  </article>

                  <article
                    className="card fade-up d4"
                    role="button" tabIndex={0}
                    aria-label="FAQs"
                    onClick={() => router.push("/FAQs")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/FAQs")}
                  >
                    <div className="card-icon-wrap" aria-hidden="true"><HelpCircle size={20} /></div>
                    <div className="card-body">
                      <p className="card-title">FAQs</p>
                      <p className="card-sub">Find answers to common questions</p>
                    </div>
                    <div className="card-arrow" aria-hidden="true"><ChevronRight size={14} /></div>
                  </article>

                </div>
              </section>

              {/* RECENT CHATS */}
              <section aria-labelledby="recent-chats-heading">
                <div className="section-header fade-up d5">
                  <h2 id="recent-chats-heading" className="section-title">Recent Chats</h2>
                  <a href="/chats" className="see-all" aria-label="See all recent chats">
                    See All <ChevronRight size={13} />
                  </a>
                </div>

                <ul className="chat-list" role="list">
                  {recentChats.map((chat, i) => (
                    <li
                      key={chat.id}
                      className={`chat-item fade-up d${i + 5}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="chat-avatar" aria-hidden="true"><User size={15} /></div>
                      <div className="chat-text">
                        <p className="chat-msg">{chat.text}</p>
                        <p className="chat-time">{chat.time}</p>
                      </div>
                      <div style={{ position: "relative" }}>
                        <button
                          className="chat-menu-btn"
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
                          <div className="dropdown" role="menu" onClick={(e) => e.stopPropagation()}>
                            <button role="menuitem">Open Chat</button>
                            <button role="menuitem">Copy Text</button>
                            <button role="menuitem" className="danger">Delete</button>
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
      </div>
    </>
  );
}