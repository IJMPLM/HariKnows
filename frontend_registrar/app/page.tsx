import Link from "next/link";
import DesktopSidebar from "./components/DesktopSidebar";
import MobileSidebar from "./components/MobileSidebar";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-[color:var(--text)]">
      <DesktopSidebar />
      <MobileSidebar />
      <div className="lg:ml-64 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6 pb-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-extrabold mb-6">Welcome to the Registrar Portal</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-2xl">
          <Link href="/dashboard" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">Dashboard</span>
          </Link>
          <Link href="/registrar" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">Registrar</span>
          </Link>
          <Link href="/cistm" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">CISTM</span>
          </Link>
          <Link href="/cn" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">CN</span>
          </Link>
          <Link href="/ca" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">CA</span>
          </Link>
          <Link href="/nstp" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">NSTP Office</span>
          </Link>
          <Link href="/osds" className="block rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 text-center shadow hover:shadow-lg transition">
            <span className="text-lg font-semibold">OSD</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
