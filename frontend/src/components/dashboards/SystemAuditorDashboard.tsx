"use client";

import React, { useState } from "react";
import axios from "axios";
import { Database, Search } from "lucide-react";
import { UserProfile } from "@/types";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface AuditorProps {
  currentUser: UserProfile;
}

export default function SystemAuditorDashboard({ currentUser }: AuditorProps) {
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);

  const handleFetchDossier = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/documents/dossier/${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setDossierData(res.data);
    } catch {
      alert("No audit trail found.");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Database className="h-5 w-5 text-[#684f9b]" /> Global Immutable Custody & Compliance Audit
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Read-only inspection of immutable cryptographic events, officer handovers, and system tamper logs.
        </p>
        <div className="flex gap-3 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter FIR / Case Reference"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
          />
          <button
            onClick={handleFetchDossier}
            className="bg-[#684f9b] hover:bg-[#5a4287] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Search className="h-3.5 w-3.5" /> Pull Audit Trail
          </button>
        </div>
      </div>

      {dossierData && (
        <CaseDossierView
          dossierData={dossierData}
          userRole={currentUser.role}
          onInitiateTransfer={() => {}}
        />
      )}
    </div>
  );
}