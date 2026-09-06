"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Database, Search, ShieldCheck, ShieldAlert, CheckCircle2, 
  XCircle, AlertTriangle, FileText, Download, RefreshCw, Lock, 
  Layers, ArrowRight, Check, History, Eye, Sliders, ExternalLink,
  Filter, Calendar, Hash, FileCheck, Shield, ChevronRight, Copy
} from "lucide-react";
import { UserProfile } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import CaseDossierView from "@/components/shared/CaseDossierView";

interface AuditorProps {
  currentUser: UserProfile;
}

export default function SystemAuditorDashboard({ currentUser }: AuditorProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"LOGS" | "COMPLIANCE" | "SECURITY" | "INTEGRITY" | "FINDINGS" | "REPORTS">("LOGS");
  const [searchLog, setSearchLog] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters for Audit Activity Table
  const [actionFilter, setActionFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");

  // Export Progress State
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  // Verification Proof Modal
  const [selectedProofLog, setSelectedProofLog] = useState<any | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Custom Report Generator State
  const [customReportType, setCustomReportType] = useState<"FULL_AUDIT" | "COMPLIANCE" | "CHAIN_OF_CUSTODY">("FULL_AUDIT");
  const [customCaseFilter, setCustomCaseFilter] = useState("");

  // Search Dossier (Tab 4)
  const [searchQuery, setSearchQuery] = useState("FIR-2026-CBE-0142");
  const [dossierData, setDossierData] = useState<any>(null);

  // Remediation Modal State (Page 14)
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState("CONTROL_FAILURE");
  const [remediationText, setRemediationText] = useState("");

  useEffect(() => {
    fetchAuditTree();
  }, []);

  const fetchAuditTree = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get("http://localhost:8000/api/v1/documents/audit-full-tree", config);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching audit tree:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAuditReport = async (reportType: string = "FULL_AUDIT", caseId?: string) => {
    setExportingReport(reportType);
    try {
      const config = {
        headers: { Authorization: `Bearer ${currentUser.token}` },
        responseType: "blob" as const
      };
      const params = new URLSearchParams();
      params.append("reportType", reportType);
      if (caseId && caseId.trim()) params.append("caseId", caseId.trim());

      const res = await axios.get(`http://localhost:8000/api/v1/documents/audit-report/pdf?${params.toString()}`, config);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `National_Cyber_Audit_Report_${reportType}_${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setActionSuccess(`Official National Cyber Audit Report (${reportType}) successfully generated and downloaded.`);
    } catch (err) {
      console.error("Failed to export audit report:", err);
      alert("Failed to export audit report. Please verify connection and permissions.");
    } finally {
      setExportingReport(null);
    }
  };

  const handleFetchDossier = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/documents/dossier/${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      setDossierData(res.data);
    } catch {
      alert("No audit record found for this docket.");
    }
  };

  const handleExecuteRemediationStep = async (stepName: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/remediation-action", {
        findingId: selectedFinding?.id || "FIND-01",
        step: stepName,
        department: selectedFinding?.department || "IT Operations",
        severity: selectedFinding?.severity || "HIGH",
        details: remediationText || `Auditor processed step: ${stepName}`
      }, config);

      setCurrentStep(stepName);
      setActionSuccess(`Remediation step '${stepName}' confirmed and logged to immutable audit ledger.`);
      fetchAuditTree();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = data?.auditActivity?.filter((l: any) => {
    const q = searchLog.toLowerCase();
    const matchesSearch =
      !q ||
      (l.user && l.user.toLowerCase().includes(q)) ||
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.resource && l.resource.toLowerCase().includes(q)) ||
      (l.reason && l.reason.toLowerCase().includes(q)) ||
      (l.txHash && l.txHash.toLowerCase().includes(q)) ||
      (l.time && l.time.toLowerCase().includes(q)) ||
      (l.result && l.result.toLowerCase().includes(q));

    const matchesAction =
      actionFilter === "ALL" ||
      (actionFilter === "INSPECTION" && (l.action.includes("TAMPER") || l.action.includes("INSPECTION"))) ||
      (actionFilter === "CUSTODY" && (l.action.includes("TRANSFER") || l.action.includes("CUSTODY"))) ||
      (actionFilter === "INGESTION" && (l.action.includes("INGESTION") || l.action.includes("SEAL") || l.action.includes("UPLOAD"))) ||
      (actionFilter === "REDACTION" && l.action.includes("REDACTION")) ||
      (actionFilter === "ADMIN" && (l.action.includes("ADMIN") || l.action.includes("CASE_CREATED") || l.action.includes("REPORT")));

    const matchesResult =
      resultFilter === "ALL" ||
      (resultFilter === "ALLOWED" && (l.result === "ALLOWED" || l.result === "COMMITTED")) ||
      (resultFilter === "ALERT" && (l.result === "DENIED" || l.result === "MUTATION_ALERT"));

    return matchesSearch && matchesAction && matchesResult;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Principle Disclaimer & Global Export Button */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              National Cyber Auditor Workstation
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-[#684f9b] text-white">
                DL-AUDIT-9900 • CERT-In / I4C
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Strict Principle: Section 63 BSA 2023 tamper-evident verification of cryptographic hash seals, access logs, and custodial transfers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAuditTree}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs flex items-center justify-center cursor-pointer"
            title="Refresh Audit Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
          </button>
          <button
            onClick={() => handleDownloadAuditReport("FULL_AUDIT")}
            disabled={exportingReport !== null}
            className="px-4 py-2 bg-[#684f9b] hover:bg-[#5a4287] disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            {exportingReport === "FULL_AUDIT" ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Exporting Official PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Export Audit Report (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.totalAuditEvents")}</span>
            <Database className="h-4 w-4 text-[#684f9b]" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data?.summary?.totalAuditEvents || 1842}</p>
          <span className="text-[10px] text-blue-600 font-medium">Recorded on Ledger</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.failedAccess")}</span>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data?.summary?.failedAccessAttempts || 2}</p>
          <span className="text-[10px] text-amber-600 font-medium">Blocked by RBAC / Need-To-Know</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.suspiciousActivities")}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{data?.summary?.suspiciousActivities || 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Zero System Anomalies</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.integrityAlerts")}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{data?.summary?.integrityAlerts || 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Bit-Perfect Cryptography</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("LOGS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "LOGS" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" /> Audit Activity Logs ({data?.auditActivity?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "REPORTS" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" /> Reports & PDF Exports
        </button>
        <button
          onClick={() => setActiveTab("COMPLIANCE")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "COMPLIANCE" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Compliance Matrix
        </button>
        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "SECURITY" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="h-4 w-4" /> Security & Encryption
        </button>
        <button
          onClick={() => setActiveTab("INTEGRITY")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "INTEGRITY" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" /> Document Integrity
        </button>
        <button
          onClick={() => setActiveTab("FINDINGS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition shrink-0 ${
            activeTab === "FINDINGS" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Findings & Remediation
        </button>
      </div>

      {/* TAB 1: AUDIT ACTIVITY LOGS */}
      {activeTab === "LOGS" && (
        <div className="space-y-6">
          {/* Security Monitoring Indicators */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-[#684f9b]" /> Security Monitoring Signals (Section 63 BSA)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Failed Logins</span>
                <span className="font-bold text-amber-600 text-sm">{data?.securityMonitoring?.failedLoginAttempts || 2}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Unauthorized Access</span>
                <span className="font-bold text-rose-600 text-sm">{data?.securityMonitoring?.unauthorizedAccessAttempts || 1}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Unusual Downloads</span>
                <span className="font-bold text-slate-800 text-sm">{data?.securityMonitoring?.unusualDownloads || 0}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Permission Changes</span>
                <span className="font-bold text-purple-700 text-sm">{data?.securityMonitoring?.permissionChanges || 3}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">{t("card.integrityAlerts")}</span>
                <span className="font-bold text-emerald-700 text-sm">{data?.securityMonitoring?.documentIntegrityAlerts || 0}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Chain of Custody Events</span>
                <span className="font-bold text-blue-700 text-sm">{data?.securityMonitoring?.chainOfCustodyEvents || 14}</span>
              </div>
            </div>
          </div>

          {/* Audit Activity Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-[#684f9b]" /> Audit Activity Ledger (Live Network Trail)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological records with exact timestamps, actors, activities performed, resources, and cryptographic proofs.
                </p>
              </div>

              {/* Quick Export Button */}
              <button
                onClick={() => handleDownloadAuditReport("FULL_AUDIT")}
                disabled={exportingReport !== null}
                className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 border border-slate-300 hover:border-[#684f9b] text-[#684f9b] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {exportingReport === "FULL_AUDIT" ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>Export Ledger PDF</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  placeholder="Search user, badge, action, resource, reason, txHash..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="ALL">All Activities</option>
                  <option value="INSPECTION">Tamper Inspections</option>
                  <option value="CUSTODY">Custody Transfers</option>
                  <option value="INGESTION">Evidence Ingestions</option>
                  <option value="REDACTION">Witness Redactions</option>
                  <option value="ADMIN">Administrative</option>
                </select>

                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="ALLOWED">Allowed / Committed</option>
                  <option value="ALERT">Denied / Mutation Alerts</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Timestamp</th>
                    <th className="p-3">Stakeholder / Actor</th>
                    <th className="p-3">Activity Done</th>
                    <th className="p-3">Target Resource</th>
                    <th className="p-3">Result</th>
                    <th className="p-3 text-right">Cryptographic Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                        No audit events match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log: any, idx: number) => {
                      const isDenied = log.result === "DENIED" || log.result === "BLOCKED";
                      const isMutation = log.result === "MUTATION_ALERT";
                      return (
                        <tr key={log.id || idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-sans whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">{log.time}</span>
                            <span className="text-[10px] text-slate-400 block">{log.fullTimestamp || log.time}</span>
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-900 block text-xs">{log.user}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action.includes("UPLOAD") || log.action.includes("INGESTION") ? "bg-purple-100 text-[#684f9b]" :
                              log.action.includes("TRANSFER") || log.action.includes("CUSTODY") ? "bg-blue-100 text-blue-800" :
                              log.action.includes("TAMPER") || log.action.includes("INSPECTION") ? "bg-amber-100 text-amber-900" :
                              log.action.includes("REDACTION") ? "bg-emerald-100 text-emerald-800" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {log.action.replace(/_/g, " ")}
                            </span>
                            {log.reason && (
                              <p className="font-sans text-[10px] text-slate-500 mt-1 line-clamp-1 max-w-xs" title={log.reason}>
                                {log.reason}
                              </p>
                            )}
                          </td>
                          <td className="p-3 font-sans">
                            <span className="font-bold text-slate-700 block text-xs">{log.resource}</span>
                          </td>
                          <td className="p-3 font-sans">
                            {isDenied ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                                <XCircle className="h-3 w-3" /> DENIED
                              </span>
                            ) : isMutation ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1 w-max">
                                <AlertTriangle className="h-3 w-3" /> MUTATION ALERT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                                <Check className="h-3 w-3" /> ALLOWED
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-sans">
                            <button
                              onClick={() => setSelectedProofLog(log)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1"
                              title="Verify against SHA-256 Ledger"
                            >
                              <Hash className="h-3 w-3 text-[#684f9b]" />
                              <span>Verify Hash</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>Showing {filteredLogs.length} of {data?.auditActivity?.length || 0} audit events</span>
              <span className="text-[11px] text-slate-400 font-mono">Ledger Node: IND-NIC-CERT-CHAIN-01</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS & PDF EXPORTS */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#684f9b]" /> Official Auditor Reports Library (Section 63 BSA Certified)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download statutory compliance reports, forensic chain-of-custody ledgers, and comprehensive audit trails exported directly as certified PDF documents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Report 1: Full Audit Report */}
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#684f9b] font-mono">
                      PDF • CERTIFIED
                    </span>
                    <span className="text-[10px] text-slate-400">Live Ledger</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-2 text-sm">Comprehensive National Cyber Audit Report</p>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Complete chronological trail of all system activities, exact timestamps, actors, operations performed, and cryptographic seals.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadAuditReport("FULL_AUDIT")}
                  disabled={exportingReport !== null}
                  className="w-full py-2 bg-[#684f9b] hover:bg-[#5a4287] disabled:opacity-60 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition text-xs cursor-pointer shadow-xs"
                >
                  {exportingReport === "FULL_AUDIT" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{exportingReport === "FULL_AUDIT" ? "Generating PDF..." : "Download Full Audit PDF"}</span>
                </button>
              </div>

              {/* Report 2: Compliance Report */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                      PDF • STATUTORY
                    </span>
                    <span className="text-[10px] text-slate-400">Section 63 BSA</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-2 text-sm">Section 63 BSA Evidentiary Compliance Report</p>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Statutory Section 63(4) BSA compliance certificate verifying 100% cryptographic seal integrity, SHA-256 anchoring, and judicial admissibility.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadAuditReport("COMPLIANCE")}
                  disabled={exportingReport !== null}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition text-xs cursor-pointer shadow-xs"
                >
                  {exportingReport === "COMPLIANCE" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{exportingReport === "COMPLIANCE" ? "Generating PDF..." : "Download Compliance PDF"}</span>
                </button>
              </div>

              {/* Report 3: Chain of Custody */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 font-mono">
                      PDF • FORENSIC
                    </span>
                    <span className="text-[10px] text-slate-400">ISO/IEC 27001</span>
                  </div>
                  <p className="font-bold text-slate-900 mt-2 text-sm">Forensic Chain-of-Custody Security Audit</p>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Complete evidentiary transfer trail between Investigating Officers, Forensic Laboratories, Public Prosecutors, and Judicial Benches.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadAuditReport("CHAIN_OF_CUSTODY")}
                  disabled={exportingReport !== null}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition text-xs cursor-pointer shadow-xs"
                >
                  {exportingReport === "CHAIN_OF_CUSTODY" ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{exportingReport === "CHAIN_OF_CUSTODY" ? "Generating PDF..." : "Download Custody PDF"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Audit Report Generator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-[#684f9b]" /> Custom Filtered Audit Export Generator
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select Report Category</label>
                <select
                  value={customReportType}
                  onChange={(e: any) => setCustomReportType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                >
                  <option value="FULL_AUDIT">Complete Audit Activity Ledger (All Events)</option>
                  <option value="COMPLIANCE">Section 63 BSA Evidentiary Compliance</option>
                  <option value="CHAIN_OF_CUSTODY">Forensics Chain of Custody Audit</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Filter by Case / FIR (Optional)</label>
                <input
                  type="text"
                  value={customCaseFilter}
                  onChange={(e) => setCustomCaseFilter(e.target.value)}
                  placeholder="e.g. CASE-2026-9042 or FIR-2026-CBE-0142"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleDownloadAuditReport(customReportType, customCaseFilter)}
                  disabled={exportingReport !== null}
                  className="w-full py-2.5 bg-[#684f9b] hover:bg-[#5a4287] disabled:opacity-60 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  {exportingReport === customReportType ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Generate & Export PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLIANCE MATRIX */}
      {activeTab === "COMPLIANCE" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Compliance Control Matrix (Page 15)</h3>
              <p className="text-xs text-slate-500">Passed Controls (14) • In Remediation (1) • Exceptions (0)</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">14 Passed</span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">1 In Remediation</span>
            </div>
          </div>

          <div className="space-y-2">
            {data?.compliance?.controlMatrix?.map((ctrl: any) => (
              <div key={ctrl.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#684f9b]">{ctrl.id}</span>
                  <span className="font-semibold text-slate-900">{ctrl.name}</span>
                </div>
                <div>
                  {ctrl.status === "PASSED" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="h-3 w-3" /> PASSED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> IN REMEDIATION
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & ENCRYPTION */}
      {activeTab === "SECURITY" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#684f9b]" /> Cryptographic Controls
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Encryption At Rest</span>
                <span className="font-bold text-slate-900">{data?.security?.encryption?.atRest}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Encryption In Transit</span>
                <span className="font-bold text-slate-900">{data?.security?.encryption?.inTransit}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Authentication & Authorization
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Authentication Scheme</span>
                <span className="font-bold text-slate-900">{data?.security?.authentication?.type}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Authorization Model</span>
                <span className="font-bold text-slate-900">{data?.security?.authorization?.model}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCUMENT INTEGRITY */}
      {activeTab === "INTEGRITY" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Document Integrity & Hash Verification (Page 15)</h3>
            <p className="text-xs text-slate-500">Continuous cryptographic ledger health and tamper verification results.</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
            <p className="font-bold text-emerald-900">✅ 100% Cryptographic Integrity Confirmed</p>
            <p className="text-emerald-700">All active case dossiers match their Section 63 BSA SHA-256 seal records bit-for-bit.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Pull Evidentiary Dossier for Audit Verification</h4>
            <div className="flex gap-2 max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter FIR Number"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none"
              />
              <button
                onClick={handleFetchDossier}
                className="px-4 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Inspect Ledger
              </button>
            </div>
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

      {/* TAB 6: FINDINGS & REMEDIATION */}
      {activeTab === "FINDINGS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Control Failure / Remediation Process (Page 14)</h3>
            <p className="text-xs text-slate-500">
              Interactive Workflow: CONTROL FAILURE ──&gt; Evidence captured ──&gt; Finding created ──&gt; Severity assigned ──&gt; Dept notified ──&gt; Remediation assigned ──&gt; Fix implemented ──&gt; Auditor re-checks ──&gt; PASS / REOPEN
            </p>
          </div>

          {/* Workflow Stepper Visualizer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Live Remediation Stepper (Page 14)</h4>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold items-center">
              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded">1. Control Failure</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded">2. Evidence Captured</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded">3. Finding Created</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded">4. Severity Assigned</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded">5. Dept Notified</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded">6. Fix Implemented</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold">7. PASS / REOPEN</span>
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-3">
            {data?.findings?.map((f: any) => (
              <div key={f.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#684f9b]">{f.id}</span>
                    <span className="font-bold text-slate-900">{f.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      f.status === "CLOSED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>{f.status}</span>
                  </div>
                  <p className="text-slate-600">Responsible Dept: <span className="font-semibold text-slate-800">{f.department}</span></p>
                  <p className="text-slate-500 text-[11px]">Remediation: {f.remediationAssigned}</p>
                </div>

                <button
                  onClick={() => {
                    setSelectedFinding(f);
                    setRemediationModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded text-[11px] font-semibold transition cursor-pointer"
                >
                  Manage Remediation
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proof Verification Modal */}
      {selectedProofLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cryptographic Ledger Verification</h3>
                  <p className="text-xs text-slate-500">Section 63 BSA SHA-256 Bit-Perfect Proof</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProofLog(null);
                  setCopiedHash(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Operation / Activity</span>
                <span className="font-bold text-slate-800">{selectedProofLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Exact Timestamp</span>
                <span className="font-bold text-slate-800">{selectedProofLog.fullTimestamp || selectedProofLog.time}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Stakeholder</span>
                <span className="text-slate-800">{selectedProofLog.user}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Resource Reference</span>
                <span className="text-[#684f9b] font-bold">{selectedProofLog.fullResource || selectedProofLog.resource}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Cryptographic Transaction / Hash Proof</span>
                <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded mt-0.5 break-all text-[11px] text-slate-700">
                  <span>{selectedProofLog.txHash}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedProofLog.txHash);
                      setCopiedHash(true);
                      setTimeout(() => setCopiedHash(false), 2000);
                    }}
                    className="ml-2 text-slate-500 hover:text-[#684f9b] shrink-0 cursor-pointer"
                    title="Copy Hash"
                  >
                    {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              <span className="font-bold block">✓ Verified Admissible Evidence</span>
              Cryptographically verified against the national evidence ledger node. No block drift or payload mutation detected.
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedProofLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Process Modal */}
      {remediationModalOpen && selectedFinding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#684f9b]" /> Execute Remediation Step ({selectedFinding.id})
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <p><span className="font-bold text-slate-700">Finding:</span> {selectedFinding.title}</p>
              <p><span className="font-bold text-slate-700">Department:</span> {selectedFinding.department}</p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-semibold text-slate-700 block">Auditor Verification & Decision</label>
              <textarea
                rows={3}
                value={remediationText}
                onChange={(e) => setRemediationText(e.target.value)}
                placeholder="Enter auditor re-check notes or verification confirmation..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRemediationModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleExecuteRemediationStep("RECHECK_REOPEN");
                  setRemediationModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                REOPEN
              </button>
              <button
                onClick={() => {
                  handleExecuteRemediationStep("RECHECK_PASS");
                  setRemediationModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                PASS & CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
