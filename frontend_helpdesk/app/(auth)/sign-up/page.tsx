"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, UserCircle, Mail, BookOpen, GraduationCap, User, ChevronDown } from "lucide-react";

// data for dropdowns
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

// Mapping colleges to their specific programs
const PROGRAMS_BY_COLLEGE: Record<string, { value: string; label: string }[]> = {
  ca: [
    { value: "bsa", label: "BS in Accountancy (BSA)" },
  ],
  casbe: [
    { value: "bs_arch", label: "BS in Architecture (BS Arch)" },
  ],
  cba: [
    { value: "bsba_be", label: "BS in Business Administration Major in Business Economics (BSBA-BE)" },
    { value: "bsba_fm", label: "BS in Business Administration Major in Financial Management (BSBA-FM)" },
    { value: "bsba_hrm", label: "BS in Business Administration Major in Human Resource Management (BSBA-HRM)" },
    { value: "bsba_mm", label: "BS in Business Administration Major in Marketing Management (BSBA-MM)" },
    { value: "bsba_om", label: "BS in Business Administration Major in Operations Management (BSBA-OM)" },
    { value: "bs_entre", label: "BS in Entrepreneurship (BS Entrepreneurship)" },
    { value: "bs_rem", label: "BS in Real Estate Management (BS-REM)" },
    { value: "dba", label: "Doctor in Business Administration" },
    { value: "mba", label: "Master in Business Administration" },
  ],
  ced: [
    { value: "beced", label: "Bachelor of Early Childhood Education (BECED)" },
    { value: "beed", label: "Bachelor of Elementary Education (BEED)" },
    { value: "bped", label: "Bachelor of Physical Education (BPEd)" },
    { value: "bsed_eng", label: "Bachelor of Secondary Education Major in English (BSEd-Eng)" },
    { value: "bsed_fil", label: "Bachelor of Secondary Education Major in Filipino (BSEd-Fil)" },
    { value: "bsed_math", label: "Bachelor of Secondary Education Major in Mathematics (BSEd-Math)" },
    { value: "bsed_sci", label: "Bachelor of Secondary Education Major in Sciences (BSEd-Sci)" },
    { value: "bsed_ss", label: "Bachelor of Secondary Education Major in Social Studies (BSED-SS)" },
    { value: "bsned", label: "Bachelor of Special Needs Education (BSNED Generalist)" },
    { value: "ded_eml", label: "Doctor of Education Major in Educational Management and Leadership (EDD-EML or DEEML)" },
    { value: "masped", label: "Master Arts in Special Education with Specialization in Developmental Delays (MASPED, Non-Thesis)" },
    { value: "maed_bs", label: "Master of Arts in Education Major in Biological Science (MAED-BS or MAEBS)" },
    { value: "maed_chem", label: "Master of Arts in Education Major in Chemistry (MAEd-Chem or MAECHE)" },
    { value: "maed_eml", label: "Master of Arts in Education Major in Educational Management and Leadership (MAED-EML or MAEEML)" },
    { value: "maed_phy", label: "Master of Arts in Education Major in Physics (MAEd-Phy or MAEPHY)" },
    { value: "maed_ss", label: "Master of Arts in Education Major in Social Sciences (MAED-SS or MAESS)" },
    { value: "msmed", label: "Master of Science in Mathematics Education (MSMED)" },
  ],
  ce: [
    { value: "bsche", label: "BS in Chemical Engineering (BSCHE)" },
    { value: "bsce", label: "BS in Civil Engineering (BSCE)" },
    { value: "bsce_cm", label: "BS in Civil Engineering With Specialization in Construction Management (BSCE-CM)" },
    { value: "bsce_se", label: "BS in Civil Engineering With Specialization in Structural Engineering (BSCE-SE)" },
    { value: "bscpe", label: "BS in Computer Engineering (BSCPE)" },
    { value: "bsee", label: "BS in Electrical Engineering (BSEE)" },
    { value: "bsece", label: "BS in Electronics Engineering (BSECE)" },
    { value: "bsmfge", label: "BS in Manufacturing Engineering (BSMfgE)" },
    { value: "bsme", label: "BS in Mechanical Engineering (BSME)" },
  ],
  chass: [
    { value: "bac", label: "Bachelor of Arts in Communication (BAC)" },
    { value: "bac_pr", label: "Bachelor of Arts in Communication With Specialization in Public Relations (BAC-PR)" },
    { value: "bmmp", label: "Bachelor of Music in Music Performance (BMMP)" },
    { value: "bssw", label: "BS in Social Work (BSSW)" },
    { value: "mac_cm", label: "Master of Arts in Communication With Specialization in Communication (MAC-CM)" },
    { value: "msw", label: "Master of Social Work (MSW)" },
  ],
  cistm: [
    { value: "bscs", label: "BS in Computer Science (BSCS)" },
    { value: "bsit", label: "BS in Information Technology (BSIT)" },
  ],
  cl: [
    { value: "jd", label: "Juris Doctor (JD)" },
  ],
  cm: [
    { value: "md", label: "Doctor of Medicine Program (MD)" },
    { value: "emed", label: "Enhanced Medicine Program (eMED)" },
    { value: "mph", label: "Master of Public Health Program (MPH)" },
  ],
  cn: [
    { value: "bsn", label: "BS in Nursing (BSN)" },
    { value: "man", label: "Master of Arts in Nursing (MAN)" },
  ],
  cpt: [
    { value: "bspt", label: "BS in Physical Therapy (BSPT)" },
    { value: "mpt", label: "Master of Physical Therapy (MPT)" },
    { value: "mspt", label: "Master of Science in Physical Therapy (MSPT)" },
  ],
  cpa: [
    { value: "bpa", label: "Bachelor of Public Administration (BPA)" },
    { value: "dpa", label: "Doctor of Public Administration (DPA)" },
    { value: "mpa", label: "Master of Public Administration (MPA)" },
  ],
  cs: [
    { value: "bs_bio", label: "Bachelor of Science in Biology" },
    { value: "bs_bio_cmb", label: "Bachelor of Science in Biology Major in Cell And Molecular Biology (BS BIO-CMB)" },
    { value: "bs_bio_eco", label: "Bachelor of Science in Biology Major in Ecology (BS BIO-ECO)" },
    { value: "bs_bio_mb", label: "Bachelor of Science in Biology Major in Medical Biology (BS BIO-MB)" },
    { value: "bs_chem", label: "Bachelor of Science in Chemistry (BS Chem)" },
    { value: "bs_math", label: "Bachelor of Science in Mathematics (BS Math)" },
    { value: "bs_psych", label: "Bachelor of Science in Psychology (BS Psych)" },
    { value: "ma_psych_cp", label: "Master of Arts in Psychology With Specialization in Clinical Psychology (MA Psych-CP)" },
    { value: "ma_psych_ip", label: "Master of Arts in Psychology With Specialization in Clinical Psychology (MA Psych-IP)" },
  ],
  cthm: [
    { value: "bshm", label: "Bachelor of Science in Hospitality Management (BSHM)" },
    { value: "bstm", label: "Bachelor of Science in Tourism Management (BSTM)" },
  ],
  gsl: [
    { value: "llm", label: "Master of Laws (LL.M.)" },
  ],
};

