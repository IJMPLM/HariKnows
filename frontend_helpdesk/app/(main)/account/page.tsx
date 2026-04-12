"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  BookOpen,
  Building2,
  Hash,
  LogOut
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";
import { changePassword, getCurrentUser, signOut, type StudentProfile } from "../../../lib/auth-client";

export default function AccountPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showLogOutModal, setShowLogOutModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/sign-in");
        return;
      }

      setProfile(user);
      setLoadingProfile(false);
    };

    void init();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("All password fields are required.");
      setPasswordSuccess("");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      setPasswordSuccess("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      setPasswordSuccess("");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordSuccess("");
      setPasswordError(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen flex flex-col bg-stone-50 dark:bg-[#121212] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">

        {/* Ambient Blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed top-[-8%] right-[-6%] w-[420px] h-[420px] rounded-full
                      bg-[#6e3102]/15 dark:bg-[#6e3102]/20 blur-[100px] z-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-[5%] left-[-8%] w-[340px] h-[340px] rounded-full
                      bg-[#280d02]/15 dark:bg-[#d4855a]/10 blur-[80px] z-0"
        />

        {/* Sidebars */}
        <DesktopSidebar />
        <MobileSidebar />

        {/* Main Content Wrapper */}
        <div className="flex-1 lg:ml-64 flex flex-col h-full relative z-10 overflow-y-auto pt-16 lg:pt-0">

          {/* --- DESKTOP HEADER CONTROLS --- */}
          <header className="hidden lg:flex items-center justify-between px-8 pt-7 pb-2 flex-shrink-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white pt-7">
              Account Settings
            </h1>
          </header>

          {/* --- MAIN PAGE CONTENT --- */}
          <main className="flex-1 w-full max-w-4xl mx-auto px-5 lg:px-8 py-6 lg:py-8 flex flex-col gap-6">

            {/* Top Profile Card */}
            <section className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 animate-fade-in-up">

              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-[#6e3102]/20 to-[#280d02]/10 dark:from-[#d4855a]/20 dark:to-[#6e3102]/10 border-4 border-white dark:border-[#121212] flex items-center justify-center shadow-md">
                   <User size={40} className="text-[#6e3102] dark:text-[#d4855a] opacity-80" />
                </div>
              </div>

              {/* Name & Quick Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{loadingProfile ? "Loading profile..." : profile?.fullName ?? "Student"}</h2>
                <p className="text-[#6e3102] dark:text-[#d4855a] font-medium mt-1">Student No: {profile?.studentNo ?? "-"}</p>
              </div>
            </section>

            {/* Bottom Info Grid Card */}
            <section className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      defaultValue={profile?.fullName ?? ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 text-[0.95rem] text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Student Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Student Number</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      defaultValue={profile?.studentNo ?? ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 text-[0.95rem] text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* PLM Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      defaultValue={profile?.email ?? ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 text-[0.95rem] text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* College */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">College</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      defaultValue={profile?.collegeCode ?? ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 text-[0.95rem] text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Course */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Program / Course</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      defaultValue={profile?.programCode ?? ""}
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 text-[0.95rem] text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="md:col-span-2 border-t border-gray-200 dark:border-white/10 my-2" />

              </div>
            </section>

            {/* Log Out Card */}
            <section className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Use this to update the password tied to your current account. Password recovery is not available here.</p>
                <button
                  onClick={() => void handleChangePassword()}
                  disabled={changingPassword}
                  className="px-6 py-3 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-bold text-[0.95rem] hover:bg-[#5a2801] dark:hover:bg-[#e09873] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10"
                >
                  {changingPassword ? "Updating..." : "Change Password"}
                </button>
              </div>
              {passwordError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
                  {passwordSuccess}
                </div>
              )}
              <button
                onClick={() => setShowLogOutModal(true)}
                className="w-full px-8 py-3 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-bold text-[0.95rem] hover:bg-[#5a2801] dark:hover:bg-[#e09873] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10 flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </section>

            {/* Bottom Padding for mobile scrolling */}
            <div className="h-10 lg:h-0" />

          </main>
        </div>
      </div>

      {/* Log Out Confirmation Modal */}
      {showLogOutModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-lg max-w-md w-full animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Log Out</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogOutModal(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-[#2a2a2a] text-gray-900 dark:text-white font-bold text-[0.95rem] hover:bg-gray-300 dark:hover:bg-[#3a3a3a] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleLogout()}
                className="flex-1 px-4 py-3 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-bold text-[0.95rem] hover:bg-[#5a2801] dark:hover:bg-[#e09873] active:scale-[0.98] transition-all shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
