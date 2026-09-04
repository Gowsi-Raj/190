"use client";

import React, { useState } from "react";
import axios from "axios";
import { Microscope, Search } from "lucide-react";
import { UserProfile } from "@/types";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface ForensicProps {
  currentUser: UserProfile;
  onInitiateTransfer: (hash: string) => void;
}

export default function ForensicExaminerDashboard({ currentUser, onInitiateTransfer }: ForensicProps) {
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
      alert("No exhibit found for this reference.");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Microscope className="h-5 w-5 text-emerald-600" /> Forensic Science Evidence Lab (SFSL)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Inspect incoming physical exhibits, verify cryptographic timestamps, and execute signed custody handovers.
        </p>

        <div className="flex gap-3 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Transferred FIR / Crime Number"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
          />
          <button
            onClick={handleFetchDossier}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Search className="h-3.5 w-3.5" /> Inspect Exhibit
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