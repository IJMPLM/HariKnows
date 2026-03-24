"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, UserCircle } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    console.log("Signing in with:", studentNumber);
    router.push("/home");
  };

  const handleStudentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip all non-numeric characters
    const numericValue = e.target.value.replace(/\D/g, "");
    
    // Only update state if it's 9 digits or less
    if (numericValue.length <= 9) {
      setStudentNumber(numericValue);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-stone-50 overflow-x-hidden">
      
      {/* LEFT SIDE/TOP PANEL */}
      <div className="relative w-full h-[40vh] lg:h-screen lg:w-1/2 flex items-center justify-center overflow-hidden rounded-b-[2rem] lg:rounded-b-none lg:rounded-r-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] lg:shadow-[15px_0_40px_rgba(0,0,0,0.15)] z-10">
        <Image
          src="/school.png"
          alt="Pamantasan ng Lungsod ng Maynila Campus"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
          className="absolute inset-0 z-0"
        />
        
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#6e3102]/80 to-[#280d02]/95 mix-blend-multiply" />
        
        {/* Central Branding Overlay */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-6 sm:p-12 lg:p-16 text-white animate-fadeUp">
          <Image 
            src="/Hari_LOGO.png" 
            alt="HariKnows logo" 
            width={64}
            height={64} 
            className="object-contain mb-6 lg:mb-8 drop-shadow-xl lg:w-[100px] lg:h-[100px]" 
          />
          <h2 className="text-4xl xl:text-6xl font-extrabold tracking-tight mb-3 lg:mb-4 drop-shadow-md text-[#fdfbf9]">
            HariKnows
          </h2>
          <p className="text-white/90 text-xs xl:text-base font-medium max-w-sm lg:max-w-lg drop-shadow uppercase tracking-widest leading-relaxed">
            An AI-Integrated Online Registrar Helpdesk System<br className="hidden xl:block" />
            For The Pamantasan Ng Lungsod Ng Maynila
          </p>
        </div>
      </div>

      {/* RIGHT SIDE/BOTTOM PANEL */}
      <div className="w-full lg:w-1/2 flex flex-col relative min-h-full flex-1">

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 lg:overflow-y-auto">
          <div className="w-full max-w-md space-y-8 animate-fadeUp" style={{ animationDelay: "0.1s" }}>
            
            {/* Header - Center on Mobile */}
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Welcome Back!
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                Please enter your student details to sign in.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-5 mt-8">
              
              {/* Student Number Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="studentNumber">
                  Student Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                  </div>
                  <input
                    id="studentNumber"
                    type="text"
                    inputMode="numeric"
                    value={studentNumber}
                    onChange={handleStudentNumberChange}
                    placeholder="e.g. 202312345"
                    maxLength={9}
                    title="Student number must be up to 9 digits long."
                    required
                    className="block w-full pl-11 pr-4 py-3.5 sm:py-4 
                             bg-white border border-gray-200 rounded-2xl 
                             text-sm sm:text-base text-gray-900 
                             focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102]
                             transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Password Container */}
              <div className="space-y-2.5">
                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="password">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      minLength={8}
                      maxLength={64}
                      title="Password must be between 8 and 64 characters."
                      required
                      className="block w-full pl-11 pr-12 py-3.5 sm:py-4 
                               bg-white border border-gray-200 rounded-2xl 
                               text-sm sm:text-base text-gray-900 
                               focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102]
                               transition-all duration-200 shadow-sm"
                    />
                    {/* Toggle Password Visibility */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex items-center justify-end px-1 pb-3">
                  <div className="text-sm">
                    <a href="/forgot-password" className="font-semibold text-[#6e3102] hover:text-[#5a2801] transition-colors">
                      Forgot Password?
                    </a>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 mt-8
                         border border-transparent rounded-2xl shadow-lg
                         text-sm sm:text-base font-bold text-white 
                         bg-[#6e3102] hover:bg-[#5a2801] 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6e3102]
                         transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Sign In
              </button>

            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center text-sm text-gray-600">
              Don't have an account yet?{" "}
              <a href="/sign-up" className="font-bold text-[#6e3102] hover:text-[#5a2801] transition-colors">
                Sign up
              </a>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp {
          animation: fadeUp 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
}