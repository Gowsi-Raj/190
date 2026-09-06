"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Microscope, Search, Upload, FileText, CheckCircle2, Clock, 
  ShieldCheck, AlertCircle, PlusCircle, ArrowRightLeft, FileCheck, RefreshCw, Send
} from "lucide-react";
import { UserProfile, ForensicEvidenceItem } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface ForensicProps {
  currentUser: UserProfile;
  onInitiateTransfer: (hash: string) => void;
}

export default function ForensicExaminerDashboard({ currentUser, onInitiateTransfer }: ForensicProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"QUEUE" | "WORK" | "INSPECT">("QUEUE");

  // Search Exhibit Dossier
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);

  // {t("btn.createReport")} Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<ForensicEvidenceItem | null>(null);
  const [reportTitle, setReportTitle] = useState("");
  const [findingsSummary, setFindingsSummary] = useState("");
  const [methodology, setMethodology] = useState("Standard Forensic Electrophoresis & Micro-Spectrometry");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchForensicQueue();
  }, []);

  const fetchForensicQueue = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get("http://localhost:8000/api/v1/documents/forensic-queue", config);
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
      setActiveTab("INSPECT");
    } catch {
      alert("No exhibit found for this reference.");
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvidence) return;
    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/forensic-report", {
        evidenceId: selectedEvidence.evidenceId,
        caseId: selectedEvidence.caseId,
        reportTitle,
        findingsSummary,
        methodology
      }, config);

      setActionSuccess(`Forensic report for Evidence ${selectedEvidence.evidenceId} submitted successfully.`);
      setReportModalOpen(false);
      setReportTitle("");
      setFindingsSummary("");
      fetchForensicQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Principle Disclaimer (Page 7) */}
      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3.5 rounded-r-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Microscope className="h-5 w-5 text-emerald-700 shrink-0" />
          <p className="text-xs text-slate-800">
            <span className="font-bold">Principle of Forensic Segregation:</span> The forensic officer does not get unrestricted access to police investigation notes or general witness transcripts just because they are part of the same case docket (Page 7).
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEvidence({
              evidenceId: "E-1025",
              caseId: "C-502",
              type: "Image",
              received: "03 Sep",
              status: "Examining",
              description: "Digital CCTV Video Feed Analysis"
            });
            setReportTitle("CCTV Frame Rate & Anti-Tampering Analysis Report");
            setFindingsSummary("Video frames verified against camera hardware hash. No localized pixel interpolation detected.");
            setReportModalOpen(true);
          }}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
        >
          <PlusCircle className="h-3.5 w-3.5" /> {t("btn.createReport")}
        </button>
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

      {/* Top Cards (Page 5 - 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.assignedCases")}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data?.summary.assignedCases || 6}</p>
          <span className="text-[10px] text-emerald-600 font-medium">State Lab Docket</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.pendingExam")}</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data?.summary.evidencePendingExamination || 2}</p>
          <span className="text-[10px] text-amber-600 font-medium">In Queue for Analysis</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.reportsProgress")}</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{data?.summary.reportsInProgress || 1}</p>
          <span className="text-[10px] text-blue-600">Drafting Findings</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.reportsSubmitted")}</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{data?.summary.reportsSubmitted || 8}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Certified & Dispatched</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("QUEUE")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "QUEUE" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" /> Evidence Queue ({data?.evidenceQueue?.length || 4})
        </button>
        <button
          onClick={() => setActiveTab("WORK")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "WORK" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" /> Forensic Work Status
        </button>
        <button
          onClick={() => setActiveTab("INSPECT")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "INSPECT" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Search className="h-4 w-4" /> Exhibit Ledger & Custody Inspection
        </button>
      </div>

      {/* TAB 1: EVIDENCE QUEUE TABLE (Page 6) */}
      {activeTab === "QUEUE" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Evidence Queue (Page 6)</h3>
              <p className="text-xs text-slate-500">Evidence ID, Case ID, Type, Received, Status</p>
            </div>
            <button onClick={fetchForensicQueue} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Evidence ID</th>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.evidenceQueue?.map((item: any) => (
                  <tr key={item.evidenceId} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-emerald-700">{item.evidenceId}</td>
                    <td className="p-3 font-mono font-bold text-slate-700">{item.caseId}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#684f9b] border border-purple-200">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{item.description}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{item.received}</td>
                    <td className="p-3">
                      {item.status === "Pending" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Pending</span>
                      )}
                      {item.status === "Examining" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Examining</span>
                      )}
                      {item.status === "Completed" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Completed</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedEvidence(item);
                          setReportTitle(`${item.type} Analysis Report (${item.evidenceId})`);
                          setReportModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Create Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FORENSIC WORK (Page 6) */}
      {activeTab === "WORK" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {t("card.pendingExam")}s
            </h4>
            <div className="space-y-2 text-xs">
              {data?.forensicWork?.pendingExaminations?.map((p: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-emerald-700">{p.evidenceId}</span>
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">{p.priority}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{p.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" /> Reports Being Prepared
            </h4>
            <div className="space-y-2 text-xs">
              {data?.forensicWork?.reportsBeingPrepared?.map((p: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-emerald-700">{p.evidenceId}</span>
                    <span className="text-[11px] font-bold text-blue-700">{p.progress}% Complete</span>
                  </div>
                  <p className="font-semibold text-slate-900">{p.title}</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="h-4 w-4" /> Recently Submitted Reports
            </h4>
            <div className="space-y-2 text-xs">
              {data?.forensicWork?.recentlySubmittedReports?.map((p: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-emerald-700">{p.evidenceId}</span>
                    <span className="text-[10px] text-slate-400">{p.submittedAt}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{p.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXHIBIT INSPECTION & DOSSIER */}
      {activeTab === "INSPECT" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex gap-3 max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter FIR / Crime Number"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
            <button
              onClick={handleFetchDossier}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5" /> Inspect Exhibit
            </button>
          </div>

          {dossierData && (
            <CaseDossierView
              dossierData={dossierData}
              userRole={currentUser.role}
              userBadge={currentUser.badgeNumber}
              onInitiateTransfer={onInitiateTransfer}
            />
          )}
        </div>
      )}

      {/* {t("btn.createReport")} Modal (Page 6) */}
      {reportModalOpen && selectedEvidence && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmitReport} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="h-5 w-5 text-emerald-600" /> Create Official Forensic Report
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Evidence ID: </span> {selectedEvidence.evidenceId} (Case {selectedEvidence.caseId} • {selectedEvidence.type})
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scientific Methodology</label>
                <input
                  type="text"
                  required
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Examiner Findings & Conclusion</label>
                <textarea
                  rows={4}
                  required
                  value={findingsSummary}
                  onChange={(e) => setFindingsSummary(e.target.value)}
                  placeholder="Enter scientific findings, statistical match probability, and conclusion..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Sign & Submit Forensic Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
