"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Lock, RefreshCw, KeyRound, ShieldAlert, Globe, UserCheck, Shield, CheckCircle2, UserPlus, ArrowRight, ShieldCheck, Mail, Phone, Building } from "lucide-react";
import { UserProfile } from "@/types";
import { useLanguage, AccessibilityBar } from "@/context/LanguageContext";

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"SIGN_IN" | "REGISTER">("SIGN_IN");

  // Sign In State
  const [badgeInput, setBadgeInput] = useState("TN-POL-4921");
  const [passwordInput, setPasswordInput] = useState("pass123");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // MFA Challenge State
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaSessionId, setMfaSessionId] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [demoOtp, setDemoOtp] = useState("123456");
  const [otpInput, setOtpInput] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  // Directory State
  const [directory, setDirectory] = useState<any[]>([]);
  const [stateFilter, setStateFilter] = useState("ALL");

  // Registration Form State (Pages 1 - 3)
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regOrganization, setRegOrganization] = useState("Tamil Nadu Police");
  const [regOrgId, setRegOrgId] = useState("ORG-TN-POL-01");
  const [regRole, setRegRole] = useState("INVESTIGATING_OFFICER");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [regErrorMsg, setRegErrorMsg] = useState<string | null>(null);

  // Registration OTP Verification
  const [verifyOtpModal, setVerifyOtpModal] = useState(false);
  const [regVerifyOtp, setRegVerifyOtp] = useState("");
  const [registeredUsername, setRegisteredUsername] = useState("");

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = () => {
    axios.get("http://localhost:8000/api/v1/auth/officers-list")
      .then(res => setDirectory(res.data))
      .catch(() => {});
  };

  const handleStartLogin = async (badge?: string) => {
    setAuthLoading(true);
    setAuthError(null);

    const b = (badge || badgeInput).trim();
    const p = passwordInput.trim() || "pass123";

    try {
      // Step 1: MFA Trigger
      const res = await axios.post("http://localhost:8000/api/v1/auth/mfa/step1", {
        username: b,
        password: p
      });

      if (res.data.mfaRequired) {
        setMfaSessionId(res.data.sessionId);
        setMaskedPhone(res.data.maskedMobile || "+91 •••••• 4921");
        setDemoOtp(res.data.demoOtp || "123456");
        setOtpInput(res.data.demoOtp || "123456");
        setMfaModalOpen(true);
      }
    } catch (err: any) {
      // Direct token fallback if MFA not returned or error
      if (err.response?.status === 403) {
        setAuthError(err.response?.data?.detail || "Account registration pending Administrator verification.");
      } else {
        handleDirectTokenLogin(b, p);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDirectTokenLogin = async (b: string, p: string) => {
    try {
      const params = new URLSearchParams();
      params.append("username", b);
      params.append("password", p);
      const res = await axios.post("http://localhost:8000/api/v1/auth/token", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      completeLogin(res.data);
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || "Authentication failed. Invalid official credentials.");
    }
  };

  const handleVerifyMfa = async () => {
    setMfaLoading(true);
    setAuthError(null);
    try {
      const res = await axios.post("http://localhost:8000/api/v1/auth/mfa/step2", {
        sessionId: mfaSessionId,
        otp: otpInput.trim()
      });
      setMfaModalOpen(false);
      completeLogin(res.data);
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || "MFA validation failed. Invalid OTP code.");
    } finally {
      setMfaLoading(false);
    }
  };

  const completeLogin = (data: any) => {
    const profile: UserProfile = {
      token: data.access_token,
      badgeNumber: data.badgeNumber,
      fullName: data.fullName,
      role: data.role,
      state: data.state,
      district: data.district,
      stationOrCourt: data.stationOrCourt,
      email: data.email,
      orgId: data.orgId,
      status: "ACTIVE"
    };
    localStorage.setItem("legal_dms_user", JSON.stringify(profile));
    onLoginSuccess(profile);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegErrorMsg(null);
    setRegSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setRegErrorMsg("Passwords do not match.");
      setRegLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/v1/auth/register", {
        fullName: regFullName,
        officialEmail: regEmail,
        mobileNumber: regMobile,
        username: regUsername,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        organization: regOrganization,
        organizationId: regOrgId,
        requestedRole: regRole
      });

      setRegisteredUsername(regUsername);
      setRegSuccessMsg(res.data.message);
      setRegVerifyOtp(res.data.demoOtp || "654321");
      setVerifyOtpModal(true);
      fetchDirectory();
    } catch (err: any) {
      setRegErrorMsg(err.response?.data?.detail || "Registration failed. Please check information.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    try {
      await axios.post("http://localhost:8000/api/v1/auth/verify-otp", {
        usernameOrEmail: registeredUsername,
        otp: regVerifyOtp
      });
      setVerifyOtpModal(false);
      setActiveTab("SIGN_IN");
      setAuthError("Registration submitted & contact verified! Account is now in PENDING_APPROVAL status. Login as Administrator (TN-ADM-0001) to verify affiliation and activate this account.");
    } catch (err: any) {
      setRegErrorMsg(err.response?.data?.detail || "OTP verification failed.");
    }
  };

  const filtered = stateFilter === "ALL" 
    ? directory 
    : directory.filter(o => o.state === stateFilter);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Tamil Nadu Police Portal Header Banner */}
      <header className="bg-[#684f9b] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs tracking-wider shadow-inner text-amber-300">
              <Lock className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {t("portal.title")}
              </h1>
              <p className="text-[11px] text-purple-200">
                {t("portal.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-purple-100">
            <span className="hidden sm:inline-block text-purple-200">{t("portal.helpline")}</span>
            <span className="hidden sm:inline-block text-purple-300">|</span>
            <AccessibilityBar />
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl">
          
          {/* Left Column: Sign In or Register Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab("SIGN_IN")}
                className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "SIGN_IN"
                    ? "border-[#684f9b] text-[#684f9b]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <KeyRound className="h-4 w-4" /> {t("login.signIn")}
              </button>
              <button
                onClick={() => setActiveTab("REGISTER")}
                className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "REGISTER"
                    ? "border-[#684f9b] text-[#684f9b]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus className="h-4 w-4" /> {t("login.register")}
              </button>
            </div>

            {/* TAB 1: SIGN IN */}
            {activeTab === "SIGN_IN" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#684f9b]" /> {t("login.terminalAuth")}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("login.terminalAuthDesc")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">{t("login.badgeLabel")}</label>
                    <input
                      type="text"
                      value={badgeInput}
                      onChange={(e) => setBadgeInput(e.target.value)}
                      placeholder="e.g. TN-POL-4921 or TN-ADM-0001"
                      className="w-full mt-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">{t("login.passwordLabel")}</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full mt-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none transition"
                    />
                  </div>

                  {authError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleStartLogin()}
                    disabled={authLoading}
                    className="w-full bg-[#684f9b] hover:bg-[#5a4287] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition text-sm shadow-md cursor-pointer"
                  >
                    {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    {t("login.submitMfa")}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: USER REGISTRATION (Pages 1 - 3) */}
            {activeTab === "REGISTER" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-[#684f9b]" /> {t("reg.title")}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Accounts enter <span className="font-semibold text-amber-700">PENDING_APPROVAL</span> until verified by an Administrator.
                  </p>
                </div>

                {/* Account Information Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-[#684f9b] uppercase tracking-wider">
                    {t("reg.sec1")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.fullName")}</label>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Sub-Insp. K. Suresh"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.email")}</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="k.suresh@tnpolice.gov.in"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.mobile")}</label>
                      <input
                        type="text"
                        required
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        placeholder="+91 94445 12345"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.username")}</label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="suresh_io"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">Password</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.confirmPassword")}</label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Information Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-[#684f9b] uppercase tracking-wider">
                    {t("reg.sec2")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.organization")}</label>
                      <select
                        value={regOrganization}
                        onChange={(e) => setRegOrganization(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      >
                        <option value="Tamil Nadu Police">Tamil Nadu Police</option>
                        <option value="State Forensic Science Laboratory (SFSL)">State Forensic Science Laboratory (SFSL)</option>
                        <option value="Directorate of Public Prosecutions">Directorate of Public Prosecutions</option>
                        <option value="Principal Sessions Court Registry">Principal Sessions Court Registry</option>
                        <option value="Law Department (Govt of TN)">Law Department (Govt of TN)</option>
                        <option value="National Cyber Audit Bureau (I4C)">National Cyber Audit Bureau (I4C)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.orgId")}</label>
                      <input
                        type="text"
                        required
                        value={regOrgId}
                        onChange={(e) => setRegOrgId(e.target.value)}
                        placeholder="ORG-TN-POL-01"
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700">{t("reg.requestedRole")}</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                      >
                        <option value="INVESTIGATING_OFFICER">Investigating Officer (IO)</option>
                        <option value="FORENSIC_EXAMINER">Forensic Examiner</option>
                        <option value="PUBLIC_PROSECUTOR">Public Prosecutor</option>
                        <option value="JUDICIAL_OFFICER">Judicial Magistrate / Court</option>
                        <option value="LEGAL_OFFICER">Legal Department Adviser</option>
                        <option value="SYSTEM_AUDITOR">System Security Auditor</option>
                      </select>
                    </div>
                  </div>
                </div>

                {regErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {regErrorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-[#684f9b] hover:bg-[#5a4287] text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition text-xs shadow-md cursor-pointer"
                >
                  {regLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {t("reg.submit")}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Stakeholder Directory (All 7 Roles) */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#684f9b]" /> {t("login.directoryTitle")}
              </h3>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-[11px] text-slate-700 px-2 py-1 rounded outline-none font-medium"
              >
                <option value="ALL">All States</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="New Delhi">New Delhi</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              {t("login.directoryDesc")}
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filtered.map((p) => (
                <button
                  key={p.badgeNumber}
                  onClick={() => {
                    setBadgeInput(p.badgeNumber);
                    handleStartLogin(p.badgeNumber);
                  }}
                  className="w-full text-left bg-slate-50 hover:bg-purple-50/80 border border-slate-200 hover:border-[#684f9b] p-2.5 rounded-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#684f9b] group-hover:text-[#5a4287]">
                      {p.role.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono font-semibold">
                      {p.badgeNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 mt-1 font-bold">{p.fullName}</p>
                  <p className="text-[10px] text-slate-500">{p.organization || p.stationOrCourt}, {p.district}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MFA OTP Verification Modal (Pages 3 - 4) */}
      {mfaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 rounded-full bg-purple-100 text-[#684f9b] flex items-center justify-center mx-auto mb-2">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Factor Authentication</h3>
              <p className="text-xs text-slate-500">
                A secure OTP has been dispatched to official terminal: <span className="font-semibold text-slate-800">{maskedPhone}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">Demonstration One-Time Password (OTP)</span>
              <span className="text-base font-mono font-bold text-[#684f9b] tracking-widest">{demoOtp}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Enter 6-Digit OTP</label>
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:border-[#684f9b] outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMfaModalOpen(false)}
                className="w-1/2 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyMfa}
                disabled={mfaLoading}
                className="w-1/2 py-2.5 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white transition flex items-center justify-center gap-1 shadow-sm"
              >
                {mfaLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Verify & Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Contact Verification OTP Modal (Page 3) */}
      {verifyOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verify Official Email / Mobile</h3>
              <p className="text-xs text-slate-500">
                Official contact verification code sent for user <span className="font-semibold text-slate-800">{registeredUsername}</span>
              </p>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-800 block font-medium">Auto-Generated Registration Code</span>
              <span className="text-base font-mono font-bold text-emerald-700 tracking-widest">{regVerifyOtp}</span>
            </div>

            <button
              onClick={handleVerifyRegistrationOtp}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition flex items-center justify-center gap-1 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Confirm Identity Verification
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
