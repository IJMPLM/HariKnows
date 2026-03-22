"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  User,
  MessageCircle,
  BarChart2,
  HelpCircle,
} from "lucide-react";

const allLinks = [
  {
    href: "/home",
    label: "Home",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  { href: "/haribot",      label: "Talk with Hari",       icon: <MessageCircle size={16} /> },
  { href: "/transactions", label: "Transaction History",   icon: <BarChart2 size={16} /> },
  { href: "/faqs",         label: "FAQs",                  icon: <HelpCircle size={16} /> },
];

const recentChatsLink = {
  href: "/chats",
  label: "Recent Chats",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
};

export default function DesktopSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname(); // ← tracks current route

  useEffect(() => { setMounted(true); }, []);

  const linkClass = (href: string) => { 
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return isActive
      ? // Active state
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium \
         bg-[#6e3102]/10 dark:bg-white/5 \
         text-[#6e3102] dark:text-[#d4855a] \
         border border-[#6e3102]/20 dark:border-white/10"
      : // Inactive state
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium \
         text-gray-500 dark:text-gray-400 \
         hover:bg-gray-50 dark:hover:bg-white/[0.06] \
         hover:text-gray-900 dark:hover:text-white transition-all duration-150";
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64
                 bg-white/75 dark:bg-[#18181b]/90 backdrop-blur-xl
                 border-r border-gray-100 dark:border-white/[0.06] z-40"
    >
      {/* Brand */}
      <a
        href="/home"
        aria-label="HariKnows Home"
        className="flex items-center gap-3 px-6 py-6 font-bold text-xl
                   text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
          <Image
            src="/Hari_LOGO.png"
            alt="HariKnows logo"
            width={36}
            height={36}
            style={{ objectFit: "contain" }}
          />
        </div>
        HariKnows
      </a>

      {/* Primary nav */}
      <nav aria-label="Primary" className="flex-1 px-3 py-2 space-y-0.5">
        {allLinks.map((link) => (
          <a key={link.href} href={link.href} className={linkClass(link.href)}>
            {link.icon}
            {link.label}
          </a>
        ))}

        <div className="my-3 border-t border-gray-100 dark:border-white/[0.07]" />

        <a href={recentChatsLink.href} className={linkClass(recentChatsLink.href)}>
          {recentChatsLink.icon}
          {recentChatsLink.label}
        </a>
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-white/[0.07] space-y-0.5">
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-gray-500 dark:text-gray-400
                     hover:bg-gray-50 dark:hover:bg-white/[0.06]
                     hover:text-gray-900 dark:hover:text-white transition-all duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {mounted && theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        <a
          href="/account"
          className={linkClass("/account")}
        >
          <User size={16} />
          Account
        </a>
      </div>
    </aside>
  );
}