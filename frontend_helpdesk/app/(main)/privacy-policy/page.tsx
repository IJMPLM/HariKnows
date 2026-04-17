"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Clock, FileText, Users, CheckCircle2, XCircle, ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-[#d4855a]/30">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#d4855a]" />
            <span className="font-semibold text-gray-200 tracking-wide text-sm uppercase">Data & Privacy</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-12 animate-fade-in relative">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#d4855a]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Hero Section */}
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            HariKnows <span className="text-[#d4855a]">Privacy Policy</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Transparency is our priority. Here is how Haribot uses, protects, and manages your student data and registrar inquiries within the portal.
          </p>
        </div>

        {/* Masonry-style Grid for Policies */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* SECTION 1: Information Used (Spans 7 columns) */}
          <section className="md:col-span-7 bg-[#18181b] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#d4855a]/10 flex items-center justify-center border border-[#d4855a]/20">
                <CheckCircle2 className="w-6 h-6 text-[#d4855a]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Information Haribot Uses</h2>
            </div>
            <p className="text-gray-400 text-[0.95rem] leading-relaxed">
              To provide accurate registrar assistance, Haribot securely accesses specific parts of your student record:
            </p>
            <ul className="space-y-4 text-[0.95rem]">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4855a] mt-2 shrink-0" />
                <p className="text-gray-300"><strong className="text-gray-100 font-medium">Basic Profile & Enrollment:</strong> Your Name, Student ID, College, and active masterlist status.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4855a] mt-2 shrink-0" />
                <p className="text-gray-300"><strong className="text-gray-100 font-medium">Academic Standing:</strong> Presence of failing, dropped, or unresolved INC grades (used solely for general Latin Honor eligibility).</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4855a] mt-2 shrink-0" />
                <p className="text-gray-300"><strong className="text-gray-100 font-medium">Clearance Status:</strong> Good Moral status and Thesis/Capstone completion status.</p>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4855a] mt-2 shrink-0" />
                <p className="text-gray-300"><strong className="text-gray-100 font-medium">Document Tracking:</strong> Real-time status of your ongoing registrar requests.</p>
              </li>
            </ul>
          </section>

          {/* SECTION 5: Data Retention (Spans 5 columns) */}
          <section className="md:col-span-5 bg-[#18181b] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#d4855a]/10 flex items-center justify-center border border-[#d4855a]/20">
                <Clock className="w-6 h-6 text-[#d4855a]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Data Retention</h2>
            </div>
            <p className="text-gray-400 text-[0.95rem] leading-relaxed">
              To minimize data exposure and maintain system security, all Haribot conversation histories are automatically <span className="text-white font-medium">deleted every 1 month</span>. 
            </p>
            <div className="mt-auto pt-4 border-t border-white/5">
               <p className="text-xs text-gray-500">Please take note of any tracking numbers provided by the bot before your history is cleared.</p>
            </div>
          </section>

          {/* SECTION 2: Information NOT Disclosed (Full Width) */}
          <section className="md:col-span-12 bg-[#121212] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4855a]/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#d4855a]/10 flex items-center justify-center border border-[#d4855a]/20">
                <Lock className="w-6 h-6 text-[#d4855a]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-100">Strictly Restricted Information</h2>
                <p className="text-sm text-gray-400 mt-1">Haribot is blocked from accessing or displaying the following data.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#d4855a]" />
                  GWA & Specific Grades
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">Viewing exact Grades and General Weighted Average (GWA) is prohibited in the chat. You must request an official Certificate to view grades.</p>
              </div>
              <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#d4855a]" />
                  OSD Offense Details
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">Haribot only sees the presence of a record. Specific details or the nature of offenses must be discussed directly with the OSD.</p>
              </div>
              <div className="bg-[#18181b] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-medium text-gray-200 mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#d4855a]" />
                  Other Students
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">You cannot ask about the personal information, grades, or document status of other students. Access is isolated to your account.</p>
              </div>
            </div>
          </section>

          {/* SECTION 3: Access Levels (Spans 6 columns) */}
          <section className="md:col-span-6 bg-[#18181b] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#d4855a]/10 flex items-center justify-center border border-[#d4855a]/20">
                <Users className="w-6 h-6 text-[#d4855a]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Access Levels</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.02]">
                <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4855a]/10 text-[#d4855a] border border-[#d4855a]/20">STUDENT</div>
                <p className="text-sm text-gray-400"><strong className="text-gray-200">University Students</strong> have full access to inquire about records, requirements, and use tracking dashboards.</p>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.02]">
                <div className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4855a]/10 text-[#d4855a] border border-[#d4855a]/20">GRADUATE</div>
                <p className="text-sm text-gray-400"><strong className="text-gray-200">Guests</strong> may ask questions but cannot ask document transaction statuses via chatbot. Requests must be done manually.</p>
              </div>
            </div>
          </section>

          {/* SECTION 4: Document Validity (Spans 6 columns) */}
          <section className="md:col-span-6 bg-[#18181b] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 hover:border-white/10 transition-colors">
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#d4855a]/10 flex items-center justify-center border border-[#d4855a]/20">
                <FileText className="w-6 h-6 text-[#d4855a]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-100">Document Validity</h2>
            </div>
            <div className="flex-1 flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-[#d4855a]/10 to-transparent border border-[#d4855a]/10">
              <p className="text-sm text-gray-300 leading-relaxed text-center">
                All information regarding requirements for creating documents is provided directly in the chat. However, <span className="text-[#d4855a] font-semibold">none of the chat logs or provided info are valid for external use</span>. For employment or official transactions, you must secure certified documents from the Registrar.
              </p>
            </div>
          </section>

        </div>

        {/* Action Footer */}
        <div className="pt-8 flex justify-center">
          <Link 
            href="/" 
            className="group flex items-center gap-2 bg-[#d4855a] text-[#121212] px-8 py-3.5 rounded-full font-semibold hover:bg-[#e09873] transition-all hover:scale-105 active:scale-95"
          >
            Acknowledge & Return
            <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </main>
    </div>
  );
}