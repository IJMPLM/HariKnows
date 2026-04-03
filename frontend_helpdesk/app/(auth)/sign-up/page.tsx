"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, UserCircle, Mail, BookOpen, GraduationCap, User, ChevronDown } from "lucide-react";

const COLLEGE_OPTIONS = [
  { value: "ca", label: "College of Accountancy" },
  { value: "casbe", label: "College Of Architecture And Sustainable Built Environment" },
  { value: "cba", label: "College Of Business Administration" },
  { value: "ced", label: "College Of Education" },
  { value: "ce", label: "College Of Engineering" },
  { value: "chass", label: "College Of Humanities, Arts And Social Sciences" },
  { value: "cistm", label: "College Of Information Systems And Technology Management" },
  { value: "cl", label: "College Of Law" },
  { value: "cm", label: "College of Medicine" },
  { value: "cn", label: "College Of Nursing" },
  { value: "cpt", label: "College Of Physical Therapy" },
  { value: "cpa", label: "College Of Public Administration" },
  { value: "cs", label: "College Of Science" },
  { value: "cthm", label: "College Of Tourism And Hospitality Management" },
  { value: "gsl", label: "Graduate School of Law" },
];

const PROGRAMS_BY_COLLEGE: Record<string, { value: string; label: string }[]> = {
  ca: [{ value: "bsa", label: "BS in Accountancy (BSA)" }],
  casbe: [{ value: "bs_arch", label: "BS in Architecture (BS Arch)" }],
  cba: [
    { value: "bsba_be", label: "BSBA – Business Economics" },
    { value: "bsba_fm", label: "BSBA – Financial Management" },
    { value: "bsba_hrm", label: "BSBA – Human Resource Management" },
    { value: "bsba_mm", label: "BSBA – Marketing Management" },
    { value: "bsba_om", label: "BSBA – Operations Management" },
    { value: "bs_entre", label: "BS in Entrepreneurship" },
    { value: "bs_rem", label: "BS in Real Estate Management" },
    { value: "dba", label: "Doctor in Business Administration" },
    { value: "mba", label: "Master in Business Administration" },
  ],
  ced: [
    { value: "beced", label: "Bachelor of Early Childhood Education (BECED)" },
    { value: "beed", label: "Bachelor of Elementary Education (BEED)" },
    { value: "bped", label: "Bachelor of Physical Education (BPEd)" },
    { value: "bsed_eng", label: "BSEd – English" },
    { value: "bsed_fil", label: "BSEd – Filipino" },
    { value: "bsed_math", label: "BSEd – Mathematics" },
    { value: "bsed_sci", label: "BSEd – Sciences" },
    { value: "bsed_ss", label: "BSEd – Social Studies" },
    { value: "bsned", label: "Bachelor of Special Needs Education" },
    { value: "ded_eml", label: "Doctor of Education – Educational Management" },
    { value: "masped", label: "Master Arts in Special Education" },
    { value: "maed_bs", label: "MAEd – Biological Science" },
    { value: "maed_chem", label: "MAEd – Chemistry" },
    { value: "maed_eml", label: "MAEd – Educational Management" },
    { value: "maed_phy", label: "MAEd – Physics" },
    { value: "maed_ss", label: "MAEd – Social Sciences" },
    { value: "msmed", label: "Master of Science in Mathematics Education" },
  ],
  ce: [
    { value: "bsche", label: "BS in Chemical Engineering (BSCHE)" },
    { value: "bsce", label: "BS in Civil Engineering (BSCE)" },
    { value: "bsce_cm", label: "BSCE – Construction Management" },
    { value: "bsce_se", label: "BSCE – Structural Engineering" },
    { value: "bscpe", label: "BS in Computer Engineering (BSCPE)" },
    { value: "bsee", label: "BS in Electrical Engineering (BSEE)" },
    { value: "bsece", label: "BS in Electronics Engineering (BSECE)" },
    { value: "bsmfge", label: "BS in Manufacturing Engineering (BSMfgE)" },
    { value: "bsme", label: "BS in Mechanical Engineering (BSME)" },
  ],
  chass: [
    { value: "bac", label: "BA in Communication (BAC)" },
    { value: "bac_pr", label: "BA in Communication – Public Relations" },
    { value: "bmmp", label: "Bachelor of Music in Music Performance" },
    { value: "bssw", label: "BS in Social Work (BSSW)" },
    { value: "mac_cm", label: "Master of Arts in Communication" },
    { value: "msw", label: "Master of Social Work (MSW)" },
  ],
  cistm: [
    { value: "bscs", label: "BS in Computer Science (BSCS)" },
    { value: "bsit", label: "BS in Information Technology (BSIT)" },
  ],
  cl: [{ value: "jd", label: "Juris Doctor (JD)" }],
  cm: [
    { value: "md", label: "Doctor of Medicine (MD)" },
    { value: "emed", label: "Enhanced Medicine Program (eMED)" },
    { value: "mph", label: "Master of Public Health (MPH)" },
  ],
  cn: [
    { value: "bsn", label: "BS in Nursing (BSN)" },
    { value: "man", label: "Master of Arts in Nursing (MAN)" },
  ],
  cpt: [
    { value: "bspt", label: "BS in Physical Therapy (BSPT)" },
    { value: "mpt", label: "Master of Physical Therapy (MPT)" },
    { value: "mspt", label: "Master of Science in Physical Therapy" },
  ],
  cpa: [
    { value: "bpa", label: "Bachelor of Public Administration (BPA)" },
    { value: "dpa", label: "Doctor of Public Administration (DPA)" },
    { value: "mpa", label: "Master of Public Administration (MPA)" },
  ],
  cs: [
    { value: "bs_bio", label: "BS in Biology" },
    { value: "bs_bio_cmb", label: "BS Biology – Cell And Molecular Biology" },
    { value: "bs_bio_eco", label: "BS Biology – Ecology" },
    { value: "bs_bio_mb", label: "BS Biology – Medical Biology" },
    { value: "bs_chem", label: "BS in Chemistry (BS Chem)" },
    { value: "bs_math", label: "BS in Mathematics (BS Math)" },
    { value: "bs_psych", label: "BS in Psychology (BS Psych)" },
    { value: "ma_psych_cp", label: "MA Psychology – Clinical Psychology" },
    { value: "ma_psych_ip", label: "MA Psychology – Industrial Psychology" },
  ],
  cthm: [
    { value: "bshm", label: "BS in Hospitality Management (BSHM)" },
    { value: "bstm", label: "BS in Tourism Management (BSTM)" },
  ],
  gsl: [{ value: "llm", label: "Master of Laws (LL.M.)" }],
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4855a]/40 transition-all duration-200";
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const labelCls = "text-[10px] font-bold text-white/35 uppercase tracking-wider mb-1 block";

