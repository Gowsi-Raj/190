"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Briefcase, Search, FileText, CheckCircle2, Clock, AlertCircle, 
  Send, RefreshCw, Eye, ShieldCheck, FileCheck, Layers, Scale, PlusCircle
} from "lucide-react";
import { UserProfile, ProsecutionCaseAction } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface ProsecutorProps {
  currentUser: UserProfile;
}

export default function PublicProsecutorDashboard({ currentUser }: ProsecutorProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIONS" | "DOCUMENTS" | "BRIEF">("ACTIONS");

  // Trial Brief Search
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);

  // Prepare Charge Sheet Modal
  const [chargeSheetModalOpen, setChargeSheetModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ProsecutionCaseAction | null>(null);
  const [chargeSheetTitle, setChargeSheetTitle] = useState("");
  const [penalSections, setPenalSections] = useState("Section 103(1), 115(2), 238 BNS 2023");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProsecutionQueue();
  }, []);

  const fetchProsecutionQueue = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get("http://localhost:8000/api/v1/documents/prosecution-queue", config);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDossier = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/documents/dossier/${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setDossierData(res.data);
      setActiveTab("BRIEF");
    } catch {
      alert("No case dossier found.");
    }
  };

  const handlePrepareChargeSheet = (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccess(`Charge sheet for Case ${selectedCase?.caseId} drafted and queued for Sessions Court filing.`);
    setChargeSheetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-600 p-3.5 rounded-r-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Briefcase className="h-5 w-5 text-amber-700 shrink-0" />
          <p className="text-xs text-slate-800">
            <span className="font-bold">Prosecution Trial Preparation:</span> Review authorized case material, prepare formal charge-sheets under BNSS, and review court filings with automated statutory PII redaction.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-amber-800 bg-white border border-amber-300 px-3 py-1 rounded-full">
          PII-Masking Enforced
        </span>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Top Cards (Page 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.authorizedCases")}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data?.summary.authorizedCases || 18}</p>
          <span className="text-[10px] text-emerald-600 font-medium">State Trial Dockets</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.casesAwaitingLegalPrep")}</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data?.summary.casesAwaitingLegalPrep || 4}</p>
          <span className="text-[10px] text-amber-600 font-medium">Pre-Trial Drafting</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.chargeSheets")}</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{data?.summary.chargeSheets || 12}</p>
          <span className="text-[10px] text-blue-600">Drafted & Finalized</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.courtFilingsPending")}</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">{data?.summary.courtFilingsPending || 3}</p>
          <span className="text-[10px] text-purple-600 font-medium">Sessions Registry</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("ACTIONS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "ACTIONS" ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" /> Cases Requiring Action ({data?.casesRequiringAction?.length || 3})
        </button>
        <button
          onClick={() => setActiveTab("DOCUMENTS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "DOCUMENTS" ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" /> Legal Documents & Filings
        </button>
        <button
          onClick={() => setActiveTab("BRIEF")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "BRIEF" ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Search className="h-4 w-4" /> Case Trial Dossier & PII Redacted View
        </button>
      </div>

      {/* TAB 1: CASES REQUIRING ACTION TABLE (Page 7) */}
      {activeTab === "ACTIONS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cases Requiring Action (Page 7)</h3>
              <p className="text-xs text-slate-500">Case ID, Case Title, Status, Action (Review / Prepare)</p>
            </div>
            <button onClick={fetchProsecutionQueue} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Case Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.casesRequiringAction?.map((c: any) => (
                  <tr key={c.caseId} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-amber-800">{c.caseId}</td>
                    <td className="p-3 font-semibold text-slate-900">{c.case}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCase(c);
                          setChargeSheetTitle(`Final Police Report u/s 173 BNSS (${c.caseId})`);
                          setChargeSheetModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        {c.action === "Review" ? "Review Case Dossier" : "Prepare Charge Sheet"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEGAL DOCUMENTS LIST (Page 8) */}
      {activeTab === "DOCUMENTS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Legal Documents Overview (Page 8)</h3>
          <p className="text-xs text-slate-500">Charge sheets, Court filings, Legal notices, Supporting investigation documents.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.legalDocuments?.map((doc: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    {doc.type}
                  </span>
                  <p className="font-bold text-slate-900 mt-1.5 text-sm">{doc.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Status: <span className="font-semibold text-emerald-700">{doc.status}</span></p>
                </div>
                <button
                  onClick={() => setActionSuccess(`Inspecting evidentiary ledger for: ${doc.title}`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition text-[11px]"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BRIEF VIEW (PII REDACTED) */}
      {activeTab === "BRIEF" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex gap-3 max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Charge Sheet / FIR Number"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
            <button
              onClick={handleFetchDossier}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5" /> Retrieve Trial File
            </button>
          </div>

          {dossierData && (
            <CaseDossierView
              dossierData={dossierData}
              userRole={currentUser.role}
              userBadge={currentUser.badgeNumber}
            />
          )}
        </div>
      )}

      {/* Prepare Charge Sheet Modal */}
      {chargeSheetModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handlePrepareChargeSheet} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-600" /> Prepare Charge Sheet ({selectedCase.caseId})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Charge Sheet Formal Heading</label>
                <input
                  type="text"
                  required
                  value={chargeSheetTitle}
                  onChange={(e) => setChargeSheetTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Applicable Penal Code Sections (BNS 2023)</label>
                <input
                  type="text"
                  required
                  value={penalSections}
                  onChange={(e) => setPenalSections(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setChargeSheetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Finalize & Queue for Sessions Court
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
