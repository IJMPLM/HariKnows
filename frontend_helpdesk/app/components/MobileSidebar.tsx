"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, User, MessageCircle, BarChart2, HelpCircle, Menu, X, LogIn } from "lucide-react";
import { getSignedInSnapshot, hasLocalSession, initializeSession, setSignedInSnapshot } from "../../lib/auth-client";

const signedInLinks = [
  { href: "/haribot",      label: "Talk with Hari",       icon: <MessageCircle size={16} /> },
  { href: "/transactions", label: "Transaction History",   icon: <BarChart2 size={16} /> },
  { href: "/FAQs",         label: "FAQs",                  icon: <HelpCircle size={16} /> },
];

const guestLinks = [
  { href: "/haribot", label: "Talk with Hari", icon: <MessageCircle size={16} /> },
  { href: "/FAQs", label: "FAQs", icon: <HelpCircle size={16} /> },
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

export default function MobileSidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(() => getSignedInSnapshot() ?? false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    const syncAuth = async () => {
      const user = await initializeSession();
      setSignedInSnapshot(Boolean(user));
      if (!cancelled) {
        setIsSignedIn(Boolean(user));
      }
    };

    void syncAuth();

    const onStorage = () => {
      const signedIn = hasLocalSession();
      setSignedInSnapshot(signedIn);
      setIsSignedIn(signedIn);
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const allLinks = isSignedIn ? signedInLinks : guestLinks;

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const linkClass = (href: string) => { 
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return isActive
      ? "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium \
         bg-[#6e3102]/10 dark:bg-white/5 \
         text-[#6e3102] dark:text-[#d4855a] \
         border border-[#6e3102]/20 dark:border-white/10"
      : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium \
         text-gray-500 dark:text-gray-400 \
         hover:bg-gray-50 dark:hover:bg-white/[0.06] \
         hover:text-gray-900 dark:hover:text-white transition-all duration-150";
  };

  return (
    <>
      {/* Mobile Header / Hamburger Trigger */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-30 flex items-center justify-between p-4 bg-white/75 dark:bg-[#18181b]/90 backdrop-blur-md border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3 font-bold text-lg text-gray-900 dark:text-white">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
            <Image src="/Hari_LOGO.png" alt="HariKnows logo" width={32} height={32} style={{ objectFit: "contain" }} />
          </div>
          HariKnows
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        aria-label="Mobile navigation"
        className={`fixed left-0 top-0 h-full w-64 flex flex-col z-50
                   bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl
                   border-r border-gray-100 dark:border-white/[0.06] 
                   transition-transform duration-300 ease-in-out lg:hidden
                   ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand & Close Button */}
        <div className="flex items-center justify-between px-6 py-6">
          <Link
            href="/home"
            className="flex items-center gap-3 font-bold text-xl text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
              <Image src="/Hari_LOGO.png" alt="HariKnows logo" width={36} height={36} style={{ objectFit: "contain" }} />
            </div>
            HariKnows
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Primary nav */}
        <nav aria-label="Primary" className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {allLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)} onClick={() => setIsOpen(false)}>
              {link.icon}
              {link.label}
            </Link>
          ))}

          <div className="my-3 border-t border-gray-100 dark:border-white/[0.07]" />

          {isSignedIn ? (
            <Link href={recentChatsLink.href} className={linkClass(recentChatsLink.href)} onClick={() => setIsOpen(false)}>
              {recentChatsLink.icon}
              {recentChatsLink.label}
            </Link>
          ) : null}
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

          <Link href={isSignedIn ? "/account" : "/sign-in"} className={linkClass(isSignedIn ? "/account" : "/sign-in")} onClick={() => setIsOpen(false)}>
            {isSignedIn ? <User size={16} /> : <LogIn size={16} />}
            {isSignedIn ? "Account" : "Sign In"}
          </Link>
        </div>
      </aside>
    </>
  );
}