"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Lock, RefreshCw, KeyRound, ShieldAlert, Globe } from "lucide-react";
import { UserProfile } from "@/types";

interface LoginPageProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [badgeInput, setBadgeInput] = useState("TN-POL-4921");
  const [passwordInput, setPasswordInput] = useState("pass123");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [stateFilter, setStateFilter] = useState("ALL");

  useEffect(() => {
    axios.get("http://localhost:8000/api/v1/auth/officers-list")
      .then(res => setDirectory(res.data))
      .catch(() => {});
  }, []);

  const handleLogin = async (badge?: string) => {
    setAuthLoading(true);
    setAuthError(null);

    const b = (badge || badgeInput).trim();
    const p = passwordInput.trim() || "pass123";

    const params = new URLSearchParams();
    params.append("username", b);
    params.append("password", p);

    try {
      const res = await axios.post("http://localhost:8000/api/v1/auth/token", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const profile: UserProfile = {
        token: res.data.access_token,
        badgeNumber: res.data.badgeNumber,
        fullName: res.data.fullName,
        role: res.data.role,
        state: res.data.state,
        district: res.data.district,
        stationOrCourt: res.data.stationOrCourt
      };

      localStorage.setItem("legal_dms_user", JSON.stringify(profile));
      onLoginSuccess(profile);
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const filtered = stateFilter === "ALL" 
    ? directory 
    : directory.filter(o => o.state === stateFilter);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Tamil Nadu Police Portal Header Banner */}
      <header className="bg-[#684f9b] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs tracking-wider shadow-inner text-amber-300">
              <Lock className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Tamil Nadu Police • CCTNS Portal
              </h1>
              <p className="text-[11px] text-purple-200">
                National Legal DMS & Section 63 BSA Digital Evidentiary Gateway
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-purple-100">
            <span className="hover:underline cursor-pointer">Helpline: 112 / 100</span>
            <span className="text-purple-300">|</span>
            <span className="bg-white/15 px-2.5 py-0.5 rounded text-[11px] font-medium text-white border border-white/20">
              தமிழ் மொழி
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Form Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-[#684f9b] font-bold text-xl">
                <Lock className="h-6 w-6" /> Officer Authentication
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Enter your official badge credentials to access the judicial chain of custody ledger.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Badge / Officer ID</label>
                <input
                  type="text"
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  placeholder="e.g. TN-POL-4921"
                  className="w-full mt-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="pass123"
                  className="w-full mt-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none transition"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                onClick={() => handleLogin()}
                disabled={authLoading}
                className="w-full bg-[#684f9b] hover:bg-[#5a4287] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition text-sm shadow-md cursor-pointer"
              >
                {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Sign In to Role Dashboard
              </button>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-8 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#684f9b]" /> Fast-Login Stakeholder Directory
              </h3>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-[11px] text-slate-700 px-2.5 py-1 rounded outline-none font-medium"
              >
                <option value="ALL">All States</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="New Delhi">New Delhi</option>
              </select>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filtered.map((p) => (
                <button
                  key={p.badgeNumber}
                  onClick={() => {
                    setBadgeInput(p.badgeNumber);
                    handleLogin(p.badgeNumber);
                  }}
                  className="w-full text-left bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 p-2.5 rounded-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#684f9b] group-hover:text-[#5a4287]">{p.role}</span>
                    <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono font-medium">{p.badgeNumber}</span>
                  </div>
                  <p className="text-xs text-slate-900 mt-0.5 font-bold">{p.fullName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.stationOrCourt}, {p.district}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}