"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

interface CustomSelectProps {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  className?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown if the user clicks anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#101014] text-sm flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#6e3102]/40 dark:focus:ring-[#d4855a]/40 transition-all"
      >
        <span className="truncate block">{value}</span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 w-full mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 cursor-pointer transition-colors text-sm flex items-center ${
                value === option
                  ? "bg-gray-100 dark:bg-white/10 text-[#6e3102] dark:text-[#d4855a] font-bold"
                  : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}