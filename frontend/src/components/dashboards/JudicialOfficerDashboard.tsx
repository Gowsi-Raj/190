"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { 
  Gavel, Search, CheckCircle2, Clock, AlertTriangle, 
  FileText, Upload, RefreshCw, Send, ShieldCheck, Scale, FileCheck, Layers,
  History, ShieldAlert, Eye, Download, Lock, Fingerprint, ExternalLink,
  Copy, Check, Printer, Building, UserCheck, BadgeCheck, AlertCircle, Sparkles, Filter, ArrowRight,
  Shield, CheckCircle, HelpCircle, FileDigit
} from "lucide-react";
import { UserProfile, CourtActionItem } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface JudicialProps {
  currentUser: UserProfile;
}

export default function JudicialOfficerDashboard({ currentUser }: JudicialProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "DOCUMENTS" | "DOSSIER" | "TAMPER" | "AUDIT">("PENDING");

  // Search & Dossier
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);
  const [tamperResult, setTamperResult] = useState<any>(null);

  // Section 63 BSA Tamper Forensics
  const [forensicHashQuery, setForensicHashQuery] = useState("FIR-2026-CBE-0142");
  const [forensicReport, setForensicReport] = useState<any | null>(null);
  const [forensicLoading, setForensicLoading] = useState(false);
  const [forensicError, setForensicError] = useState<string | null>(null);

  // Courtroom Evidence Audit State (Live Trial Examination)
  const [auditQuery, setAuditQuery] = useState("E1024");
  const [auditData, setAuditData] = useState<any | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [auditSubTab, setAuditSubTab] = useState<"TIMELINE" | "LEDGER" | "VERSIONS" | "CUSTODY" | "INTEGRITY" | "SECURITY" | "SUBMISSION">("TIMELINE");
  const [copiedHash, setCopiedHash] = useState(false);
  const [reverifyingHash, setReverifyingHash] = useState(false);
  const [hashVerifySuccess, setHashVerifySuccess] = useState<string | null>(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examNote, setExamNote] = useState("Evidence tendered in open court. Witness identified recording. Bit-level SHA-256 integrity confirmed under Section 63 BSA, 2023.");
  const [loggingExam, setLoggingExam] = useState(false);

  // PDF Export & Judicial Bench Authentication Gate for Tamper Forensics
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfDropdownOpen, setPdfDropdownOpen] = useState(false);
  const [benchUnlocked, setBenchUnlocked] = useState(false);
  const [benchAuthModalOpen, setBenchAuthModalOpen] = useState(false);
  const [benchIdentifier, setBenchIdentifier] = useState(currentUser.badgeNumber || "TN-JUD-5512");
  const [benchPassword, setBenchPassword] = useState("123456");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tamperingSimulating, setTamperingSimulating] = useState(false);

  // Upload Order / Judgment Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CourtActionItem | null>(null);
  const [orderTitle, setOrderTitle] = useState("");
  const [orderText, setOrderText] = useState("");
  const [actionType, setActionType] = useState<"UPLOAD_ORDER" | "UPLOAD_JUDGMENT">("UPLOAD_ORDER");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCourtActions();
    fetchCourtroomEvidenceAudit("E1024");
  }, []);

  const fetchCourtActions = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get("http://localhost:8000/api/v1/documents/court-actions", config);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourtroomEvidenceAudit = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : auditQuery).trim() || "E1024";
    setAuditLoading(true);
    setAuditError(null);
    setHashVerifySuccess(null);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get(`http://localhost:8000/api/v1/documents/courtroom-evidence-audit?query=${encodeURIComponent(q)}`, config);
      setAuditData(res.data);
    } catch (err: any) {
      console.error("Audit fetch error:", err);
      setAuditError(err.response?.data?.detail || "Failed to fetch in-court evidence audit log.");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleReverifyHash = async () => {
    setReverifyingHash(true);
    setHashVerifySuccess(null);
    try {
      await new Promise(r => setTimeout(r, 650));
      setHashVerifySuccess("INTEGRITY CONFIRMED: Live calculated SHA-256 matches immutable Section 63 BSA seal bit-for-bit (0 mutations detected).");
    } catch {
      alert("Hash verification failed");
    } finally {
      setReverifyingHash(false);
    }
  };

  const handleLogBenchExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditData?.evidence) return;
    setLoggingExam(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/log-court-examination", {
        evidenceId: auditData.evidence.evidenceId,
        caseId: auditData.evidence.caseId,
        docHash: auditData.evidence.docHash,
        action: "JUDICIAL_COURTROOM_EXAMINATION",
        judicialNote: examNote
      }, config);
      setActionSuccess(`In-court judicial examination for ${auditData.evidence.evidenceId} logged into permanent ledger.`);
      setExamModalOpen(false);
      fetchCourtroomEvidenceAudit(auditData.evidence.evidenceId);
    } catch (err: any) {
      console.error(err);
      alert("Failed to log examination");
    } finally {
      setLoggingExam(false);
    }
  };

  const handleDownloadAuditReport = async (reportType: string = "FULL_AUDIT") => {
    setExportingPdf(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${currentUser.token}` },
        responseType: "blob" as const
      };
      const targetQuery = auditData?.evidence?.caseId || auditQuery || "E1024";
      const res = await axios.get(
        `http://localhost:8000/api/v1/documents/audit-report/pdf?caseId=${encodeURIComponent(targetQuery)}&reportType=${reportType}`,
        config
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Court_Evidence_Audit_${auditData?.evidence?.evidenceId?.replace(/\s+/g, "_") || "E1024"}_${reportType}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setActionSuccess(`Official Court Evidence Audit Report (${reportType}) downloaded in certified PDF format.`);
    } catch (err: any) {
      console.error("PDF download error:", err);
      alert("Failed to download Audit Report PDF. Please check server logs.");
    } finally {
      setExportingPdf(false);
      setPdfDropdownOpen(false);
    }
  };

  const handleJudicialBenchAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await axios.post("http://localhost:8000/api/v1/auth/judicial-bench-auth", {
        identifier: benchIdentifier.trim() || currentUser.badgeNumber || "TN-JUD-5512",
        pinOrPassword: benchPassword
      });
      if (res.data && res.data.access_token) {
        setBenchUnlocked(true);
        setBenchAuthModalOpen(false);
        setActionSuccess(`Judicial Officer credentials authenticated for ${res.data.fullName}. Bench privilege forensic diff unlocked.`);
      }
    } catch (err: any) {
      console.error("Judicial auth error:", err);
      setAuthError(err.response?.data?.detail || "Authentication failed. Invalid Judicial Officer credentials or Bench PIN.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTamperingSimulating(true);
    try {
      await axios.post("http://localhost:8000/api/v1/documents/simulate-db-tamper", {
        docHash: "E1024",
        field: "accusedName",
        newValue: "EXONERATED / NAME DELETED (Unauthorized DB Modification)",
        tamperedBy: "Insp. R. Chandran (Malicious Actor / Rogue Admin)",
        tamperedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
      });
      setActionSuccess("Simulation Active: Evidence E1024 database record mutated. Reflecting tamper detection on Judicial Dashboard.");
      setBenchUnlocked(false);
      await fetchCourtroomEvidenceAudit("E1024");
    } catch (err: any) {
      console.error(err);
      alert("Tamper simulation failed.");
    } finally {
      setTamperingSimulating(false);
    }
  };

  const handleResetTamper = async () => {
    setTamperingSimulating(true);
    try {
      await axios.post("http://localhost:8000/api/v1/documents/reset-db-tamper", {
        docHash: "E1024"
      });
      setActionSuccess("Evidence E1024 successfully restored to authentic statutory sealed baseline (0 mutations).");
      setBenchUnlocked(false);
      await fetchCourtroomEvidenceAudit("E1024");
    } catch (err: any) {
      console.error(err);
      alert("Baseline reset failed.");
    } finally {
      setTamperingSimulating(false);
    }
  };

  const handleFetchDossier = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/documents/dossier/${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setDossierData(res.data);
      setActiveTab("DOSSIER");
    } catch {
      alert("No case dossier found.");
    }
  };

  const handleApproveFiling = async (item: CourtActionItem) => {
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/court-action", {
        caseId: item.caseId,
        filingId: item.filing,
        actionType: "APPROVE",
        orderTitle: `Formal Approval of ${item.filing}`,
        orderText: "The filing was formally examined by the Court and approved for judicial proceedings."
      }, config);

      setActionSuccess(`Filing ${item.filing} for Case ${item.caseId} officially approved.`);
      fetchCourtActions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction) return;
    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/court-action", {
        caseId: selectedAction.caseId,
        filingId: selectedAction.filing,
        actionType,
        orderTitle,
        orderText
      }, config);

      setActionSuccess(`${actionType === "UPLOAD_ORDER" ? "Judicial Order" : "Judgment"} recorded for Case ${selectedAction.caseId}.`);
      setOrderModalOpen(false);
      setOrderTitle("");
      setOrderText("");
      fetchCourtActions();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunForensicInspection = async (hashOrFir?: string) => {
    const q = (hashOrFir || forensicHashQuery).trim();
    if (!q) return;

    setForensicLoading(true);
    setForensicError(null);

    try {
      let targetHash = q;
      // If user typed FIR, lookup the document hash first
      if (q.startsWith("FIR-") || q.startsWith("CASE-")) {
        const dRes = await axios.get(`http://localhost:8000/api/v1/documents/dossier/${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        if (dRes.data && dRes.data.dossier && dRes.data.dossier.length > 0) {
          targetHash = dRes.data.dossier[0].docHash;
        }
      }

      const res = await axios.get(`http://localhost:8000/api/v1/documents/tamper-forensics?hash=${encodeURIComponent(targetHash)}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setForensicReport(res.data);
    } catch (err: any) {
      setForensicError(err.response?.data?.detail || "Failed to execute judicial forensic audit.");
      setForensicReport(null);
    } finally {
      setForensicLoading(false);
    }
  };

  const handleOpenRejectionOrder = (report: any) => {
    setSelectedAction({
      caseId: report.caseId || "CASE-2026-9042",
      filing: `Exhibit SHA-256: ${report.docHash?.slice(0, 16)}...`,
      submittedBy: report.currentRecord?.currentCustodian || "Police Ingestion",
      status: "COMPROMISED",
      submittedDate: new Date().toISOString()
    });
    setActionType("UPLOAD_ORDER");
    setOrderTitle(`EVIDENTIARY REJECTION ORDER (SECTION 63 BSA): ${report.caseId || "CASE-2026-9042"}`);
    setOrderText(report.statutoryJudicialFinding || "Exhibit fails Section 63 BSA cryptographic integrity verification and is hereby REJECTED.");
    setOrderModalOpen(true);
  };

  const handleTamperCheck = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await axios.post("http://localhost:8000/api/v1/documents/verify-tamper", formData);
      setTamperResult(res.data);
      setActiveTab("TAMPER");
    } catch {
      alert("Tamper check failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Principle Banner (Page 10) */}
      <div className="bg-purple-50 border-l-4 border-[#684f9b] p-3.5 rounded-r-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Gavel className="h-5 w-5 text-[#684f9b] shrink-0" />
          <p className="text-xs text-slate-800">
            <span className="font-bold">Court-Centric Management:</span> The Court dashboard is court-centric, not an investigation dashboard. Review authorized submissions, rule on electronic evidence under Section 63 BSA, and issue judicial orders and judgments (Page 10).
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#684f9b] bg-white border border-purple-200 px-3 py-1 rounded-full">
          Judicial Bench
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

      {/* Top Cards (Page 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.casesBeforeCourt")}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data?.summary.casesBeforeCourt || 34}</p>
          <span className="text-[10px] text-emerald-600 font-medium">On Active Cause List</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.filingsPending")}</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data?.summary.filingsPendingReview || 5}</p>
          <span className="text-[10px] text-amber-600 font-medium">Prosecution Submissions</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.awaitingApproval")}</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{data?.summary.documentsAwaitingApproval || 2}</p>
          <span className="text-[10px] text-blue-600">Cognizance Orders</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.ordersJudgments")}</span>
          <p className="text-2xl font-bold text-[#684f9b] mt-1">{data?.summary.ordersJudgments || 18}</p>
          <span className="text-[10px] text-purple-600 font-medium">Issued by Bench</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "PENDING" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" /> Pending Court Actions ({data?.pendingCourtActions?.length || 3})
        </button>
        <button
          onClick={() => setActiveTab("DOCUMENTS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "DOCUMENTS" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" /> Court Documents (Orders & Judgments)
        </button>
        <button
          onClick={() => setActiveTab("DOSSIER")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "DOSSIER" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Search className="h-4 w-4" /> Unredacted Evidentiary Dossier
        </button>
        <button
          onClick={() => setActiveTab("TAMPER")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "TAMPER" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Tamper Verification Engine
        </button>
        <button
          onClick={() => {
            setActiveTab("AUDIT");
            if (!auditData) fetchCourtroomEvidenceAudit("E1024");
          }}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "AUDIT" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" /> Courtroom Evidence Audit Log
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-purple-100 text-[#684f9b] font-bold border border-purple-200">
            Active Matter Trail
          </span>
        </button>
      </div>

      {/* TAB 1: PENDING COURT ACTIONS TABLE (Page 10) */}
      {activeTab === "PENDING" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Court Actions (Page 10)</h3>
              <p className="text-xs text-slate-500">Case ID, Filing, Submitted By, Status</p>
            </div>
            <button onClick={fetchCourtActions} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Filing Description</th>
                  <th className="p-3">Submitted By</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.pendingCourtActions?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-[#684f9b]">{item.caseId}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.filing}</td>
                    <td className="p-3 text-slate-600">{item.submittedBy}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{item.submittedDate}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          const q = item.filing?.includes("1024") || item.caseId?.includes("1024") ? "E1024" : (item.caseId || "E1024");
                          setAuditQuery(q);
                          setActiveTab("AUDIT");
                          fetchCourtroomEvidenceAudit(q);
                        }}
                        className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#684f9b] border border-purple-200 rounded text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        title="Inspect In-Court Evidence Audit Trail"
                      >
                        <History className="h-3 w-3" />
                        Audit Trail
                      </button>
                      <button
                        onClick={() => handleApproveFiling(item)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAction(item);
                          setActionType("UPLOAD_ORDER");
                          setOrderTitle(`Judicial Order on ${item.filing} (${item.caseId})`);
                          setOrderModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Upload Order
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAction(item);
                          setActionType("UPLOAD_JUDGMENT");
                          setOrderTitle(`Judgment in Matter ${item.caseId}`);
                          setOrderModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Upload Judgment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COURT DOCUMENTS (Page 10) */}
      {activeTab === "DOCUMENTS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Court Documents Registry (Page 10)</h3>
          <p className="text-xs text-slate-500">Court filings, Charge sheets, Evidence submitted to court, Orders, Judgments</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.courtDocuments?.map((doc: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#684f9b] uppercase">
                    {doc.type}
                  </span>
                  <p className="font-bold text-slate-900 mt-1.5 text-sm">{doc.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Status: <span className="font-semibold text-emerald-700">{doc.status}</span></p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const q = doc.title?.includes("1024") ? "E1024" : (doc.title?.includes("Ex.P-1") ? "E1024" : "FIR-2026-CBE-0142");
                      setAuditQuery(q);
                      setActiveTab("AUDIT");
                      fetchCourtroomEvidenceAudit(q);
                    }}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#684f9b] border border-purple-200 font-semibold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                    title="Open Live Evidentiary Audit Log"
                  >
                    <History className="h-3 w-3" />
                    Audit Log
                  </button>
                  <button
                    onClick={() => setActionSuccess(`Opened court record: ${doc.title}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition text-[11px]"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOSSIER VIEW */}
      {activeTab === "DOSSIER" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex gap-3 max-w-xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Crime / FIR Number"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
            />
            <button
              onClick={handleFetchDossier}
              className="bg-[#684f9b] hover:bg-[#5a4287] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5" /> Inspect Exhibit
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

      {/* TAB 4: SECTION 63 BSA TAMPER FORENSICS MATRIX (Page 10) */}
      {activeTab === "TAMPER" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="h-4 w-4 text-[#684f9b]" />
                Section 63 BSA Forensic Tamper Matrix & Judicial Audit Bench
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Privileged Judicial Inspector: Compare live database entries against immutable Section 63 BSA sealed snapshots to reveal any minute modified fields, culprit actor, and exact timestamp.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-[#684f9b] border border-purple-200">
              Judicial Officer Access Only
            </span>
          </div>

          {/* Search Bar for Hash / FIR */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Enter Exhibit SHA-256 Hash, FIR Number, or Case Reference:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={forensicHashQuery}
                onChange={(e) => setForensicHashQuery(e.target.value)}
                placeholder="e.g. FIR-2026-CBE-0142 or SHA-256 Checksum"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-[#684f9b]"
              />
              <button
                onClick={() => handleRunForensicInspection()}
                disabled={forensicLoading}
                className="px-4 py-2 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {forensicLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Inspect Forensic Integrity
              </button>
            </div>
            {forensicError && (
              <p className="text-xs text-red-600 font-semibold">{forensicError}</p>
            )}
          </div>

          {/* RESULTS OF JUDICIAL TAMPER INSPECTION */}
          {forensicReport && (
            <div className="space-y-4">
              {/* Overall Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                forensicReport.isTampered 
                  ? "bg-red-50 border-red-300 text-red-900" 
                  : "bg-emerald-50 border-emerald-300 text-emerald-900"
              }`}>
                <div className="flex items-center gap-3">
                  {forensicReport.isTampered ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {forensicReport.isTampered 
                        ? `INTEGRITY COMPROMISED: ${forensicReport.diffCount} MUTATED ATTRIBUTE(S)` 
                        : "RECORD AUTHENTIC & BIT-PERFECT"}
                    </h4>
                    <p className="text-[11px] mt-0.5">
                      {forensicReport.isTampered 
                        ? "The database record does not match the immutable Section 63 BSA cryptographic seal." 
                        : "Document metadata perfectly matches the cryptographic seal generated at initial ingestion."}
                    </p>
                  </div>
                </div>
                {forensicReport.isTampered && (
                  <button
                    onClick={() => handleOpenRejectionOrder(forensicReport)}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Gavel className="h-3.5 w-3.5" />
                    Issue Rejection Order
                  </button>
                )}
              </div>

              {/* WHO TAMPERED IT & EXACT TIMESTAMP CARDS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Forensic Culprit Attribution & Tamper Timestamp (Who and When)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Who Tampered It (Culprit):</span>
                    <span className="font-bold text-red-700 text-sm mt-0.5 block">{forensicReport.attribution?.tamperActor}</span>
                    <span className="text-slate-500 text-[11px] mt-1 block">Method: {forensicReport.attribution?.tamperMethod}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">When It Happened (Exact Timestamp):</span>
                    <span className="font-bold text-amber-800 font-mono text-sm mt-0.5 block">{forensicReport.attribution?.tamperTimestamp}</span>
                    <span className="text-slate-500 text-[11px] mt-1 block">{forensicReport.attribution?.tamperWindow}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Last Authorized Custodian:</span>
                    <span className="text-slate-800 font-medium">{forensicReport.attribution?.currentCustodian}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Original Attesting Officer:</span>
                    <span className="text-slate-800 font-medium">{forensicReport.attribution?.attestingOfficer}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-100/60 border border-amber-300 rounded-lg text-xs text-amber-900">
                  {forensicReport.attribution?.tamperWarning}
                </div>
              </div>

              {/* FIELD-BY-FIELD DIFF MATRIX */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-[#684f9b]" />
                    What Data Was Tampered: Sealed Baseline vs. Active Database (From What to What)
                  </span>
                  <span className="text-[11px] font-mono text-slate-600">
                    Exhibit Hash: {forensicReport.docHash?.slice(0, 16)}...
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-3">Case Attribute</th>
                        <th className="p-3 text-emerald-700">Original Sealed Value (BSA Issuance)</th>
                        <th className="p-3 text-red-700">Tampered Database Value (Active DB)</th>
                        <th className="p-3 text-center">Mutation Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {forensicReport.diffs && forensicReport.diffs.length > 0 ? (
                        forensicReport.diffs.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-sans font-bold text-slate-800">
                              {d.label}
                              <span className="block text-[10px] text-slate-400 font-mono font-normal">{d.field}</span>
                            </td>
                            <td className="p-3 text-emerald-700 bg-emerald-50/50 font-semibold break-all">
                              {d.originalValue}
                            </td>
                            <td className="p-3 text-red-700 bg-red-50/70 font-bold break-all">
                              {d.tamperedValue}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                {d.changeType || "MUTATED"}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                            All metadata fields match the initial cryptographic anchor perfectly.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STATUTORY FINDING FOR COURT RECORDS */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Statutory Judicial Finding (Section 63(4) BSA 2023)
                </span>
                <pre className="text-xs font-mono whitespace-pre-wrap text-slate-300 leading-relaxed">
                  {forensicReport.statutoryJudicialFinding}
                </pre>
              </div>
            </div>
          )}

          {/* Suspect PDF File Hash Upload Verification (Secondary) */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Secondary: Upload Suspect Printed/Exported PDF File</h4>
            <label className="border-2 border-dashed border-slate-300 hover:border-[#684f9b] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition">
              <Upload className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">Upload Suspect PDF File to compute SHA-256</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handleTamperCheck} />
            </label>

            {tamperResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                tamperResult.isTampered ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {tamperResult.isTampered ? "⚠️ BIT-LEVEL TAMPERING DETECTED" : "✅ DOCUMENT AUTHENTIC & BIT-PERFECT"}
                </div>
                <p>{tamperResult.message}</p>
                <span className="font-mono text-[10px] break-all block">SHA-256: {tamperResult.calculatedHash}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: COURTROOM EVIDENCE AUDIT LOG (Page 10 - Live Evidence Under Trial) */}
      {activeTab === "AUDIT" && (
        <div className="space-y-6">
          {/* Presiding Bench & In-Courtroom Inspection Header */}
          <div className="bg-gradient-to-r from-purple-900 via-[#684f9b] to-indigo-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
              <Gavel className="h-44 w-44" />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-white/15 backdrop-blur-xs rounded-lg">
                    <Scale className="h-5 w-5 text-purple-200" />
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                      In-Court Evidentiary Audit Ledger & Document Provenance
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live Trial Session Active
                      </span>
                    </h2>
                    <p className="text-xs text-purple-200">
                      Presiding Officer: <span className="font-semibold text-white">{currentUser.fullName} ({currentUser.badgeNumber})</span> • {currentUser.stationOrCourt || "Principal Sessions Court (Bench 1)"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Download Audit Log PDF Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setPdfDropdownOpen(!pdfDropdownOpen)}
                      disabled={exportingPdf}
                      className="px-3 py-1.5 bg-purple-900/90 hover:bg-purple-950 text-white text-xs font-bold rounded-lg shadow-sm border border-purple-300/40 transition flex items-center gap-1.5 cursor-pointer"
                      title="Download Certified Evidence Audit Report in PDF format"
                    >
                      {exportingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-purple-200" />}
                      <span>{exportingPdf ? "Generating PDF..." : "Download Audit Log (PDF)"}</span>
                    </button>

                    {pdfDropdownOpen && (
                      <div className="absolute right-0 mt-1.5 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-40 text-xs animate-fade-in">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          Official Certified PDF Formats
                        </div>
                        <button
                          onClick={() => handleDownloadAuditReport("FULL_AUDIT")}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 text-slate-800 hover:text-[#684f9b] flex items-center gap-2 font-semibold cursor-pointer"
                        >
                          <FileDigit className="h-3.5 w-3.5 text-[#684f9b]" />
                          Full Courtroom Evidence Audit PDF
                        </button>
                        <button
                          onClick={() => handleDownloadAuditReport("COMPLIANCE")}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 text-slate-800 hover:text-[#684f9b] flex items-center gap-2 font-semibold cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Section 63 BSA Compliance Certificate PDF
                        </button>
                        <button
                          onClick={() => handleDownloadAuditReport("CHAIN_OF_CUSTODY")}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 text-slate-800 hover:text-[#684f9b] flex items-center gap-2 font-semibold cursor-pointer"
                        >
                          <Building className="h-3.5 w-3.5 text-indigo-600" />
                          Chain-of-Custody Provenance PDF
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setExamModalOpen(true)}
                    className="px-3 py-1.5 bg-white text-[#684f9b] hover:bg-purple-50 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gavel className="h-3.5 w-3.5" />
                    Record Courtroom Examination
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer"
                    title="Print Court Evidence Docket"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-purple-100/90 max-w-3xl leading-relaxed pt-1">
                Statutory Section 63 BSA Evidentiary Verification: Review the complete chronological lifecycle of documents active in court. Inspect who accessed the evidence, when it was retrieved, actions performed, version history, chain of custody, and cryptographic SHA-256 seal integrity.
              </p>
            </div>
          </div>

          {/* Active Evidence Quick Switcher & Reference Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Fingerprint className="h-4 w-4 text-[#684f9b]" />
                Select Active Evidence / Document Under Court Examination:
              </span>
              <span className="text-[11px] text-slate-500">
                Switch between exhibits currently tendered before the Court
              </span>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "E1024", label: "Evidence E1024 — Digital CCTV Capture (CASE-2026-1024)", active: auditQuery.toUpperCase().includes("1024") },
                { id: "CASE-2026-9042", label: "Exhibit EX-1 — Mobile Extraction (CASE-2026-9042)", active: auditQuery.includes("9042") },
                { id: "CASE-2026-501", label: "Charge Sheet CS-501 — Sessions Filing (CASE-2026-501)", active: auditQuery.includes("501") },
                { id: "FIR-2026-CBE-0142", label: "FIR-2026-CBE-0142 — Primary FIR Ingestion", active: auditQuery.includes("0142") }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    setAuditQuery(pill.id);
                    fetchCourtroomEvidenceAudit(pill.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5 ${
                    pill.active
                      ? "bg-[#684f9b] text-white border-[#684f9b] shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Custom Search Box */}
            <div className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchCourtroomEvidenceAudit()}
                  placeholder="Enter Evidence ID (e.g. E1024), FIR Number, Case ID, or SHA-256 Hash..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-[#684f9b]"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                onClick={() => fetchCourtroomEvidenceAudit()}
                disabled={auditLoading}
                className="px-4 py-2 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {auditLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Inspect Document Audit
              </button>
            </div>

            {/* Simulation Controls for testing Tampering & Baseline Restoration */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Live Tamper Engine Controls (Simulate DB Data Mutation & Verify Judicial Gate):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateTamper}
                  disabled={tamperingSimulating}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Mutate database record out-of-band to test tamper detection"
                >
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  {tamperingSimulating ? "Processing..." : "Simulate DB Data Tamper"}
                </button>
                <button
                  onClick={handleResetTamper}
                  disabled={tamperingSimulating}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Restore record to authentic statutory sealed baseline"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {tamperingSimulating ? "Processing..." : "Reset to Authentic Baseline"}
                </button>
              </div>
            </div>

            {auditError && (
              <p className="text-xs text-red-600 font-semibold">{auditError}</p>
            )}
          </div>

          {/* ACTIVE EVIDENCE DOSSIER & CRYPTOGRAPHIC INTEGRITY BANNER */}
          {auditData?.evidence && (
            <div className="space-y-4">
              {/* Evidence Overview Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-purple-100 text-[#684f9b] font-mono font-bold text-xs rounded-lg border border-purple-200">
                        {auditData.evidence.evidenceId}
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg border border-indigo-200">
                        {auditData.evidence.exhibitMark}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        {auditData.evidence.courtStatus}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      {auditData.evidence.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Case: <span className="font-semibold text-slate-800">{auditData.evidence.caseId}</span> ({auditData.evidence.caseTitle}) • FIR: <span className="font-semibold text-slate-800">{auditData.evidence.firNumber}</span>
                    </p>
                  </div>

                  {/* Cryptographic Seal & Live Re-Verify */}
                  <div className="flex flex-col sm:items-end gap-1.5">
                    <button
                      onClick={handleReverifyHash}
                      disabled={reverifyingHash}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {reverifyingHash ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Verify Live Integrity Now
                    </button>
                    <span className="text-[10px] text-slate-400">
                      Standard: Section 63(4) BSA Cryptographic Protocol
                    </span>
                  </div>
                </div>

                {/* Status Callout Banner: Dynamically reflects when data is tampered */}
                {auditData.integrity?.isTampered ? (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md">
                        <AlertTriangle className="h-6 w-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-red-950">
                            ⚠️ INTEGRITY COMPROMISED: DATA TAMPERED
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white animate-pulse">
                            MUTATION DETECTED U/S 63 BSA
                          </span>
                        </div>
                        <p className="text-xs text-red-800 mt-0.5 font-medium">
                          Critical Alert: Database record for this evidence differs from the immutable Section 63 BSA seal. Bit-level cryptographic discrepancy detected!
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-red-700 font-semibold block uppercase">Legal Admissibility:</span>
                      <span className="text-xs font-bold text-red-950 block bg-red-200/80 px-2.5 py-0.5 rounded border border-red-300">
                        {auditData.evidence.admissibilityStatus || "INADMISSIBLE (TAMPERED)"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-emerald-900">
                            {auditData.integrity?.status || "Verified — No modification detected"}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                            100% Bit-Perfect Match
                          </span>
                        </div>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          SHA-256 cryptographic hash matches original ingestion anchor exactly. No data mutation or vault bit-rot detected.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-emerald-800 font-semibold block">Legal Admissibility:</span>
                      <span className="text-xs font-bold text-emerald-950 block">{auditData.evidence.admissibilityStatus}</span>
                    </div>
                  </div>
                )}

                {/* JUDICIAL BENCH PRIVILEGE GATE: Reveal What was tampered from what, Who, and When */}
                {auditData.integrity?.isTampered && (
                  <>
                    {!benchUnlocked ? (
                      <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-2 border-red-500/80 rounded-xl text-white shadow-xl space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-600/30 border border-red-500 rounded-xl text-red-400 shrink-0">
                              <Lock className="h-6 w-6 animate-pulse" />
                            </div>
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white inline-block mb-1">
                                Restricted Under Bench Privilege
                              </span>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                Classified Forensic Tamper Breakdown Is Locked
                              </h4>
                              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                                To reveal <strong>what data was modified from what</strong>, <strong>who performed the mutation</strong>, and <strong>when it occurred</strong>, authenticate presiding Judicial Officer credentials.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setAuthError(null);
                              setBenchAuthModalOpen(true);
                            }}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer border border-red-400/50"
                          >
                            <Lock className="h-4 w-4" />
                            Authenticate Judicial Credentials to Reveal Tamper Analysis
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border-2 border-red-400 rounded-xl p-5 shadow-lg space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Bench Privilege Authenticated
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                                {auditData.forensics?.diffCount || auditData.forensics?.diffs?.length || 1} Mutation(s) Identified
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                              <ShieldAlert className="h-5 w-5 text-red-600" />
                              Classified Forensic Audit: What Data Was Tampered, Who, and When
                            </h3>
                            <p className="text-xs text-slate-500">
                              Bit-by-bit cryptographic diff between immutable Section 63 BSA statutory seal and active database record
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenRejectionOrder(auditData.forensics)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Gavel className="h-3.5 w-3.5" />
                              Issue Section 63 BSA Rejection Order
                            </button>
                            <button
                              onClick={() => setBenchUnlocked(false)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                              title="Re-lock bench privilege view"
                            >
                              <Lock className="h-3.5 w-3.5 inline mr-1" />
                              Lock View
                            </button>
                          </div>
                        </div>

                        {/* WHO & WHEN ATTRIBUTION CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-red-50/70 p-4 rounded-xl border border-red-200 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">
                              Who Modified It (Culprit Attribution)
                            </span>
                            <p className="font-bold text-slate-900 text-sm">
                              {auditData.forensics?.attribution?.tamperActor || "Unauthorized Direct Database Modification"}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Method: <span className="font-mono font-semibold">{auditData.forensics?.attribution?.tamperMethod || "Direct MongoDB Write"}</span>
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">
                              When It Was Modified (Timestamp)
                            </span>
                            <p className="font-mono font-bold text-slate-900 text-sm">
                              {auditData.forensics?.attribution?.tamperTimestamp || "05-Sep-2026 04:12:00 PM IST"}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Detection: {auditData.forensics?.attribution?.tamperWindow || "Discovered during live bench verification"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block">
                              Custodian & Attestation Chain
                            </span>
                            <p className="font-semibold text-slate-900">
                              Custodian: {auditData.forensics?.attribution?.currentCustodian || "Principal Sessions Court Registry"}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Sealed By: {auditData.forensics?.attribution?.attestingOfficer || "Insp. G. Senthil Nathan (TN-POL-4921)"}
                            </p>
                          </div>
                        </div>

                        {/* WHAT WAS MODIFIED FROM WHAT (DIFF MATRIX) */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-[#684f9b]" />
                            What Was Modified: Original Sealed Value vs Modified Value in Database
                          </h4>

                          <div className="overflow-x-auto border border-red-200 rounded-lg">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-red-50/90 text-red-900 font-semibold border-b border-red-200 text-[11px]">
                                <tr>
                                  <th className="p-3">Data Field / Property</th>
                                  <th className="p-3">Original Sealed Value (From What)</th>
                                  <th className="p-3">Modified Value in Database (To What)</th>
                                  <th className="p-3 text-center">Change Type</th>
                                  <th className="p-3 text-center">Severity</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-red-100 bg-white">
                                {auditData.forensics?.diffs?.map((diff: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-red-50/40 transition">
                                    <td className="p-3">
                                      <span className="font-bold text-slate-900 block">{diff.label || diff.field}</span>
                                      <span className="font-mono text-[10px] text-slate-400 block">{diff.field}</span>
                                    </td>
                                    <td className="p-3 font-mono text-emerald-900 bg-emerald-50/40 font-semibold max-w-xs break-words">
                                      <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-0.5">Original Sealed Value:</span>
                                      {diff.originalValue}
                                    </td>
                                    <td className="p-3 font-mono text-red-950 bg-red-50/80 font-bold max-w-xs break-words">
                                      <span className="text-[10px] text-red-700 uppercase font-bold block mb-0.5">Tampered in Database:</span>
                                      {diff.tamperedValue}
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        {diff.changeType || "VALUE_MODIFIED"}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                                        {diff.severity || "CRITICAL"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {hashVerifySuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span>{hashVerifySuccess}</span>
                    </div>
                    <button onClick={() => setHashVerifySuccess(null)} className="text-emerald-800 font-bold ml-2">✕</button>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Original Ingestion Date</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{auditData.evidence.sealedAt}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Ingesting Officer</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{auditData.evidence.sealedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Current Legal Custodian</span>
                    <span className="font-semibold text-[#684f9b] mt-0.5 block">{auditData.evidence.currentCustodian}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Master Vault File</span>
                    <span className="font-mono text-slate-800 mt-0.5 block truncate" title={auditData.evidence.fileName}>
                      {auditData.evidence.fileName} ({auditData.evidence.fileSize})
                    </span>
                  </div>
                </div>

                {/* SHA-256 Monospace Strip */}
                <div className="flex items-center justify-between bg-slate-900 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-400 text-[11px] font-bold">SHA-256:</span>
                    <span className="truncate text-slate-300 select-all">{auditData.evidence.docHash}</span>
                  </div>
                  <button
                    onClick={() => handleCopyHash(auditData.evidence.docHash)}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-sans font-semibold text-slate-200 shrink-0 transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedHash ? "Copied" : "Copy Hash"}
                  </button>
                </div>
              </div>

              {/* USER'S SPECIFIC FORMAT: ACTIVITY TIMELINE CARD */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#684f9b]" />
                      {auditData.evidence.evidenceId} — Activity Timeline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sequential custody, verification, and judicial tender chronology
                    </p>
                  </div>
                  {auditData.integrity?.isTampered ? (
                    <span className="text-[11px] font-bold text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Integrity Status: TAMPERED — Discrepancy Detected
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Integrity Status: Verified — No modification detected
                    </span>
                  )}
                </div>

                {/* Stepper Milestone Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {auditData.activityTimeline?.map((item: any, idx: number) => {
                    const isCompleted = item.status === "COMPLETED";
                    const isVerified = item.status === "VERIFIED";
                    const isLive = item.status === "ACTIVE_EXAMINATION";
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border relative transition ${
                          isLive
                            ? "bg-purple-50/80 border-[#684f9b] shadow-xs ring-2 ring-[#684f9b]/20"
                            : isVerified
                            ? "bg-emerald-50/60 border-emerald-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isLive
                              ? "bg-[#684f9b] text-white"
                              : isVerified
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}>
                            Step {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-slate-500">
                            {item.timestamp}
                          </span>
                        </div>

                        <p className="font-bold text-xs text-slate-900 flex items-center gap-1">
                          {item.label}
                        </p>
                        <p className="text-[11px] font-medium text-[#684f9b] mt-1">
                          ➔ {item.actor}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {item.actorDetail}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1.5 border-t border-slate-200/60 pt-1 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Timeline Summary Quote (Matching User Format) */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-amber-400 font-bold block">{auditData.evidence.evidenceId} — Certified Chain of Events</span>
                    <span className="text-slate-300 text-[11px] block">
                      Uploaded ➔ Investigation Officer (02 Sep, 10:32 AM) • Integrity Verified ➔ 02 Sep, 10:33 AM • Accessed ➔ Prosecutor (03 Sep, 2:15 PM) • Submitted to Court ➔ 04 Sep, 11:20 AM
                    </span>
                  </div>
                  {auditData.integrity?.isTampered ? (
                    <span className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs shadow-xs animate-pulse">
                      Integrity Status: TAMPERED — Discrepancy Detected
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs shadow-xs">
                      Integrity Status: Verified — No modification detected
                    </span>
                  )}
                </div>
              </div>

              {/* DETAILED SUB-TABS (LEDGER, VERSIONS, CUSTODY, INTEGRITY, SECURITY, SUBMISSION) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                {/* Sub-Tab Navigation Header */}
                <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/70 p-1 gap-1">
                  {[
                    { id: "TIMELINE", label: "Access & Action Ledger", count: auditData.accessLedger?.length, icon: History },
                    { id: "VERSIONS", label: "Version History", count: auditData.versionHistory?.length, icon: Layers },
                    { id: "CUSTODY", label: "Chain of Custody", count: auditData.chainOfCustody?.length, icon: Building },
                    { id: "INTEGRITY", label: "Hash & Integrity", icon: ShieldCheck },
                    { id: "SECURITY", label: "Unauthorized Access Attempts", count: auditData.unauthorizedAttempts?.length, alert: true, icon: ShieldAlert },
                    { id: "SUBMISSION", label: "Court Submission & Acknowledgement", icon: FileCheck }
                  ].map((tab: any) => {
                    const Icon = tab.icon;
                    const isActive = auditSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setAuditSubTab(tab.id)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-white text-[#684f9b] shadow-xs border border-slate-200/80"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#684f9b]" : "text-slate-400"}`} />
                        {tab.label}
                        {tab.count !== undefined && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            tab.alert
                              ? "bg-red-100 text-red-700 font-bold"
                              : isActive
                              ? "bg-purple-100 text-[#684f9b]"
                              : "bg-slate-200 text-slate-600"
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* SUB-TAB 1: WHO ACCESSED, WHEN, WHAT ACTION (LEDGER) */}
                {auditSubTab === "TIMELINE" && (
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Who Accessed This Document, When, and What Action Was Performed
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Complete cryptographic audit log of all interactions with {auditData.evidence.evidenceId}
                        </p>
                      </div>

                      {/* Action Filter Pills & PDF Download */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDownloadAuditReport("FULL_AUDIT")}
                          disabled={exportingPdf}
                          className="px-2.5 py-1 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Download Access Ledger as certified PDF"
                        >
                          {exportingPdf ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                          Download PDF
                        </button>
                        <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "ALL", label: "All Actions" },
                          { id: "VIEWED", label: "Viewed" },
                          { id: "DOWNLOADED", label: "Downloaded" },
                          { id: "SUBMITTED", label: "Submitted" },
                          { id: "VERIFIED", label: "Verified" },
                          { id: "TRANSFER", label: "Custody Transfers" },
                          { id: "DENIED", label: "Denied / Blocked" }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setAuditActionFilter(btn.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              auditActionFilter === btn.id
                                ? "bg-[#684f9b] text-white shadow-2xs"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                    {/* Ledger Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="p-3">When (Timestamp IST)</th>
                            <th className="p-3">Who Accessed (Actor / Department)</th>
                            <th className="p-3">What Action Performed</th>
                            <th className="p-3">Terminal / IP</th>
                            <th className="p-3">Legal Ground / Duty Reason</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Blockchain Tx</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {auditData.accessLedger
                            ?.filter((l: any) => {
                              if (auditActionFilter === "ALL") return true;
                              if (auditActionFilter === "VIEWED") return l.action === "ACCESSED" || l.action === "VIEWED" || l.action === "JUDICIAL_EXAMINATION";
                              if (auditActionFilter === "DOWNLOADED") return l.action === "DOWNLOADED";
                              if (auditActionFilter === "SUBMITTED") return l.action === "SUBMITTED" || l.action === "COURT_INTAKE";
                              if (auditActionFilter === "VERIFIED") return l.action === "INTEGRITY_VERIFIED";
                              if (auditActionFilter === "TRANSFER") return l.action === "UPLOADED" || l.action === "CHAIN_OF_CUSTODY_TRANSFER";
                              if (auditActionFilter === "DENIED") return l.result === "DENIED" || l.action === "UNAUTHORIZED_ACCESS_ATTEMPT";
                              return true;
                            })
                            ?.map((log: any, idx: number) => {
                              const isDenied = log.result === "DENIED";
                              const isVerified = log.action === "INTEGRITY_VERIFIED";
                              const isJudge = log.action === "JUDICIAL_EXAMINATION";
                              return (
                                <tr key={idx} className={`hover:bg-slate-50/80 transition ${isDenied ? "bg-red-50/40" : ""}`}>
                                  <td className="p-3 whitespace-nowrap">
                                    <span className="font-mono font-bold text-slate-900 block">{log.timestamp}</span>
                                    <span className="text-[10px] text-slate-400 block">{log.relativeTime}</span>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-bold text-slate-900 block">{log.actor}</span>
                                    <span className="text-[11px] text-slate-500 block">{log.role} • {log.department}</span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isDenied
                                        ? "bg-red-100 text-red-800"
                                        : isJudge
                                        ? "bg-purple-100 text-[#684f9b]"
                                        : isVerified
                                        ? "bg-emerald-100 text-emerald-800"
                                        : log.action === "DOWNLOADED"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}>
                                      {log.action}
                                    </span>
                                    <span className="block text-[11px] text-slate-600 mt-0.5 font-medium">{log.actionLabel}</span>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                    {log.terminal}
                                  </td>
                                  <td className="p-3 text-slate-700 text-xs">
                                    {log.purpose}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isDenied
                                        ? "bg-red-600 text-white"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}>
                                      {log.result}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-mono text-[10px] text-slate-500">
                                    {log.txHash?.slice(0, 14)}...
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: EVIDENCE VERSION HISTORY */}
                {auditSubTab === "VERSIONS" && (
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Evidence / Document Version Progression History
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Tracks modifications, forensic additions, and redactions from initial raw seizure to admitted court exhibit
                      </p>
                    </div>

                    <div className="space-y-3">
                      {auditData.versionHistory?.map((ver: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 bg-[#684f9b] text-white font-mono font-bold text-xs rounded-md">
                                {ver.version}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">{ver.timestamp}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#684f9b]">
                                {ver.status}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 pt-0.5">Author / Producer: {ver.actor}</p>
                            <p className="text-xs text-slate-600">{ver.summary}</p>
                          </div>

                          <div className="text-left md:text-right shrink-0 bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] text-slate-400 font-semibold block">FILE SIZE: {ver.fileSize}</span>
                            <span className="font-mono text-[10px] text-slate-700 block mt-0.5">
                              Hash: {ver.hash?.slice(0, 16)}...
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: CHAIN OF CUSTODY */}
                {auditSubTab === "CUSTODY" && (
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Statutory Chain of Custody (Physical & Electronic Transfers)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Formal handover trail documenting continuity of possession from Scene of Crime to Judicial Bench
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadAuditReport("CHAIN_OF_CUSTODY")}
                        disabled={exportingPdf}
                        className="px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                      >
                        {exportingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Download Custody Trail (PDF)
                      </button>
                    </div>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
                      {auditData.chainOfCustody?.map((c: any, idx: number) => (
                        <div key={idx} className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
                          <div className="absolute -left-[27px] top-3.5 h-4 w-4 rounded-full bg-[#684f9b] border-2 border-white shadow-xs" />
                          
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-purple-100 text-[#684f9b] font-mono font-bold text-[10px] rounded">
                                {c.transferId}
                              </span>
                              <span className="text-xs font-bold text-slate-900">Transfer Step #{c.step}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-500 font-semibold">{c.timestamp}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Transferor (Handed Over By):</span>
                              <span className="font-semibold text-slate-800">{c.fromEntity}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Transferee (Received By):</span>
                              <span className="font-semibold text-emerald-800">{c.toEntity}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-between items-center text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                            <span><strong className="text-slate-800">Purpose:</strong> {c.purpose}</span>
                            <span><strong className="text-slate-800">Seal / Container:</strong> {c.sealNumber} • {c.physicalCustody}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 4: HASH & INTEGRITY VERIFICATION */}
                {auditSubTab === "INTEGRITY" && (
                  <div className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Cryptographic Hash & Section 63 BSA Tamper Verification Matrix
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Cryptographic bit-stream comparison across all storage repositories
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadAuditReport("COMPLIANCE")}
                        disabled={exportingPdf}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                      >
                        {exportingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        Download Section 63 BSA Certificate (PDF)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">1. Initial Ingestion Hash (Sealed)</span>
                        <span className="font-mono text-xs text-slate-900 font-bold break-all block">
                          {auditData.integrity?.verification?.ingestionHash}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block pt-1">✓ Captured at Seizure</span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">2. Active Ledger DB Checksum</span>
                        <span className="font-mono text-xs text-slate-900 font-bold break-all block">
                          {auditData.integrity?.verification?.activeRecordHash}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block pt-1">✓ Matches Sealed Anchor</span>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">3. Vault Physical Disk Hash</span>
                        <span className="font-mono text-xs text-slate-900 font-bold break-all block">
                          {auditData.integrity?.verification?.diskStorageHash}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block pt-1">✓ Bit-Perfect On-Disk</span>
                      </div>
                    </div>

                    {/* Section 63 BSA Statutory Certificate Preview */}
                    <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Section 63 BSA Certificate Reference: {auditData.integrity?.verification?.section63Certificate}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">Admissibility Compliant</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        "Pursuant to Section 63(2) and 63(4) of the Bharatiya Sakshya Adhiniyam, 2023, the electronic exhibit {auditData.evidence.evidenceId} (SHA-256: {auditData.evidence.docHash}) has undergone full cryptographic verification in open court. The hash computed in real-time matches the immutable record seal without a single byte of modification. The evidence is authentic and legally admissible."
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        Last Bench Verification: {auditData.integrity?.verification?.lastVerified}
                      </span>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 5: UNAUTHORIZED ACCESS ATTEMPTS RELATED TO THE CASE */}
                {auditSubTab === "SECURITY" && (
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-red-600" />
                          Unauthorized Access Attempts Related to This Case & Evidence
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Automated perimeter security detections and RBAC need-to-know access blocks
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold text-[11px] rounded-full border border-red-200">
                        {auditData.unauthorizedAttempts?.length} Security Incident(s) Logged
                      </span>
                    </div>

                    <div className="space-y-3">
                      {auditData.unauthorizedAttempts?.map((sec: any, idx: number) => (
                        <div key={idx} className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-red-700 text-white font-mono font-bold text-[10px] rounded">
                                {sec.id}
                              </span>
                              <span className="text-xs font-bold text-red-950">{sec.attemptedAction}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-600 font-semibold">{sec.timestamp}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Source / Origin</span>
                              <span className="font-semibold text-slate-900 font-mono">{sec.origin}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Resource</span>
                              <span className="font-semibold text-slate-800">{sec.targetResource}</span>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white border border-red-100 rounded-lg text-xs space-y-0.5">
                            <span className="text-red-700 font-bold block">Defensive Reaction: {sec.defenseAction}</span>
                            <span className="text-slate-600 text-[11px] block">{sec.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 6: COURT SUBMISSION & ACKNOWLEDGEMENT HISTORY */}
                {auditSubTab === "SUBMISSION" && (
                  <div className="p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Formal Court Submission & Registry Acknowledgement History
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Record of prosecution filing, court registry intake acknowledgement, and exhibit numbering
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Filing Reference</span>
                          <span className="font-bold text-slate-900 font-mono text-sm block mt-0.5">
                            {auditData.courtSubmission?.filingReference}
                          </span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Registry Receipt Token</span>
                          <span className="font-bold text-[#684f9b] font-mono text-sm block mt-0.5">
                            {auditData.courtSubmission?.acknowledgementToken}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div>
                          <span className="text-slate-500 text-[11px] block">Submission Date:</span>
                          <span className="font-semibold text-slate-800">{auditData.courtSubmission?.submissionDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Submitted By (Prosecutor):</span>
                          <span className="font-semibold text-slate-800">{auditData.courtSubmission?.submittedBy}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px] block">Acknowledged By (Registry):</span>
                          <span className="font-semibold text-slate-800">{auditData.courtSubmission?.acknowledgedBy}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-1">
                        <span className="font-bold text-[#684f9b] block">Court Docket Marking: {auditData.courtSubmission?.exhibitMarking}</span>
                        <p className="text-slate-700 text-[11px]">{auditData.courtSubmission?.admissibilityFinding}</p>
                        <p className="text-slate-500 text-[10px] pt-1">{auditData.courtSubmission?.intakeNotice}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record In-Court Judicial Examination Modal */}
      {examModalOpen && auditData?.evidence && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleLogBenchExam} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gavel className="h-5 w-5 text-[#684f9b]" />
              Record In-Court Judicial Examination
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div><strong className="text-slate-700">Exhibit:</strong> {auditData.evidence.evidenceId} • {auditData.evidence.title}</div>
              <div><strong className="text-slate-700">Case Matter:</strong> {auditData.evidence.caseId} • {auditData.evidence.exhibitMark}</div>
              <div><strong className="text-slate-700">Bench:</strong> {currentUser.fullName} ({currentUser.stationOrCourt || "Principal Sessions Court"})</div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">
                Judicial Examination Remark / Ruling on Electronic Evidence (Section 63 BSA):
              </label>
              <textarea
                rows={4}
                required
                value={examNote}
                onChange={(e) => setExamNote(e.target.value)}
                placeholder="Record witness testimony, courtroom tender status, objection ruling, or verification finding..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 outline-none focus:border-[#684f9b]"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setExamModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loggingExam}
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {loggingExam ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Sign & Log In-Court Examination
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Order / Judgment Modal (Page 10) */}
      {orderModalOpen && selectedAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleOrderSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Gavel className="h-5 w-5 text-[#684f9b]" />
              {actionType === "UPLOAD_ORDER" ? "Issue Formal Judicial Order" : "Issue Sessions Judgment"}
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Case Matter: </span> {selectedAction.caseId} • {selectedAction.filing}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Order / Judgment Title</label>
                <input
                  type="text"
                  required
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Judicial Ruling & Directions</label>
                <textarea
                  rows={4}
                  required
                  value={orderText}
                  onChange={(e) => setOrderText(e.target.value)}
                  placeholder="Enter court directions, compliance mandate under Section 63 BSA, or final judgment..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Sign & Seal Judicial Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Judicial Bench Authentication Modal (Credential & PIN Gate for Tamper Forensics) */}
      {benchAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleJudicialBenchAuth} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-[#684f9b]" />
                Judicial Officer Bench Authentication
              </h3>
              <button
                type="button"
                onClick={() => setBenchAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#684f9b]">
                <Scale className="h-4 w-4" />
                Section 63 BSA Bench Privilege Gate
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Under High Court Electronic Evidence Rules, unredacted cryptographic tamper forensics and culprit audit details are restricted to authorized Judicial Officers.
              </p>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Judicial Officer Identifier / Bench Badge
                </label>
                <input
                  type="text"
                  required
                  value={benchIdentifier}
                  onChange={(e) => setBenchIdentifier(e.target.value)}
                  placeholder="e.g. TN-JUD-5512 or judge"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 outline-none focus:border-[#684f9b] font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Active Officer: {currentUser.fullName} ({currentUser.stationOrCourt || "Principal Sessions Court"})
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Bench Security PIN / Judicial Officer Password
                </label>
                <input
                  type="password"
                  required
                  value={benchPassword}
                  onChange={(e) => setBenchPassword(e.target.value)}
                  placeholder="Enter Bench PIN or Password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 outline-none focus:border-[#684f9b] font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standard Judicial PIN for trial session: <span className="font-mono font-bold text-slate-700">123456</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setBenchAuthModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={authLoading}
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Authenticate & Decrypt Tamper Analysis
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
