"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, LayoutGrid, Building2, BookOpen, ClipboardList, FileText, MessageSquareQuote, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CollegeTab, getCachedRegistrarCollegeTabs, getRegistrarCollegeTabs } from "../../lib/registrar-client";

const topNavItems = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Registrar", icon: ClipboardList, href: "/registrar" },
  { label: "FAQs & Context", icon: MessageSquareQuote, href: "/faq" },
  { label: "Questions", icon: HelpCircle, href: "/questions" },
  { label: "Accounts", icon: FileText, href: "/create" },
];

const officeItems = [
  { label: "NSTP Office", icon: BookOpen, href: "/nstp" },
  { label: "OSD", icon: BookOpen, href: "/osds" },
];

export default function DesktopSidebar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [collegeTabs, setCollegeTabs] = useState<CollegeTab[]>(() => getCachedRegistrarCollegeTabs() ?? []);
  
  // Initialize with the dropdown open if the user starts on an office or college route
  const [expandedSections, setExpandedSections] = useState({ 
    offices: officeItems.some(item => item.href === pathname), 
    colleges: pathname.startsWith('/ca') || pathname.startsWith('/cn') // Add your other college prefixes here if needed
  });

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

  // Removed the useEffect that was resetting the expandedSections on every pathname change!

  const toggleSection = (section: "offices" | "colleges") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isItemActive = (href: string) => pathname === href;

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/85 dark:bg-[#18181b]/90 backdrop-blur-xl border-r border-gray-100 dark:border-white/10 z-30">
      <div className="px-6 py-6 border-b border-gray-100 dark:border-white/10">
        <h1 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">University Portal</h1>
        <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400 mt-1">Office of the Registrar</p>
      </div>

      <nav className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
        {/* Top Level Items */}
        {topNavItems.map(({ label, icon: Icon, href }) => {
          const isActive = isItemActive(href);
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

        {/* Offices Section */}
        <div className="mt-4">
          <button
            onClick={() => toggleSection("offices")}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            {expandedSections.offices ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Offices
          </button>
          {expandedSections.offices && (
            <div className="mt-1 space-y-1 ml-2 pl-2 border-l border-gray-200 dark:border-white/10">
              {officeItems.map(({ label, icon: Icon, href }) => {
                const isActive = isItemActive(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#6e3102]/10 text-[#6e3102] dark:bg-[#d4855a]/20 dark:text-[#f0c0a5]"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Colleges Section */}
        <div className="mt-2">
          <button
            onClick={() => toggleSection("colleges")}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            {expandedSections.colleges ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Colleges
          </button>
          {expandedSections.colleges && (
            <div className="mt-1 space-y-1 ml-2 pl-2 border-l border-gray-200 dark:border-white/10">
              {collegeTabs.map(({ label, href }) => {
                const isActive = isItemActive(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#6e3102]/10 text-[#6e3102] dark:bg-[#d4855a]/20 dark:text-[#f0c0a5]"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10"
                    }`}
                  >
                    <Building2 size={16} />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
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