"use client";

import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

export default function ManualPage() {
  return (
    <div className="relative h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed top-[-8%] right-[-6%] w-[420px] h-[420px] rounded-full bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[100px] z-0" />
      <div aria-hidden="true" className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[340px] h-[340px] rounded-full bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[80px] z-0" />

      <DesktopSidebar />
      <MobileSidebar />

      <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10 overflow-hidden pt-16 lg:pt-0">
        <main className="flex-1 overflow-y-auto w-full flex flex-col pt-4 lg:pt-7 items-center">
          <div className="w-full max-w-6xl px-6 lg:px-8 pb-20">

            {/* Page Header */}
            <div className="flex flex-col items-left text-left mt-4 lg:mt-10 mb-8">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-3">
                HariKnows User Manual
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-[1.05rem] max-w-2xl">
                Complete documentation for  student request tracking and account management.
              </p>
            </div>

            {/* PDF Viewer */}
            <div className="w-full h-[75vh] min-h-[500px] bg-white dark:bg-[#1c1c1f] rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden flex flex-col ring-1 ring-black/5">
              <div className="h-14 bg-neutral-900 flex items-center justify-between px-6 border-b border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm font-medium text-neutral-300">
                  HariKnows - User Manual.pdf
                </span>
                <a
                  href="/HariKnows - User Manual.pdf"
                  download
                  className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Download
                </a>
              </div>

              <iframe
                src="/HariKnows - User Manual.pdf#toolbar=0"
                className="w-full h-full border-none bg-neutral-100 dark:bg-neutral-800"
                title="HariKnows User Manual PDF Viewer"
                aria-label="PDF document displaying the HariKnows User Manual"
              />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
