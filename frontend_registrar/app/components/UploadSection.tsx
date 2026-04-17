"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Upload, UploadCloud } from "lucide-react";

interface UploadSectionProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onSave: () => void;
  onClearSelection: () => void;
  onFlush: () => void;
  isSaving: boolean;
  isSaveLoading: boolean;
  isFlushLoading: boolean;
  message: string;
  error: string;
  incompleteByFile: Record<string, boolean>;
  onIncompleteChange: (fileName: string, checked: boolean) => void;
}

export default function UploadSection({
  files,
  onFilesSelected,
  onSave,
  onClearSelection,
  onFlush,
  isSaving,
  isSaveLoading,
  isFlushLoading,
  message,
  error,
  incompleteByFile,
  onIncompleteChange,
}: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFilePick = (list: FileList | null) => {
    if (!list) return;
    const accepted = Array.from(list).filter((f) => {
      const name = f.name.toLowerCase();
      return name.endsWith(".csv");
    });
    onFilesSelected(accepted);
  };

  return (
    <div className="px-8 py-7 space-y-5">
      <div
        className={`rounded-xl border-2 border-dashed p-5 transition-all ${isDragOver ? "border-[#6e3102] dark:border-[#e8834a] bg-[#f2e3d8] dark:bg-[#1f1713]" : "border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616]"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFilePick(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#6e3102] dark:text-[#e8834a]" />
              Drop CSV files here
            </p>
            <p className="text-xs text-gray-600 dark:text-[#aaaaaa] mt-1">Registrar data files now save in one step with automatic conflict merging. FAQ/context CSV files import into the registrar FAQ tab.</p>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <input
              id="bulk-csv"
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files)}
            />
            <label htmlFor="bulk-csv" className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-[#2a2a2a] dark:hover:bg-[#333] text-sm cursor-pointer text-gray-900 dark:text-white font-semibold whitespace-nowrap">
              Select files
            </label>
            <button
              onClick={onSave}
              disabled={isSaving || isSaveLoading || files.length === 0}
              className="px-4 py-2.5 rounded-xl bg-[#6e3102] hover:bg-[#5a2801] dark:bg-[#e8834a] dark:hover:bg-[#d97639] disabled:opacity-50 text-white dark:text-[#121212] text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              <Upload size={14} />
              {isSaving || isSaveLoading ? "Saving..." : "Confirm & Save"}
            </button>
            <button
              onClick={onClearSelection}
              className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-[#2a2a2a] dark:hover:bg-[#333] text-sm text-gray-900 dark:text-white font-semibold whitespace-nowrap"
            >
              Clear Selection
            </button>
            <button
              onClick={onFlush}
              disabled={isFlushLoading}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm font-semibold text-white whitespace-nowrap"
            >
              {isFlushLoading ? "Flushing..." : "Flush Database"}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-[#aaaaaa] mt-3">
          Selected: {files.length === 0 ? "none" : files.map((f) => f.name).join(", ")}
        </p>
        {files.length > 0 && (
          <div className="mt-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-gray-50 dark:bg-[#111] space-y-2">
            <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-[#aaaaaa]">Upload flags</p>
            {files.map((file) => (
              <label key={file.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-900 dark:text-[#ddd] truncate">{file.name}</span>
                <span className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-[#bbbbbb]">
                  <input
                    type="checkbox"
                    checked={Boolean(incompleteByFile[file.name])}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      onIncompleteChange(file.name, checked);
                    }}
                  />
                  Mark as incomplete
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
