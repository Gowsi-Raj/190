"use client";

import React, { useState } from "react";
import axios from "axios";
import { FolderSearch, Search, ShieldCheck } from "lucide-react";
import { UserProfile } from "@/types";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface SHODashboardProps {
  currentUser: UserProfile;
  onInitiateTransfer: (hash: string) => void;
}

export default function StationHouseOfficerDashboard({ currentUser, onInitiateTransfer }: SHODashboardProps) {
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFetchDossier = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/documents/dossier/${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setDossierData(res.data);
    } catch {
      alert("No case dossier found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Jurisdictional Status</span>
          <p className="text-base font-bold text-[#684f9b] mt-1">{currentUser.stationOrCourt}</p>
          <p className="text-xs text-slate-500">Supervisory Clearance Active</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Section 63 BSA Compliance</span>
          <p className="text-base font-bold text-emerald-700 mt-1">100% Cryptographically Verified</p>
          <p className="text-xs text-slate-500">Zero Unsealed Chain Breaches</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium">Case Dossier Lookup</span>
          <button onClick={handleFetchDossier} className="mt-2 px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white text-xs rounded-lg font-semibold transition cursor-pointer shadow-sm">
            Search Case Records
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FolderSearch className="h-4 w-4 text-[#684f9b]" /> Station Case Dossier Oversight
        </h3>
        <div className="flex gap-3 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter FIR / Case Number"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
          />
          <button
            onClick={handleFetchDossier}
            disabled={loading}
            className="bg-[#684f9b] hover:bg-[#5a4287] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Search className="h-3.5 w-3.5" /> Search
          </button>
        </div>
      </div>

      {dossierData && (
        <CaseDossierView
          dossierData={dossierData}
          userRole={currentUser.role}
          onInitiateTransfer={onInitiateTransfer}
        />
      )}
    </div>
  );
}