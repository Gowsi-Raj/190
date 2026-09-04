"use client";

import React, { useState } from "react";
import axios from "axios";
import { Briefcase, Search } from "lucide-react";
import { UserProfile } from "@/types";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface ProsecutorProps {
  currentUser: UserProfile;
}

export default function PublicProsecutorDashboard({ currentUser }: ProsecutorProps) {
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
      alert("No case dossier found.");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-600" /> Public Prosecution Trial Briefs (Auto PII Redacted)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Automated statutory masking is enforced to protect victim and witness identities for court proceedings.
            </p>
          </div>
          <span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded border border-amber-300 font-semibold">
            PII-Masking Enforced
          </span>
        </div>

        <div className="flex gap-3 max-w-xl mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Charge Sheet / FIR Number"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
          />
          <button
            onClick={handleFetchDossier}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Search className="h-3.5 w-3.5" /> Retrieve Trial File
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