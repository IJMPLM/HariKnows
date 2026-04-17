"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { signIn } from "../../../lib/auth-client";
import { useTheme } from "next-themes";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Hook into your global ThemeProvider
  const { resolvedTheme, setTheme } = useTheme();
  
  const [studentNo, setStudentNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent Next.js hydration mismatch errors
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setError("");
    const normalizedStudentNo = studentNo.trim();
    if (!normalizedStudentNo) {
      setError("Student number is required.");
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(normalizedStudentNo, password);
      router.push("/haribot");
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "Failed to sign in.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Default to dark mode
  const isDarkMode = !mounted ? true : resolvedTheme === "dark";

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden transition-colors duration-500 ${
      isDarkMode ? "bg-[#0d0a08]" : "bg-gray-50"
    }`}>

      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(isDarkMode ? "light" : "dark")}
          className={`absolute top-6 right-6 sm:top-8 sm:right-8 z-50 p-3 rounded-full backdrop-blur-md transition-all duration-300 border ${
            isDarkMode 
              ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/10" 
              : "bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900 border-gray-200 shadow-sm"
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      {/* Ambient glow blobs */}
      <div className="absolute top-[-120px] left-[-80px] w-[420px] h-[420px] rounded-full bg-[#c4622a]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[360px] h-[360px] rounded-full bg-[#9b4a1e]/12 blur-[90px] pointer-events-none" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden flex shadow-2xl animate-fadeUp"
        style={{ minHeight: "560px", border: "1px solid rgba(212,133,90,0.12)" }}
      >

        {/* LEFT — form panel */}
        <div
          className={`flex flex-col justify-center w-full md:w-[400px] xl:w-[440px] flex-shrink-0 px-8 sm:px-10 py-12 transition-colors duration-500 ${
            isDarkMode ? "bg-[#111009]" : "bg-white"
          }`}
        >

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden mb-2"
              style={{ background: "rgba(212,133,90,0.1)", border: "1px solid rgba(212,133,90,0.2)" }}
            >
              <Image src="/Hari_LOGO.png" alt="HariKnows" width={36} height={36} className="object-contain" />
            </div>
            <span className="text-[#d4855a]/80 text-[10px] font-bold tracking-[0.28em] uppercase">HariKnows</span>
          </div>

          {/* Heading */}
          <h1 className={`text-2xl font-extrabold text-center tracking-tight mb-1 transition-colors ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}>
            Welcome back!
          </h1>

          {/* Subtext */}
          <p className={`text-xs text-center mb-7 transition-colors ${
            isDarkMode ? "text-white/35" : "text-gray-500"
          }`}>
            Proceed as guest - {" "}
            <a href="/haribot" className="text-[#d4855a] font-semibold hover:text-[#e09873] transition-colors">
              Sign in later
            </a>
          </p>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-3">

            {/* Student Number */}
            <input
              id="studentNo"
              type="text"
              value={studentNo}
              onChange={(e) => setStudentNo(e.target.value)}
              placeholder="Student Number"
              required
              autoComplete="username"
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4855a]/40 transition-all duration-200 ${
                isDarkMode 
                  ? "text-white placeholder-white/25 bg-white/5 border-white/10" 
                  : "text-gray-900 placeholder-gray-400 bg-gray-50 border-gray-200"
              }`}
            />

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                minLength={1}
                maxLength={128}
                required
                className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4855a]/40 transition-all duration-200 ${
                  isDarkMode 
                    ? "text-white placeholder-white/25 bg-white/5 border-white/10" 
                    : "text-gray-900 placeholder-gray-400 bg-gray-50 border-gray-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${
                  isDarkMode ? "text-white/25 hover:text-white/55" : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white
                         active:scale-[0.98] transition-all duration-200 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #c4622a 0%, #d4855a 100%)",
                boxShadow: "0 4px 24px rgba(196,98,42,0.35)",
              }}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            {error ? (
              <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            ) : null}

          </form>

          {/* Divider */}
          <div className="flex items-center justify-center my-6">
            <p className={`text-[10px] leading-relaxed transition-colors ${
              isDarkMode ? "text-white/20" : "text-gray-400"
            }`}>
              Built by scholars, for scholars
            </p>
          </div>

        </div>

        {/* RIGHT — mascot panel */}
        <div
          className="hidden md:flex relative flex-1 flex-col items-center justify-end overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #2a1408 0%, #3d1c0a 40%, #5c2a10 75%, #7a3a18 100%)",
          }}
        >
          {/* Subtle radial glow behind mascot */}
          <div
            className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(212,133,90,0.18) 0%, transparent 70%)" }}
          />

          {/* Top-left branding */}
          <div className="absolute top-8 left-8 z-10">
            <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Your AI-powered<br />
              <span style={{ color: "#f0a070" }}>registrar helpdesk</span>
            </h2>
            <p className="text-white/40 mt-2 text-xs leading-relaxed max-w-[200px]">
              Ask Hari anything about enrollment, grades, and more.
            </p>
          </div>

          {/* Decorative dots */}
          <div className="absolute top-6 right-6 grid grid-cols-4 gap-1.5 opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#d4855a]" />
            ))}
          </div>

          {/* Mascot image */}
          <div className="absolute bottom-0 right-0 z-10 flex items-end justify-end">
            <Image
              src="/haribot_mascot.png"
              alt="Hari mascot"
              width={320}
              height={400}
              className="object-contain object-bottom select-none"
              style={{
                filter: "drop-shadow(0 -8px 32px rgba(196,98,42,0.35)) sepia(20%) saturate(120%) hue-rotate(-5deg)",
                maxHeight: "85%",
              }}
              priority
            />
          </div>

        </div>

      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp {
          animation: fadeUp 0.55s ease-out both;
        }
      `}</style>
    </div>
  );
}