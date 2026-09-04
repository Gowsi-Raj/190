"use client";

import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import { Gavel, AlertTriangle, Search } from "lucide-react";
import { UserProfile } from "@/types";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface JudicialProps {
  currentUser: UserProfile;
}

export default function JudicialOfficerDashboard({ currentUser }: JudicialProps) {
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);
  const [tamperResult, setTamperResult] = useState<any>(null);

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

  const handleTamperCheck = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await axios.post("http://localhost:8000/api/v1/documents/verify-tamper", formData);
      setTamperResult(res.data);
    } catch {
      alert("Tamper check failed.");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Gavel className="h-5 w-5 text-[#684f9b]" /> Court Evidence Registry & Trial Exhibits
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Inspect unredacted evidence, review unbroken chains of custody, and verify digital signatures.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Crime / FIR Number"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
            />
            <button
              onClick={handleFetchDossier}
              className="bg-[#684f9b] hover:bg-[#5a4287] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5" /> Bench Inspection
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" /> Live Evidentiary Tamper Test
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Upload any digital exhibit from defense or prosecution to verify authenticity against the ledger.
          </p>
          <input
            type="file"
            onChange={handleTamperCheck}
            className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300 file:text-xs file:bg-slate-100 file:text-slate-800 file:font-semibold hover:file:bg-slate-200 cursor-pointer"
          />

          {tamperResult && (
            <div className={`mt-3 text-xs p-3 rounded-lg border font-semibold ${
              tamperResult.isAuthentic ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"
            }`}>
              {tamperResult.isAuthentic ? "100% BIT-PERFECT: Evidence matches original ingestion." : "TAMPER ALERT: SHA-256 hash mismatch."}
            </div>
          )}
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