export default function SignUpPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [plmEmail, setPlmEmail] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleStudentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    if (numericValue.length <= 9) setStudentNumber(numericValue);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!college) { alert("Please select your College."); return; }
    if (!program) { alert("Please select your Program / Course."); return; }
    if (studentNumber.length !== 9) { alert("Student number must be exactly 9 digits."); return; }
    if (!plmEmail.endsWith("@plm.edu.ph")) { alert("Please use a valid @plm.edu.ph email address."); return; }
    if (password !== confirmPassword) { alert("Passwords do not match!"); return; }
    console.log("Signing up:", { firstName, lastName, studentNumber, plmEmail, college, program });
    router.push("/home");
  };

  const availablePrograms = college ? PROGRAMS_BY_COLLEGE[college] : [];

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-[#0d0a08]">

      {/* Ambient glow blobs */}
      <div className="absolute top-[-120px] left-[-80px] w-[420px] h-[420px] rounded-full bg-[#c4622a]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[360px] h-[360px] rounded-full bg-[#9b4a1e]/12 blur-[90px] pointer-events-none" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden flex shadow-2xl animate-fadeUp"
        style={{ border: "1px solid rgba(212,133,90,0.12)", maxHeight: "92vh" }}
      >

        {/* LEFT — scrollable form panel */}
        <div
          className="flex flex-col w-full md:w-[400px] xl:w-[440px] flex-shrink-0 px-8 sm:px-10 py-10 overflow-y-auto custom-scrollbar"
          style={{ background: "#111009" }}
        >

          {/* Logo */}
          <div className="flex flex-col items-center mb-6 flex-shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden mb-2"
              style={{ background: "rgba(212,133,90,0.1)", border: "1px solid rgba(212,133,90,0.2)" }}
            >
              <Image src="/Hari_LOGO.png" alt="HariKnows" width={36} height={36} className="object-contain" />
            </div>
            <span className="text-[#d4855a]/60 text-[10px] font-bold tracking-[0.28em] uppercase">HariKnows</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-extrabold text-white text-center tracking-tight mb-1 flex-shrink-0">
            Create an account
          </h1>
          <p className="text-white/35 text-xs text-center mb-6 flex-shrink-0">
            Already have an account?{" "}
            <a href="/sign-in" className="text-[#d4855a] font-semibold hover:text-[#e09873] transition-colors">
              Sign in
            </a>
          </p>

          {/* Form */}
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">

            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="firstName">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-white/20" />
                  </div>
                  <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Juan" required minLength={3} maxLength={20}
                    className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="lastName">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-white/20" />
                  </div>
                  <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dela Cruz" required minLength={3} maxLength={20}
                    className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Middle Name */}
            <div>
              <label className={labelCls} htmlFor="middleName">
                Middle Name <span className="text-white/20 normal-case font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-white/20" />
                </div>
                <input id="middleName" type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Santos" minLength={3} maxLength={20}
                  className={`${inputCls} pl-9`} style={inputStyle} />
              </div>
            </div>

            {/* Student No. + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="studentNumber">Student No.</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-4 w-4 text-white/20" />
                  </div>
                  <input id="studentNumber" type="text" inputMode="numeric" value={studentNumber}
                    onChange={handleStudentNumberChange}
                    placeholder="202312345" minLength={9} maxLength={9} pattern="\d{9}" required
                    className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="plmEmail">PLM Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/20" />
                  </div>
                  <input id="plmEmail" type="email" value={plmEmail} onChange={(e) => setPlmEmail(e.target.value)}
                    placeholder="user@plm.edu.ph" pattern=".*@plm\.edu\.ph$" required
                    className={`${inputCls} pl-9`} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* College dropdown */}
            <div>
              <label className={labelCls} id="college-label">College</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <BookOpen className="h-4 w-4 text-white/20" />
                </div>
                <button
                  type="button"
                  aria-labelledby="college-label"
                  onClick={() => { setCollegeOpen(!collegeOpen); setProgramOpen(false); }}
                  onBlur={() => setTimeout(() => setCollegeOpen(false), 200)}
                  className="w-full text-left pl-9 pr-9 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d4855a]/40"
                  style={{ ...inputStyle, color: college ? "white" : "rgba(255,255,255,0.25)" }}
                >
                  <span className="block truncate">
                    {college ? COLLEGE_OPTIONS.find(c => c.value === college)?.label : "Select College"}
                  </span>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className={`h-4 w-4 text-white/25 transition-transform duration-200 ${collegeOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {collegeOpen && (
                  <ul className="absolute z-50 w-full mt-1.5 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-1 custom-scrollbar"
                    style={{ background: "#1c1409", border: "1px solid rgba(212,133,90,0.18)" }}>
                    {COLLEGE_OPTIONS.map((option) => (
                      <li key={option.value}
                        onMouseDown={() => { setCollege(option.value); setProgram(""); setCollegeOpen(false); }}
                        className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                        style={{ color: college === option.value ? "#d4855a" : "rgba(255,255,255,0.6)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,133,90,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Program dropdown */}
            <div>
              <label className={labelCls} id="program-label">Program / Course</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <GraduationCap className="h-4 w-4 text-white/20" />
                </div>
                <button
                  type="button"
                  aria-labelledby="program-label"
                  onClick={() => { if (college) setProgramOpen(!programOpen); setCollegeOpen(false); }}
                  onBlur={() => setTimeout(() => setProgramOpen(false), 200)}
                  disabled={!college}
                  className="w-full text-left pl-9 pr-9 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d4855a]/40 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ ...inputStyle, color: program ? "white" : "rgba(255,255,255,0.25)" }}
                >
                  <span className="block truncate">
                    {program
                      ? availablePrograms.find(p => p.value === program)?.label
                      : college ? "Select Program" : "Select a College first"}
                  </span>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className={`h-4 w-4 text-white/25 transition-transform duration-200 ${programOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {programOpen && availablePrograms.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1.5 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-1 custom-scrollbar"
                    style={{ background: "#1c1409", border: "1px solid rgba(212,133,90,0.18)" }}>
                    {availablePrograms.map((option) => (
                      <li key={option.value}
                        onMouseDown={() => { setProgram(option.value); setProgramOpen(false); }}
                        className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                        style={{ color: program === option.value ? "#d4855a" : "rgba(255,255,255,0.6)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,133,90,0.08)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="password">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/20" />
                  </div>
                  <input id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password" minLength={8} maxLength={64} required
                    className={`${inputCls} pl-9 pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/25 hover:text-white/55 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/20" />
                  </div>
                  <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password" minLength={8} maxLength={64} required
                    className={`${inputCls} pl-9 pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/25 hover:text-white/55 transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white mt-1 active:scale-[0.98] transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #c4622a 0%, #d4855a 100%)",
                boxShadow: "0 4px 24px rgba(196,98,42,0.35)",
              }}
            >
              Create Account
            </button>

          </form>

          {/* Footer */}
          <div className="flex items-center justify-center mt-6">
            <p className="text-center text-white/20 text-[10px]">Built by scholars, for scholars</p>
          </div>

        </div>

        {/* RIGHT — mascot panel */}
        <div
          className="hidden md:flex relative flex-1 flex-col items-center justify-end overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #2a1408 0%, #3d1c0a 40%, #5c2a10 75%, #7a3a18 100%)",
          }}
        >
          {/* Radial glow behind mascot */}
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

          {/* Mascot */}
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(212,133,90,0.2); border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(212,133,90,0.35); }
      `}</style>
    </div>
  );
}
