"use client";

import React, { useState, ChangeEvent } from "react";
import axios from "axios";
import { Upload, ShieldCheck, FileText, CheckCircle2, Search, RefreshCw } from "lucide-react";
import { UserProfile, ScanResult } from "@/types";

interface IODashboardProps {
  currentUser: UserProfile;
}

export default function InvestigatingOfficerDashboard({ currentUser }: IODashboardProps) {
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
      setCommitStatus(`Anchored successfully! Tx Hash: ${res.data.blockchainTxHash}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Commit failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-900">
            <Upload className="h-4 w-4 text-[#684f9b]" /> Evidence Intake & Scanning
          </h2>
          <label className="border-2 border-dashed border-slate-300 hover:border-[#684f9b] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-purple-50/40 transition">
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-xs font-semibold text-slate-700">Click to upload case file / deed / PDF</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Supports PDF documents and image files</span>
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
          </label>

          {previewUrl && (
            <div className="mt-4 border border-slate-200 rounded-lg p-2 bg-slate-50">
              <p className="text-xs font-semibold text-slate-700 mb-2">Original File: {selectedFile?.name}</p>
              <div className="h-72 w-full bg-slate-900 rounded overflow-hidden flex justify-center">
                {isPdf ? (
                  <iframe src={previewUrl} title="PDF Preview" className="w-full h-full border-0" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="max-h-72 object-contain" />
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleScanPreview}
          disabled={!selectedFile || loading}
          className="w-full mt-4 bg-[#684f9b] hover:bg-[#5a4287] text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs transition shadow-sm cursor-pointer"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Extract Text & Compute SHA-256 Checksum
        </button>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-slate-900">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Human Verification & Anchoring
        </h2>

        {!scanResult ? (
          <div className="h-72 flex flex-col items-center justify-center text-slate-500 text-xs border border-slate-200 rounded-xl bg-slate-50">
            Upload and scan an exhibit to verify OCR transcript and commit to blockchain.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 block font-mono text-[10px] font-semibold">SHA-256 HASH</span>
              <span className="text-emerald-700 font-mono break-all font-medium">{scanResult.docHash}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-700 font-semibold">Case Reference</label>
                <input
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold">FIR / Diary Number</label>
                <input
                  type="text"
                  value={firNumber}
                  onChange={(e) => setFirNumber(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-700 font-semibold">Complainant Name</label>
                <input
                  type="text"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold">Accused Name(s)</label>
                <input
                  type="text"
                  value={accusedName}
                  onChange={(e) => setAccusedName(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold text-xs">Verified Transcript (Editable)</label>
              <textarea
                rows={4}
                value={verifiedText}
                onChange={(e) => setVerifiedText(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleCommit}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 text-xs transition shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" /> Lock & Anchor to Immutable Ledger
            </button>

            {commitStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 break-all font-medium">
                {commitStatus}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}