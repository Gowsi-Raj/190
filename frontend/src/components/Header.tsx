"use client";

import React from "react";
import { Lock, LogOut, FileText, Building, Microscope, Briefcase, Gavel, Database, Home, Shield, User } from "lucide-react";
import { UserProfile } from "@/types";

interface HeaderProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  const getRoleIcon = () => {
    switch (currentUser.role) {
      case "INVESTIGATING_OFFICER": return <FileText className="h-4 w-4 text-[#684f9b]" />;
      case "STATION_HOUSE_OFFICER": return <Building className="h-4 w-4 text-[#684f9b]" />;
      case "FORENSIC_EXAMINER": return <Microscope className="h-4 w-4 text-emerald-600" />;
      case "PUBLIC_PROSECUTOR": return <Briefcase className="h-4 w-4 text-amber-600" />;
      case "JUDICIAL_OFFICER": return <Gavel className="h-4 w-4 text-purple-600" />;
      case "SYSTEM_AUDITOR": return <Database className="h-4 w-4 text-blue-600" />;
      default: return <Lock className="h-4 w-4 text-[#684f9b]" />;
    }
  };

  const getRoleTitle = () => {
    switch (currentUser.role) {
      case "INVESTIGATING_OFFICER": return "Investigating Officer (IO) Workstation";
      case "STATION_HOUSE_OFFICER": return "Station House Officer (SHO) Command Center";
      case "FORENSIC_EXAMINER": return "Forensic Science Evidence Lab (SFSL)";
      case "PUBLIC_PROSECUTOR": return "Public Prosecution Trial Briefing Suite";
      case "JUDICIAL_OFFICER": return "Judicial Magistrate / Sessions Bench";
      case "SYSTEM_AUDITOR": return "System Security & Compliance Audit Log";
      default: return "Legal DMS Workstation";
    }
  };

  return (
    <header className="rounded-xl overflow-hidden shadow-sm border border-slate-200 mb-6">
      {/* Top Banner (Tamil Nadu Police Purple) */}
      <div className="bg-[#684f9b] text-white px-5 py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs tracking-wider shadow-inner text-amber-300">
            <Shield className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Tamil Nadu Police
            </h1>
            <p className="text-[11px] text-purple-200">
              Crime and Criminal Tracking Network & Systems (CCTNS) • Section 63 BSA Digital Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs text-purple-100">
          <span className="hidden lg:inline-block text-purple-200">Helpline: 112 / 100</span>
          <span className="hidden lg:inline-block text-purple-300">|</span>
          <span className="bg-white/15 px-2.5 py-1 rounded text-[11px] font-medium text-white border border-white/20">
            தமிழ் மொழி
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] text-purple-200">A A+ A++</span>
          
          <div className="flex items-center gap-2 bg-black/20 border border-white/10 px-3 py-1 rounded-lg">
            <User className="h-4 w-4 text-purple-200" />
            <div className="text-left leading-tight">
              <span className="text-[11px] font-semibold text-white block">{currentUser.fullName}</span>
              <span className="text-[9px] text-purple-200 font-mono">{currentUser.badgeNumber}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="bg-white/10 hover:bg-red-500/80 border border-white/20 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="bg-white px-5 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="p-1.5 bg-purple-50 border border-purple-200 rounded-lg">
            {getRoleIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{getRoleTitle()}</span>
              <span className="text-[10px] bg-purple-50 text-[#684f9b] px-2 py-0.5 rounded border border-purple-200 font-mono font-medium">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {currentUser.stationOrCourt} • {currentUser.district}, {currentUser.state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-medium">
            ● Network Online
          </span>
          <span>BSA 2023 Sec 63 Active</span>
        </div>
      </div>
    </header>
  );
}