export default function SignUpPage() {
  const router = useRouter();
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Dropdown states
  const [collegeOpen, setCollegeOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  
  // Form state
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
    // Strip non-numeric characters on the fly
    const numericValue = e.target.value.replace(/\D/g, "");
    if (numericValue.length <= 9) {
      setStudentNumber(numericValue);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom Validations
    if (!college) {
      alert("Please select your College.");
      return;
    }
    if (!program) {
      alert("Please select your Program / Course.");
      return;
    }
    if (studentNumber.length !== 9) {
      alert("Student number must be exactly 9 digits.");
      return;
    }
    if (!plmEmail.endsWith("@plm.edu.ph")) {
      alert("Please use a valid @plm.edu.ph email address.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("Signing up:", { firstName, lastName, studentNumber, plmEmail, college, program });
    // TODO: Add actual registration logic here
    router.push("/home");
  };

  // Derive the available programs based on the selected college
  const availablePrograms = college ? PROGRAMS_BY_COLLEGE[college] : [];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row w-full bg-stone-50 overflow-hidden">
      
    {/* LEFT SIDE/TOP PANEL */}
      <div className="relative w-full h-[30vh] lg:h-screen lg:w-1/2 flex items-center justify-center overflow-hidden rounded-b-[2rem] lg:rounded-b-none lg:rounded-r-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.15)] lg:shadow-[15px_0_40px_rgba(0,0,0,0.15)] z-10 shrink-0">
        <Image
          src="/school.png"
          alt="Pamantasan ng Lungsod ng Maynila Campus"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
          className="absolute inset-0 z-0"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#6e3102]/80 to-[#280d02]/95 mix-blend-multiply" />
        
        <div className="relative z-20 flex flex-col items-center justify-center text-center p-6 sm:p-12 text-white animate-fadeUp">
          <Image 
            src="/Hari_LOGO.png" 
            alt="HariKnows logo" 
            width={56}
            height={56} 
            className="object-contain mb-4 lg:mb-6 drop-shadow-xl lg:w-[80px] lg:h-[80px]" 
          />
          <h2 className="text-4xl xl:text-6xl font-extrabold tracking-tight mb-2 lg:mb-4 drop-shadow-md text-[#fdfbf9]">
            HariKnows
          </h2>
          <p className="text-white/90 text-xs xl:text-base font-medium max-w-sm lg:max-w-lg drop-shadow tracking-widest leading-relaxed">
            An AI-Integrated Online Registrar Helpdesk System <br className="hidden xl:block" />
            For The Pamantasan Ng Lungsod Ng Maynila
          </p>
        </div>
      </div>
      {/* RIGHT SIDE/BOTTOM PANEL */}
      <div className="w-full lg:w-[55%] flex flex-col relative min-h-full flex-1 h-[70vh] lg:h-screen overflow-y-auto custom-scrollbar">

        <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 lg:p-12 xl:p-16 w-full max-w-2xl mx-auto">
          <div className="w-full space-y-6 animate-fadeUp" style={{ animationDelay: "0.1s" }}>
            
            {/* Header */}
            <div className="text-center lg:text-left space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Create an Account
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                Join HariKnows to get started with your registrar needs.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5 mt-6 pb-6">
              
              {/* --- NAME ROW --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="firstName">First Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} 
                      placeholder="Juan" required minLength={3} maxLength={20} title="First name must be between 3 and 20 characters"
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="lastName">Last Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} 
                      placeholder="Dela Cruz" required minLength={3} maxLength={20} title="Last name must be between 3 and 20 characters"
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Middle Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700" htmlFor="middleName">Middle Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                  </div>
                  <input id="middleName" type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} 
                    placeholder="Santos" minLength={3} maxLength={20} title="Middle name must be between 3 and 20 characters"
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                </div>
              </div>

              {/* --- IDENTIFICATION ROW --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="studentNumber">Student Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserCircle className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input id="studentNumber" type="text" inputMode="numeric" value={studentNumber} onChange={handleStudentNumberChange} 
                      placeholder="e.g. 202312345" minLength={9} maxLength={9} pattern="\d{9}" title="Student number must be exactly 9 digits." required
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="plmEmail">PLM Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input id="plmEmail" type="email" value={plmEmail} onChange={(e) => setPlmEmail(e.target.value)} 
                      placeholder="user@plm.edu.ph" pattern=".*@plm\.edu\.ph$" title="Must be a valid @plm.edu.ph email address" required
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              {/* --- ACADEMICS ROW --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                {/* College Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" id="college-label">College</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <BookOpen className={`h-5 w-5 transition-colors ${collegeOpen ? 'text-[#6e3102]' : 'text-gray-400 group-hover:text-[#6e3102]'}`} />
                    </div>
                    <button
                      type="button"
                      aria-labelledby="college-label"
                      onClick={() => { setCollegeOpen(!collegeOpen); setProgramOpen(false); }}
                      onBlur={() => setTimeout(() => setCollegeOpen(false), 200)}
                      className={`relative block w-full text-left pl-11 pr-10 py-3 bg-white border rounded-2xl text-sm transition-all shadow-sm 
                        ${collegeOpen ? 'border-[#6e3102] ring-2 ring-[#6e3102]/20' : 'border-gray-200 hover:border-gray-300'} 
                        ${college ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                      <span className="block truncate">
                        {college ? COLLEGE_OPTIONS.find(c => c.value === college)?.label : "Select College"}
                      </span>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${collegeOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {collegeOpen && (
                      <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto py-1 custom-scrollbar">
                        {COLLEGE_OPTIONS.map((option) => (
                          <li
                            key={option.value}
                            onMouseDown={() => {
                              setCollege(option.value);
                              setProgram(""); // Reset the program selection when college changes
                              setCollegeOpen(false);
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer transition-colors
                              ${college === option.value ? 'bg-[#6e3102]/10 text-[#6e3102] font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-[#6e3102]'}`}
                          >
                            {option.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Program Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" id="program-label">Program / Course</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                      <GraduationCap className={`h-5 w-5 transition-colors ${programOpen ? 'text-[#6e3102]' : 'text-gray-400 group-hover:text-[#6e3102]'}`} />
                    </div>
                    <button
                      type="button"
                      aria-labelledby="program-label"
                      onClick={() => { 
                        if (college) setProgramOpen(!programOpen); 
                        setCollegeOpen(false); 
                      }}
                      onBlur={() => setTimeout(() => setProgramOpen(false), 200)}
                      disabled={!college} // Disable if no college is selected
                      className={`relative block w-full text-left pl-11 pr-10 py-3 bg-white border rounded-2xl text-sm transition-all shadow-sm 
                        ${!college ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}
                        ${programOpen ? 'border-[#6e3102] ring-2 ring-[#6e3102]/20' : 'border-gray-200 hover:border-gray-300'} 
                        ${program ? 'text-gray-900' : 'text-gray-500'}`}
                    >
                      <span className="block truncate">
                        {program 
                          ? availablePrograms.find(p => p.value === program)?.label 
                          : college ? "Select Program" : "Select a College first"}
                      </span>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${programOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {programOpen && availablePrograms.length > 0 && (
                      <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto py-1 custom-scrollbar">
                        {availablePrograms.map((option) => (
                          <li
                            key={option.value}
                            onMouseDown={() => {
                              setProgram(option.value);
                              setProgramOpen(false);
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer transition-colors
                              ${program === option.value ? 'bg-[#6e3102]/10 text-[#6e3102] font-semibold' : 'text-gray-700 hover:bg-gray-50 hover:text-[#6e3102]'}`}
                          >
                            {option.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>  
              </div>

              {/* --- PASSWORD ROW --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2 pb-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Create password" minLength={8} maxLength={64} title="Password must be between 8 and 64 characters" required
                      className="block w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#6e3102] transition-colors" />
                    </div>
                    <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Repeat password" minLength={8} maxLength={64} required
                      className="block w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-900 focus:ring-2 focus:ring-[#6e3102]/20 focus:border-[#6e3102] transition-all shadow-sm" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit"
                className="w-full flex justify-center py-4 px-4 mt-8
                         border border-transparent rounded-2xl shadow-lg
                         text-sm sm:text-base font-bold text-white 
                         bg-[#6e3102] hover:bg-[#5a2801] 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6e3102]
                         transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Create Account
              </button>

            </form>

            {/* Sign In Link */}
            <div className="pb-8 lg:pb-0 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/sign-in" className="font-bold text-[#6e3102] hover:text-[#5a2801] transition-colors">
                Sign in
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
        
        /* Custom styling for the scrollbars */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e5e7eb;  
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}