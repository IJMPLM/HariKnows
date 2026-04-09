"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, LayoutGrid, Building2, BookOpen, ClipboardList, FileText, MessageSquareQuote } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CollegeTab, getCachedRegistrarCollegeTabs, getRegistrarCollegeTabs } from "../../lib/registrar-client";

const baseNavItems = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Registrar", icon: ClipboardList, href: "/registrar" },
  { label: "NSTP Office", icon: BookOpen, href: "/nstp" },
  { label: "OSD", icon: BookOpen, href: "/osds" },
  { label: "FAQs & Context", icon: MessageSquareQuote, href: "/faq" },
  { label: "Documents", icon: FileText, href: "/document" },
];

export default function DesktopSidebar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [collegeTabs, setCollegeTabs] = useState<CollegeTab[]>(() => getCachedRegistrarCollegeTabs() ?? []);

  useEffect(() => {
    const loadTabs = async () => {
      try {
        const tabs = await getRegistrarCollegeTabs();
        setCollegeTabs((currentTabs) => {
          if (currentTabs.length === tabs.length && currentTabs.every((tab, index) => tab.href === tabs[index]?.href && tab.label === tabs[index]?.label)) {
            return currentTabs;
          }

          return tabs;
        });
      } catch {
        setCollegeTabs((currentTabs) => currentTabs);
      }
    };

    void loadTabs();
  }, []);

  const navItems = [
    ...baseNavItems.slice(0, 2),
    ...collegeTabs.map((tab) => ({ label: tab.label, icon: Building2, href: tab.href })),
    ...baseNavItems.slice(2)
  ];

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/85 dark:bg-[#18181b]/90 backdrop-blur-xl border-r border-gray-100 dark:border-white/10 z-30">
      <div className="px-6 py-6 border-b border-gray-100 dark:border-white/10">
        <h1 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">University Portal</h1>
        <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400 mt-1">Office of the Registrar</p>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#6e3102]/10 text-[#6e3102] dark:bg-[#d4855a]/20 dark:text-[#f0c0a5]"
                  : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 py-4 border-t border-gray-100 dark:border-white/10">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
