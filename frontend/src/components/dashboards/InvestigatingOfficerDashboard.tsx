"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { 
  Upload, ShieldCheck, FileText, CheckCircle2, Search, RefreshCw, 
  PlusCircle, FolderPlus, Clock, ArrowRight, ShieldAlert, Check, FileCheck, Layers
} from "lucide-react";
import { UserProfile, ScanResult, AssignedCase } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface IODashboardProps {
  currentUser: UserProfile;
}

export default function InvestigatingOfficerDashboard({ currentUser }: IODashboardProps) {
  const { t } = useLanguage();
  const [assignedCases, setAssignedCases] = useState<AssignedCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"CASES" | "INGESTION" | "ACTIVITY">("CASES");

  // Create Case Modal
  const [createCaseModalOpen, setCreateCaseModalOpen] = useState(false);
  const [newCaseId, setNewCaseId] = useState("");
  const [newFirNumber, setNewFirNumber] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newComplainant, setNewComplainant] = useState("");
  const [newAccused, setNewAccused] = useState("");

  // Ingestion State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const [firNumber, setFirNumber] = useState("FIR-2026-CBE-0142");
  const [caseId, setCaseId] = useState("CASE-2026-9042");
  const [complainantName, setComplainantName] = useState("K. Senthilkumar");
  const [accusedName, setAccusedName] = useState("P. Krishnakumar (and Others)");
  const [docType, setDocType] = useState("FIR");
  const [verifiedText, setVerifiedText] = useState("");
  const [commitStatus, setCommitStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchMyCases();
  }, []);

  const fetchMyCases = async () => {
    setLoadingCases(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get("http://localhost:8000/api/v1/documents/my-cases", config);
      setAssignedCases(res.data);
    } catch (err) {
      console.error("Error fetching assigned cases", err);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/create-case", {
        caseId: newCaseId,
        firNumber: newFirNumber,
        caseTitle: newCaseTitle,
        complainantName: newComplainant,
        accusedName: newAccused,
        policeStation: currentUser.stationOrCourt,
        district: currentUser.district
      }, config);

      setCreateCaseModalOpen(false);
      setCaseId(newCaseId);
      setFirNumber(newFirNumber);
      setComplainantName(newComplainant);
      setAccusedName(newAccused);
      fetchMyCases();
      setActiveTab("INGESTION");
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsPdf(file.type === "application/pdf" || file.name.endsWith(".pdf"));
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setCommitStatus(null);
    }
  };

  const handleScanPreview = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await axios.post("http://localhost:8000/api/v1/documents/scan-preview", formData, {
        headers: { Authorization: `Bearer ${currentUser.token}`, "Content-Type": "multipart/form-data" }
      });
      setScanResult(res.data);
      setVerifiedText(res.data.extractedText);
    } catch {
      alert("Error scanning document.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!scanResult) return;
    setLoading(true);
    try {
      const payload = {
        caseId: caseId || "CASE-DEFAULT",
        firNumber: firNumber || "FIR-001",
        policeStation: currentUser.stationOrCourt,
        district: currentUser.district,
        complainantName,
        accusedName,
        docType,
        docHash: scanResult.docHash,
        fileName: scanResult.fileName,
        officerBadgeNumber: currentUser.badgeNumber,
        officerName: currentUser.fullName,
        deviceIdentifier: "TERMINAL-IO-NODE-01",
        verifiedData: { text: verifiedText, detectedSections: scanResult.detectedSections, officerVerified: true }
      };

      const res = await axios.post("http://localhost:8000/api/v1/documents/commit", payload, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setCommitStatus(`Anchored successfully! Section 63 BSA Digital Seal: ${res.data.recordSealHash?.substring(0, 16)}...`);
      fetchMyCases();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Commit failed.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = assignedCases.filter(c => 
    c.caseTitle?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.caseId?.toLowerCase().includes(caseSearch.toLowerCase()) ||
    c.firNumber?.toLowerCase().includes(caseSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Principle Banner (Page 5) */}
      <div className="bg-purple-50 border-l-4 border-[#684f9b] p-3.5 rounded-r-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#684f9b] shrink-0" />
          <p className="text-xs text-slate-800">
            <span className="font-bold">Authorized Case Isolation:</span> As an Investigating Officer, you only possess evidentiary access to criminal cases assigned directly to you and your police station station.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreateCaseModalOpen(true)}
            className="px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
          >
            <FolderPlus className="h-3.5 w-3.5" /> {t("btn.createCase")}
          </button>
        </div>
      </div>

      {/* Top Cards (Page 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.activeCases")}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{assignedCases.length || 3}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Assigned & Authorized</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.pendingUpload")}</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">1</p>
          <span className="text-[10px] text-amber-600 font-medium">Seizure Memo Draft</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.pendingApproval")}</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">2</p>
          <span className="text-[10px] text-blue-600">SHO Supervisory Scrutiny</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.recentActivity")}</span>
          <p className="text-2xl font-bold text-purple-700 mt-1">4</p>
          <span className="text-[10px] text-purple-600 font-medium">Recorded Today</span>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("CASES")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "CASES" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" /> My Assigned Cases ({assignedCases.length})
        </button>
        <button
          onClick={() => setActiveTab("INGESTION")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "INGESTION" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Upload className="h-4 w-4" /> Evidence Intake & OCR
        </button>
        <button
          onClick={() => setActiveTab("ACTIVITY")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "ACTIVITY" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" /> Recent Activity
        </button>
      </div>

      {/* TAB 1: MY ASSIGNED CASES TABLE (Page 4) */}
      {activeTab === "CASES" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">My Assigned Cases</h3>
              <p className="text-xs text-slate-500">Case ID, Case title, Investigation status, Last activity, Number of documents</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={caseSearch}
                onChange={(e) => setCaseSearch(e.target.value)}
                placeholder="Search assigned cases..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Case Title & FIR</th>
                  <th className="p-3">Investigation Status</th>
                  <th className="p-3">Last Activity</th>
                  <th className="p-3">Documents</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c) => (
                  <tr key={c.caseId} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-[#684f9b]">{c.caseId}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{c.caseTitle}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.firNumber}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {c.investigationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">{c.lastActivity}</td>
                    <td className="p-3 font-bold text-slate-700">{c.documentCount} files</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setCaseId(c.caseId);
                          setFirNumber(c.firNumber);
                          setActiveTab("INGESTION");
                        }}
                        className="px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        {t("btn.uploadEvidence")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INGESTION WORKFLOW (Section 63 BSA & OCR) */}
      {activeTab === "INGESTION" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-900">
                <Upload className="h-4 w-4 text-[#684f9b]" /> Evidence Intake & OCR
              </h2>
              <label className="border-2 border-dashed border-slate-300 hover:border-[#684f9b] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-purple-50/40 transition">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">Click to upload case file / deed / PDF</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Supports PDF documents and image files</span>
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
              </label>

              {selectedFile && (
                <div className="mt-3 p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-1">
                  <p className="font-bold text-slate-900">Selected: {selectedFile.name}</p>
                  <p className="text-[11px] text-slate-600">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={handleScanPreview}
                    disabled={loading}
                    className="mt-2 w-full py-2 bg-[#684f9b] hover:bg-[#5a4287] text-white font-semibold rounded text-xs transition cursor-pointer"
                  >
                    {loading ? "Extracting OCR & Calculating SHA-256..." : "Scan & Extract Text"}
                  </button>
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden h-64 bg-slate-100 flex items-center justify-center">
                {isPdf ? (
                  <iframe src={previewUrl} className="w-full h-full" title="Evidence Preview" />
                ) : (
                  <img src={previewUrl} alt="Evidence" className="max-h-full object-contain" />
                )}
              </div>
            )}
          </section>

          {/* Commit Metadata Form */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Section 63 BSA Evidentiary Metadata
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <label className="font-semibold text-slate-700">FIR Number</label>
                  <input
                    type="text"
                    value={firNumber}
                    onChange={(e) => setFirNumber(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Case Reference ID</label>
                  <input
                    type="text"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Complainant</label>
                  <input
                    type="text"
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Accused</label>
                  <input
                    type="text"
                    value={accusedName}
                    onChange={(e) => setAccusedName(e.target.value)}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-1.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              {scanResult && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono break-all">
                    <span className="font-bold text-slate-600 block">SHA-256 Digest:</span>
                    <span className="text-[#684f9b]">{scanResult.docHash}</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">OCR Extracted Text</label>
                    <textarea
                      rows={5}
                      value={verifiedText}
                      onChange={(e) => setVerifiedText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {commitStatus && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                {commitStatus}
              </div>
            )}

            <button
              onClick={handleCommit}
              disabled={loading || !scanResult}
              className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Cryptographically Commit to Ledger (Sec 63 BSA)
            </button>
          </section>
        </div>
      )}

      {/* TAB 3: RECENT ACTIVITY FEED (Page 5) */}
      {activeTab === "ACTIVITY" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">{t("card.recentActivity")} (Page 5)</h3>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-bold text-slate-900">FIR uploaded</p>
                <p className="text-slate-500 text-[11px]">FIR-2026-CBE-0142 registered and hashed on ledger.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-bold text-slate-900">Evidence added</p>
                <p className="text-slate-500 text-[11px]">Digital Exhibit Ex.P-1 anchored with NIST SHA-256 seal.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-bold text-slate-900">Forensic report received</p>
                <p className="text-slate-500 text-[11px]">Dr. Ramanathan (SFSL) submitted DNA profile analysis report.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="font-bold text-slate-900">Document approved</p>
                <p className="text-slate-500 text-[11px]">Section 63 BSA certificate counter-signed by Supervisory SHO.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal (Page 4) */}
      {createCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateCaseSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#684f9b]" /> + Create New Case Docket
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Case ID</label>
                <input
                  type="text"
                  required
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  placeholder="e.g. CASE-2026-9043"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">FIR Number</label>
                <input
                  type="text"
                  required
                  value={newFirNumber}
                  onChange={(e) => setNewFirNumber(e.target.value)}
                  placeholder="e.g. FIR-2026-CBE-0143"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Case Title</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="State vs ..."
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Complainant Name</label>
                  <input
                    type="text"
                    required
                    value={newComplainant}
                    onChange={(e) => setNewComplainant(e.target.value)}
                    placeholder="Complainant"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Accused Name</label>
                  <input
                    type="text"
                    required
                    value={newAccused}
                    onChange={(e) => setNewAccused(e.target.value)}
                    placeholder="Accused"
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreateCaseModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Initialize Case Docket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
