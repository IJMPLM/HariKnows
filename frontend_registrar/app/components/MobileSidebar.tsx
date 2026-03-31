"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X, LayoutGrid, Building2, BookOpen, ClipboardList } from "lucide-react";
import { useTheme } from "next-themes";

const navItems = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Registrar", icon: ClipboardList },
  { label: "CISTM", icon: Building2 },
  { label: "CN", icon: Building2 },
  { label: "CA", icon: Building2 },
  { label: "NSTP Office", icon: BookOpen },
  { label: "OSD", icon: BookOpen },
];

export default function MobileSidebar() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-[#18181b]/90 backdrop-blur border-b border-gray-100 dark:border-white/10">
        <div>
          <p className="font-bold text-sm text-gray-900 dark:text-white">University Portal</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">Office of the Registrar</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
          <Menu size={20} />
        </button>
      </div>

      {open && <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />}

      <aside className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#18181b] z-50 border-r border-gray-100 dark:border-white/10 transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-white/10">
          <p className="font-bold text-gray-900 dark:text-white">Registrar Navigation</p>
          <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={18} />
          </button>
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

        <div className="mt-auto px-3 py-4 border-t border-gray-100 dark:border-white/10 absolute bottom-0 left-0 right-0">
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
    </>
  );
}
