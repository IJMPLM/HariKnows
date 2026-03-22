"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  BarChart2,
  HelpCircle,
  Sun,
  Moon,
  User,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

const recentChats = [
  { id: 1, text: "Ako pa rin ba?", time: "2m ago" },
  { id: 2, text: "Nasa PLM ba si Tomboy Ice Scramble?", time: "1h ago" },
  { id: 3, text: "How to Factory Reset si bff?", time: "3h ago" },
  { id: 4, text: "Please head to your AIMs account bes", time: "Yesterday" },
];

const navLinks = [
  { href: "/haribot", icon: <MessageCircle size={16} />, label: "Talk with Hari" },
  { href: "/transactions", icon: <BarChart2 size={16} />, label: "Transaction History" },
  { href: "/faqs", icon: <HelpCircle size={16} />, label: "FAQs" },
];

export default function HomePage() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  return (
    // NOTE: Requires `darkMode: 'class'` in your tailwind.config.js
    <div className={dark ? "dark" : ""} onClick={() => setOpenMenu(null)}>
      <div className="relative min-h-screen bg-stone-50 dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 transition-colors duration-300">

        {/* ── Ambient gradient blobs ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-[-8%] right-[-6%] w-[420px] h-[420px] rounded-full
                     bg-rose-300/25 dark:bg-rose-900/20 blur-[100px] z-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[340px] h-[340px] rounded-full
                     bg-red-200/30 dark:bg-red-950/25 blur-[80px] z-0"
        />

        {/* ── Layout shell ── */}
        <div className="relative z-10 flex">

          {/* ══════════════════════ SIDEBAR (lg+) ══════════════════════ */}
          <aside
            aria-label="Sidebar navigation"
            className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64
                       bg-white/75 dark:bg-[#161616]/80 backdrop-blur-xl
                       border-r border-gray-100 dark:border-white/[0.05] z-40"
          >
            {/* Brand */}
            <a
              href="/home"
              aria-label="HariKnows Home"
              className="flex items-center gap-3 px-6 py-6 font-bold text-xl
                         text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            >
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-700
                            flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0"
              >
                <Image src="/logo1.png" alt="HariKnows logo" width={22} height={22} style={{ objectFit: "contain" }} />
              </div>
              HariKnows!
            </a>

            {/* Primary nav */}
            <nav aria-label="Primary" className="flex-1 px-3 py-2 space-y-0.5">
              {/* Home (active) */}
              <a
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           bg-gradient-to-r from-rose-500/10 to-transparent
                           text-rose-600 dark:text-rose-400
                           border border-rose-100/60 dark:border-rose-900/30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Home
              </a>

              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                             text-gray-500 dark:text-gray-400
                             hover:bg-gray-50 dark:hover:bg-white/[0.05]
                             hover:text-gray-900 dark:hover:text-white transition-all duration-150"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))}

              <div className="my-3 border-t border-gray-100 dark:border-white/[0.05]" />

              <a
                href="/chats"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           text-gray-500 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-white/[0.05]
                           hover:text-gray-900 dark:hover:text-white transition-all duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Recent Chats
              </a>
            </nav>

            {/* Bottom links */}
            <div className="px-3 py-4 border-t border-gray-100 dark:border-white/[0.05] space-y-0.5">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           text-gray-500 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-white/[0.05]
                           hover:text-gray-900 dark:hover:text-white transition-all duration-150"
                onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
                {dark ? "Light Mode" : "Dark Mode"}
              </button>
              <a
                href="/account"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                           text-gray-500 dark:text-gray-400
                           hover:bg-gray-50 dark:hover:bg-white/[0.05]
                           hover:text-gray-900 dark:hover:text-white transition-all duration-150"
              >
                <User size={16} />
                Account
              </a>
            </div>
          </aside>

          {/* ══════════════════════ MAIN AREA ══════════════════════ */}
          <main role="main" className="flex-1 lg:ml-64 min-h-screen flex flex-col">

            {/* Mobile top nav */}
            <nav
              aria-label="Main navigation"
              className="lg:hidden sticky top-0 z-30 flex items-center justify-between
                         px-5 py-3.5
                         bg-stone-50/90 dark:bg-[#0f0f0f]/90 backdrop-blur-xl
                         border-b border-gray-100 dark:border-white/[0.05]"
            >
              <a
                href="/"
                aria-label="HariKnows Home"
                className="flex items-center gap-2.5 font-bold text-lg text-gray-900 dark:text-white"
              >
                <div
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-700
                              flex items-center justify-center shadow-md shadow-red-500/20"
                >
                  <Image src="/logo1.png" alt="HariKnows logo" width={18} height={18} style={{ objectFit: "contain" }} />
                </div>
                HariKnows!
              </a>
              <div className="flex items-center gap-1.5">
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                             text-gray-500 dark:text-gray-400
                             hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }}
                  aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center
                             text-gray-500 dark:text-gray-400
                             hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  aria-label="Account settings"
                >
                  <User size={16} />
                </button>
              </div>
            </nav>

            {/* Desktop top-right controls */}
            <div className="hidden lg:flex items-center justify-end gap-1.5 px-8 pt-5">
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center
                           text-gray-400 dark:text-gray-500
                           hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); setDark((d) => !d); }}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                className="w-9 h-9 rounded-xl flex items-center justify-center
                           text-gray-400 dark:text-gray-500
                           hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Account settings"
              >
                <User size={16} />
              </button>
            </div>

            {/* ── Page content ── */}
            <div className="flex-1 px-5 py-7 lg:px-8 lg:py-6 max-w-3xl mx-auto w-full space-y-8">

              {/* ── HERO ── */}
              <section
                aria-labelledby="greeting"
                style={{ animation: "fadeUp 0.5s ease both" }}
              >
                <h1 id="greeting" className="text-[2.2rem] lg:text-5xl font-extrabold tracking-tight leading-tight">
                  Hello,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-red-500 to-rose-700">
                    Juan!
                  </span>
                </h1>
                <p className="mt-2 text-gray-400 dark:text-gray-500 text-[0.95rem]">
                  What would you like to explore today?
                </p>
              </section>

              {/* ── QUICK ACTIONS ── */}
              <section
                aria-label="Quick actions"
                style={{ animation: "fadeUp 0.5s 0.1s ease both", opacity: 0, animationFillMode: "forwards" }}
              >
                {/*
                  Mobile:  2-col grid, "Talk with Hari" spans 2 rows (tall left card)
                  Desktop: 3-col grid, all cards in a single row
                */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-[minmax(100px,auto)]">

                  {/* Talk with Hari — featured card */}
                  <article
                    className="row-span-2 lg:row-span-1 rounded-2xl p-5 cursor-pointer select-none
                               bg-gradient-to-br from-rose-500 via-red-600 to-rose-800
                               text-white shadow-lg shadow-red-500/20
                               hover:shadow-red-500/35 hover:scale-[1.02] active:scale-[0.98]
                               transition-all duration-200 flex flex-col justify-between"
                    role="button"
                    tabIndex={0}
                    aria-label="Talk with Hari — Let's try it now"
                    onClick={() => router.push("/haribot")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/haribot")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-base leading-snug">Talk with Hari</p>
                      <p className="text-white/65 text-xs mt-0.5">Let's try it now</p>
                    </div>
                  </article>

                  {/* Transaction History */}
                  <article
                    className="rounded-2xl p-4 cursor-pointer select-none
                               bg-white dark:bg-[#1a1a1a]
                               border border-gray-100 dark:border-white/[0.06]
                               hover:border-rose-200 dark:hover:border-rose-900/50
                               hover:scale-[1.02] active:scale-[0.98]
                               transition-all duration-200 shadow-sm hover:shadow-md
                               flex flex-col justify-between"
                    role="button"
                    tabIndex={0}
                    aria-label="Transaction History"
                    onClick={() => router.push("/transactions")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/transactions")}
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                      <BarChart2 size={18} className="text-rose-500 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug">
                        Transaction History
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5 hidden lg:block">View your transactions here</p>
                    </div>
                  </article>

                  {/* FAQs */}
                  <article
                    className="rounded-2xl p-4 cursor-pointer select-none
                               bg-white dark:bg-[#1a1a1a]
                               border border-gray-100 dark:border-white/[0.06]
                               hover:border-rose-200 dark:hover:border-rose-900/50
                               hover:scale-[1.02] active:scale-[0.98]
                               transition-all duration-200 shadow-sm hover:shadow-md
                               flex flex-col justify-between"
                    role="button"
                    tabIndex={0}
                    aria-label="FAQs"
                    onClick={() => router.push("/FAQs")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/FAQs")}
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
                      <HelpCircle size={18} className="text-rose-500 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-snug">FAQs</p>
                      <p className="text-gray-400 text-[11px] mt-0.5 hidden lg:block">Find answers to common questions</p>
                    </div>
                  </article>

                </div>
              </section>

              {/* ── RECENT CHATS ── */}
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
                    className="flex items-center gap-0.5 text-sm font-medium text-rose-500 dark:text-rose-400
                               hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
                  >
                    See All <ChevronRight size={14} />
                  </a>
                </div>

                <ul className="space-y-2.5" role="list">
                  {recentChats.map((chat) => (
                    <li
                      key={chat.id}
                      className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer
                                 bg-white dark:bg-[#1a1a1a]
                                 border border-gray-100 dark:border-white/[0.06]
                                 hover:border-rose-100 dark:hover:border-rose-900/40
                                 transition-all duration-150 shadow-sm hover:shadow-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-red-50
                                   dark:from-rose-950/50 dark:to-red-900/30
                                   flex items-center justify-center flex-shrink-0"
                      >
                        <User size={15} className="text-rose-400 dark:text-rose-500" />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {chat.text}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{chat.time}</p>
                      </div>

                      {/* Context menu */}
                      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                                     text-gray-300 dark:text-gray-600
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
                                       bg-white dark:bg-[#252525]
                                       rounded-xl border border-gray-100 dark:border-white/10
                                       shadow-xl shadow-black/10 dark:shadow-black/40 z-50"
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                                         hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                              role="menuitem"
                            >
                              Open Chat
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                                         hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
                              role="menuitem"
                            >
                              Copy Text
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm text-rose-500
                                         hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
      </div>

      {/*
        Keyframe animations.
        Move this to globals.css if you prefer not to inline styles:

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}