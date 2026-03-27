"use client";

import { Moon, Sun, LayoutGrid, Building2, BookOpen, ClipboardList } from "lucide-react";
import { useTheme } from "next-themes";

const navItems = [
  { label: "Overview", icon: LayoutGrid },
  { label: "Registrar", icon: ClipboardList },
  { label: "Colleges", icon: Building2 },
  { label: "Programs", icon: BookOpen },
];

export default function DesktopSidebar() {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-white/85 dark:bg-[#18181b]/90 backdrop-blur-xl border-r border-gray-100 dark:border-white/10 z-30">
      <div className="px-6 py-6 border-b border-gray-100 dark:border-white/10">
        <h1 className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">University Portal</h1>
        <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400 mt-1">Office of the Registrar</p>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon }, index) => (
          <button
            key={label}
            type="button"
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              index === 0
                ? "bg-[#6e3102]/10 text-[#6e3102] dark:bg-[#d4855a]/20 dark:text-[#f0c0a5]"
                : "text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
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
