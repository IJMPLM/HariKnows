import DesktopSidebar from "../components/DesktopSidebar";
import MobileSidebar from "../components/MobileSidebar";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#121212] text-[#fafaf9]">
      <DesktopSidebar />
      <MobileSidebar />
      <main className="flex-1 ml-0 lg:ml-64 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}