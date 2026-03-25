"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User,
  Camera,
  Edit2,
  Mail,
  BookOpen,
  Building2,
  Lock,
  Hash
} from "lucide-react";
import DesktopSidebar from "../../components/DesktopSidebar";
import MobileSidebar from "../../components/MobileSidebar";

export default function AccountPage() {
  const router = useRouter();

  // Form state (mock data)
  const [isEditing, setIsEditing] = useState(false);
  
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
            <div className="flex items-center gap-1.5 mt-7">
            </div>
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
                <button className="absolute bottom-0 right-0 w-8 h-8 lg:w-9 lg:h-9 bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] rounded-full flex items-center justify-center border-2 border-white dark:border-[#18181b] hover:scale-105 transition-transform shadow-sm cursor-pointer">
                  <Camera size={14} />
                </button>
              </div>

              {/* Name & Quick Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Jana Del Rosario</h2>
                <p className="text-[#6e3102] dark:text-[#d4855a] font-medium mt-1">Student No: 2026-12345</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center justify-center md:justify-start gap-1.5">
                   <Building2 size={14} /> Pamantasan ng Lungsod ng Maynila
                </p>
              </div>

              {/* Desktop Edit Button */}
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Edit2 size={16} />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </section>

            {/* Bottom Info Grid Card */}
            <section className="bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h3>
                {/* Mobile Edit Button */}
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Edit2 size={12} />
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      defaultValue="Jana Del Rosario"
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-[0.95rem] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Student Number / Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Student Number (Username)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      defaultValue="2026-10940"
                      disabled // Usually unchangeable
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
                      defaultValue="delrosariojana9@gmail.com"
                      disabled // Usually unchangeable
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
                      defaultValue="College of Information Systems and Technology Management"
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-[0.95rem] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium"
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
                      defaultValue="Bachelor of Science in Computer Science"
                      disabled={!isEditing}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-white/10 text-[0.95rem] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#6e3102]/30 dark:focus:ring-[#d4855a]/30 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="md:col-span-2 border-t border-gray-200 dark:border-white/10 my-2" />

                {/* Password Section */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between ml-1 mb-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                    <button className="text-xs font-bold text-[#6e3102] dark:text-[#d4855a] hover:underline">Change Password</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="password" 
                      defaultValue="********"
                      disabled
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/5 text-[0.95rem] text-gray-600 dark:text-gray-400 outline-none cursor-not-allowed font-medium tracking-widest"
                    />
                  </div>
                </div>

              </div>

              {/* Action Button */}
              {isEditing && (
                <div className="mt-4 pt-2 border-t border-gray-100 dark:border-white/[0.05] animate-fade-in-up">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="w-full md:w-auto md:float-right px-8 py-3.5 rounded-xl bg-[#6e3102] dark:bg-[#d4855a] text-white dark:text-[#121212] font-bold text-[0.95rem] hover:bg-[#5a2801] dark:hover:bg-[#e09873] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-[#6e3102]/20 dark:shadow-[#d4855a]/10"
                  >
                    Save Changes
                  </button>
                </div>
              )}

            </section>
            
            {/* Bottom Padding for mobile scrolling */}
            <div className="h-10 lg:h-0" />

          </main>
        </div>
      </div>

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