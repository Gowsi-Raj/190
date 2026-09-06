"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  ShieldAlert, 
  Lock, 
  Hash, 
  ShieldCheck, 
  UserCheck,
  RefreshCw,
  Scale,
  Clock,
  AlertOctagon,
  Eye,
  KeyRound,
  FileWarning,
  Copy,
  Check,
  ChevronRight,
  Gavel
} from "lucide-react";
import { useLanguage, AccessibilityBar } from "@/context/LanguageContext";

function VerifyContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash") || "";
  const fir = searchParams.get("fir") || "";
  const badge = searchParams.get("badge") || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthentic, setIsAuthentic] = useState<boolean>(false);
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [tamperMessage, setTamperMessage] = useState<string>("");
  const [tamperDetails, setTamperDetails] = useState<any>(null);
  const [matchedDoc, setMatchedDoc] = useState<any>(null);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>("");

  // Judicial Privileged Inspection State
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [benchIdentifier, setBenchIdentifier] = useState<string>("TN-JUD-5512");
  const [benchPassword, setBenchPassword] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [forensicData, setForensicData] = useState<any | null>(null);
  const [forensicLoading, setForensicLoading] = useState<boolean>(false);
  const [copiedRuling, setCopiedRuling] = useState<boolean>(false);

  const verifyRecord = useCallback(async () => {
    if (!hash || hash.trim() === "") {
      setIsAuthentic(false);
      setIsTampered(true);
      setTamperMessage("No SHA-256 cryptographic hash provided in QR code.");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("hash", hash.trim());
      if (fir && fir !== "N/A") queryParams.set("fir", fir.trim());
      if (badge && badge !== "N/A") queryParams.set("badge", badge.trim());

      const res = await fetch(`/api/verify-record?${queryParams.toString()}`, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      const data = await res.json();

      setLastCheckedTime(new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));

      // Re-verifying database automatically re-locks privileged view
      setForensicData(null);

      if (data.isAuthentic && !data.isTampered) {
        setIsAuthentic(true);
        setIsTampered(false);
        setMatchedDoc(data.doc);
        setAuditTrail(data.auditTrail || []);
        setTamperMessage("");
        setTamperDetails(null);
      } else {
        setIsAuthentic(false);
        setIsTampered(true);
        setTamperMessage(data.message || data.reason || "TAMPER DETECTED: Hash or database record mismatch.");
        setTamperDetails(data);
        setMatchedDoc(data.doc || null);
      }
    } catch (err: any) {
      setIsAuthentic(false);
      setIsTampered(true);
      setTamperMessage("Unable to connect to verification server. Ensure backend and frontend are running.");
      setForensicData(null);
    } finally {
      setLoading(false);
    }
  }, [hash, fir, badge]);

  useEffect(() => {
    verifyRecord();
  }, [verifyRecord]);

  const fetchForensicReport = async (token: string) => {
    setForensicLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`/api/tamper-forensics?hash=${encodeURIComponent(hash.trim())}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unauthorized to access privileged forensic report.");
      }
      setForensicData(data);
      setAuthModalOpen(false);
    } catch (err: any) {
      setAuthError(err.message || "Failed to load forensic analysis.");
    } finally {
      setForensicLoading(false);
    }
  };

  const handleOpenJudicialUnlock = () => {
    // ALWAYS ask for fresh judicial authentication modal every single time the button is clicked,
    // even without refreshing the page and regardless of any stored credentials.
    setAuthError(null);
    setBenchPassword("");
    setAuthModalOpen(true);
  };

  const handleJudicialAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/judicial-bench-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: benchIdentifier.trim(),
          pinOrPassword: benchPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication as Judicial Officer failed. Invalid credentials.");
      }

      // Fresh bench token for this single privileged inspection session in memory
      if (data.access_token) {
        await fetchForensicReport(data.access_token);
        setBenchPassword(""); // Clear PIN immediately from state
      }
    } catch (err: any) {
      setAuthError(err.message || "Judicial Bench authentication error.");
    } finally {
      setAuthLoading(false);
    }
  };

  const copyFindingToClipboard = () => {
    if (forensicData?.statutoryJudicialFinding) {
      navigator.clipboard.writeText(forensicData.statutoryJudicialFinding);
      setCopiedRuling(true);
      setTimeout(() => setCopiedRuling(false), 2500);
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return "N/A";
    try {
      const d = new Date(ts.endsWith("Z") || ts.includes("+") ? ts : `${ts}Z`);
      return isNaN(d.getTime()) ? ts : d.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium"
      });
    } catch {
      return ts;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center space-y-4 max-w-xs bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
          <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
            <RefreshCw className="h-10 w-10 text-[#684f9b] animate-spin" />
            <ShieldCheck className="h-5 w-5 text-[#684f9b] absolute" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Verifying Ledger Integrity</h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Validating live database record, SHA-256 seal, and chain of custody...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      
      {/* Tamil Nadu Police Portal Header Banner */}
      <header className="bg-[#684f9b] text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs tracking-wider shadow-inner text-amber-300">
              <Scale className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Tamil Nadu Police
              </h1>
              <p className="text-[10px] text-purple-200">
                Crime and Criminal Tracking Network & Systems (CCTNS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-purple-100">
            <span className="hidden sm:inline-block hover:underline cursor-pointer">{t("portal.helpline")}</span>
            <span className="hidden sm:inline-block text-purple-300">|</span>
            <AccessibilityBar />
          </div>
        </div>

        {/* Sub-navbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-1.5 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-[#684f9b] font-semibold">e-Verification Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 text-[11px]">Section 63 BSA Digital Admissibility</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Secure Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Verification Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          
          {/* Top Status Header */}
          <div className="text-center space-y-2">
            {isAuthentic ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                {language === "ta" ? "100% அசல் & பதிவேட்டில் பாதுகாக்கப்பட்டது" : "100% BIT-PERFECT & LEDGER ANCHORED"}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 border border-red-300 text-red-800 text-xs font-semibold shadow-sm animate-pulse">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
                {language === "ta" ? "பாதுகாப்பு எச்சரிக்கை: தரவு மாற்றம் கண்டறியப்பட்டது" : "TAMPER DETECTED: INTEGRITY BREACH"}
              </div>
            )}
            
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <Scale className="h-4 w-4 text-[#684f9b]" />
              {language === "ta" ? "தேசிய நீதித்துறை சான்றாதார சரிபார்ப்பு" : "National Judicial Evidence Verification"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {language === "ta" ? "பிரிவு 63 பாரதிய சாட்சிய சட்டம் (BSA) 2023 டிஜிட்டல் சான்றிதழ் முத்திரை" : "Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Digital Certificate Seal"}
            </p>
          </div>

          {/* Dynamic Card Display */}
          {isAuthentic ? (
            <div className="space-y-3.5 text-xs">
              
              {/* SHA-256 Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px] uppercase font-semibold">
                  <Hash className="h-3 w-3 text-[#684f9b]" />
                  {language === "ta" ? "SHA-256 சான்றாதார குறியீடு" : "SHA-256 Evidence Checksum"}
                </span>
                <p className="text-emerald-700 font-mono break-all text-[11px] leading-tight font-medium">
                  {hash}
                </p>
              </div>

              {/* Case Particulars Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
                    <ShieldCheck className="h-3 w-3 text-[#684f9b]" />
                    {language === "ta" ? "முதல் தகவல் அறிக்கை / வழக்கு" : "Case / FIR Reference"}
                  </span>
                  <p className="text-slate-900 font-bold mt-0.5 text-xs">{matchedDoc?.firNumber || fir}</p>
                  <p className="text-slate-500 text-[10px]">{matchedDoc?.caseId || "N/A"}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
                    <UserCheck className="h-3 w-3 text-[#684f9b]" />
                    {language === "ta" ? "சான்றளித்த அதிகாரி" : "Attesting Officer"}
                  </span>
                  <p className="text-slate-900 font-bold mt-0.5 text-xs">{matchedDoc?.officerBadgeNumber || badge || "TN-POL-4921"}</p>
                  <p className="text-slate-500 text-[10px]">{matchedDoc?.officerName || "Investigating Officer"}</p>
                </div>
              </div>

              {/* Details Table */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Police Jurisdiction:</span>
                  <span className="text-slate-900 font-semibold text-right">
                    {matchedDoc?.policeStation || "Central Police Station"}, {matchedDoc?.district || "Coimbatore"}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Parties Involved:</span>
                  <span className="text-slate-900 font-semibold text-right">
                    {matchedDoc?.complainantName || "N/A"} <span className="text-slate-400">vs</span> {matchedDoc?.accusedName || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Document Type:</span>
                  <span className="text-[#684f9b] font-mono font-semibold">{matchedDoc?.docType || "FIR"}</span>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Current Custodian:</span>
                  <span className="text-emerald-700 font-semibold">{matchedDoc?.currentCustodian || "Investigating Officer"}</span>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Sealed Timestamp:</span>
                  <span className="text-slate-800 font-medium">{formatTimestamp(matchedDoc?.timestamp)}</span>
                </div>

                <div className="flex justify-between items-start py-0.5">
                  <span className="text-slate-500 font-medium shrink-0">Tx Reference:</span>
                  <span className="text-[#684f9b] font-mono text-[10px] break-all text-right ml-2 font-medium">
                    {matchedDoc?.blockchainTxHash || "0xsimulated_tx"}
                  </span>
                </div>
              </div>

              {/* Audit Trail Section if available */}
              {auditTrail.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-slate-700 font-semibold text-[10px] flex items-center gap-1 uppercase tracking-wider">
                    <Clock className="h-3 w-3 text-amber-600" /> Custody Audit Ledger ({auditTrail.length} Events)
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {auditTrail.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-[10px] space-y-0.5 shadow-sm">
                        <div className="flex justify-between text-[#684f9b] font-semibold">
                          <span>{item.action}</span>
                          <span className="text-slate-500 font-mono">{formatTimestamp(item.timestamp)}</span>
                        </div>
                        <p className="text-slate-800">{item.fromEntity} ➔ {item.toEntity}</p>
                        <p className="text-slate-500 italic">Reason: {item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Anchoring Stamp */}
              <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-[10px] text-purple-950 flex items-center gap-2 font-medium">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#684f9b]" />
                <span>Bit-perfect match verified against live MongoDB database ledger.</span>
              </div>
            </div>
          ) : (
            /* TAMPER DETECTED DISPLAY */
            <div className="space-y-4 text-xs">
              
              {/* Public High-Level Alert */}
              <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-center space-y-2">
                <AlertOctagon className="h-9 w-9 text-red-600 mx-auto" />
                <p className="text-red-900 font-bold text-sm">INTEGRITY BREACH DETECTED</p>
                <div className="text-[11px] text-red-900 bg-white p-3 rounded-lg border border-red-200 text-left space-y-1 shadow-sm">
                  <p className="font-semibold text-red-700">Verification Failure Diagnosis:</p>
                  <p className="leading-relaxed text-slate-800">{tamperMessage}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-mono text-[10px] font-semibold">SCANNED QR HASH:</span>
                <p className="text-red-700 font-mono break-all text-[11px] font-medium">{hash || "INVALID_OR_MISSING"}</p>
              </div>

              {/* Statutory Admissibility Warning */}
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-[11px] text-slate-800 space-y-1">
                <p className="text-red-700 font-semibold flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" /> Statutory Legal Impact:
                </p>
                <p className="text-slate-700 text-[10px] leading-relaxed">
                  Pursuant to Section 63(4) of the <strong>Bharatiya Sakshya Adhiniyam (BSA), 2023</strong>, this electronic evidence record fails cryptographic verification and is <strong>INADMISSIBLE IN A COURT OF LAW</strong> due to record modification or database tampering.
                </p>
              </div>

              {/* PRIVILEGED JUDICIAL FORENSIC INSPECTION SECTION */}
              {!forensicData ? (
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        {language === "ta" ? "நீதித்துறை சலுகை பாதுகாப்பு (ரகசிய தடய விவரங்கள்)" : "Privileged Judicial Evidence Protection"}
                      </h4>
                      <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                        {language === "ta" 
                          ? "எந்த தரவு எதிலிருந்து எதற்கு மாற்றப்பட்டது மற்றும் யார் மாற்றினார்கள் என்ற விவரங்கள் ரகசியமானவை. அவை நீதித்துறை அதிகாரிக்கு மட்டுமே காட்டப்படும்."
                          : "Sensitive information regarding which specific data fields were altered from what to what and attribution of tampering are classified under Section 63 BSA Judicial Privilege."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenJudicialUnlock}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#684f9b] hover:bg-[#5a4287] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Scale className="h-4 w-4 text-amber-300" />
                    {language === "ta" ? "நீதித்துறை அதிகாரி சரிபார்ப்பு (முழு விவரங்களை பார்க்க)" : "Authenticate as Judicial Officer for Tamper Forensics"}
                  </button>
                </div>
              ) : (
                /* PRIVILEGED FORENSIC DOSSIER UNLOCKED */
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-purple-400/40 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg">
                        <Gavel className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Classified Bench Inspection</span>
                        <h3 className="text-sm font-bold text-white">Section 63 BSA Forensic Tamper Matrix</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setForensicData(null);
                        setBenchPassword("");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5 text-amber-400" />
                      {language === "ta" ? "பார்வையை மீண்டும் பூட்டு" : "Re-lock Dossier"}
                    </button>
                  </div>

                  {/* Summary Metric */}
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-red-300 uppercase font-semibold block">Integrity Violation Analysis</span>
                      <p className="text-xs font-bold text-red-200 mt-0.5">
                        {forensicData.diffCount} Mutated Case Attribute(s) Detected
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                      INADMISSIBLE
                    </span>
                  </div>

                  {/* FIELD-BY-FIELD DIFF TABLE: WHAT CHANGED FROM WHAT TO WHAT */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                        <FileWarning className="h-3.5 w-3.5 text-amber-400" />
                        What Data Was Tampered: Sealed Baseline vs. Current Database
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-800/80 text-slate-400 uppercase text-[9px] font-semibold border-b border-slate-700">
                          <tr>
                            <th className="p-2.5">Attribute</th>
                            <th className="p-2.5 text-emerald-400">Original Sealed Value (BSA Issuance)</th>
                            <th className="p-2.5 text-red-400">Tampered Database Value (Current DB)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950/40 font-mono">
                          {forensicData.diffs && forensicData.diffs.length > 0 ? (
                            forensicData.diffs.map((d: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/30 transition">
                                <td className="p-2.5 font-sans font-semibold text-slate-300">
                                  {d.label}
                                  <span className="block text-[9px] text-slate-500 font-sans">{d.description}</span>
                                </td>
                                <td className="p-2.5 text-emerald-300 bg-emerald-950/20 break-all font-medium">
                                  {d.originalValue}
                                </td>
                                <td className="p-2.5 text-red-300 bg-red-950/30 break-all font-bold">
                                  {d.tamperedValue}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-3 text-center text-slate-400 font-sans">
                                Metadata fields intact. Cryptographic seal hash signature mismatch.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ATTRIBUTION BOX: WHO TAMPERED IT & EXACT TIMESTAMP */}
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 text-xs shadow-inner">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Forensic Culprit Attribution & Tamper Timestamp (Who and When)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80">
                        <span className="text-amber-400 font-bold block text-[10px] uppercase">Who Tampered It (Culprit):</span>
                        <span className="text-white font-bold text-xs mt-0.5 block">{forensicData.attribution?.tamperActor}</span>
                        <span className="text-slate-400 text-[10px] mt-1 block">Method: {forensicData.attribution?.tamperMethod}</span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80">
                        <span className="text-amber-400 font-bold block text-[10px] uppercase">When It Happened (Exact Timestamp):</span>
                        <span className="text-amber-200 font-mono font-bold text-xs mt-0.5 block">{forensicData.attribution?.tamperTimestamp}</span>
                        <span className="text-slate-400 text-[10px] mt-1 block">{forensicData.attribution?.tamperWindow}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                      <div>
                        <span>Last Lawful Custodian: </span>
                        <span className="text-slate-200 font-semibold">{forensicData.attribution?.currentCustodian}</span>
                      </div>
                      <div>
                        <span>Original Attesting Officer: </span>
                        <span className="text-slate-200 font-semibold">{forensicData.attribution?.attestingOfficer}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[10px] text-amber-200">
                      {forensicData.attribution?.tamperWarning}
                    </div>
                  </div>

                  {/* PRE-DRAFTED JUDICIAL RULING & EXPORT */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        Statutory Court Order Finding (Section 63(4) BSA 2023)
                      </span>
                      <button
                        onClick={copyFindingToClipboard}
                        className="flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded cursor-pointer transition"
                      >
                        {copiedRuling ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedRuling ? "Order Copied!" : "Copy Judicial Order"}
                      </button>
                    </div>

                    <pre className="p-3 bg-black/60 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                      {forensicData.statutoryJudicialFinding}
                    </pre>
                  </div>

                  {/* Bottom Bar with Metadata & Re-lock Button */}
                  <div className="text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center pt-2 border-t border-slate-800 gap-2">
                    <div>
                      <span>Inspected by: {forensicData.attribution?.inspectedBy}</span>
                      <span className="mx-2 hidden sm:inline">•</span>
                      <span>Bench Time: {formatTimestamp(forensicData.attribution?.inspectedAt)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setForensicData(null);
                        setBenchPassword("");
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Lock className="h-3 w-3 text-amber-400" />
                      {language === "ta" ? "முடிந்தது / பூட்டு" : "Close & Re-lock Dossier"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Live Re-verify / Refresh Button */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-[10px] text-slate-500">
              Last checked: {lastCheckedTime || "Just now"}
            </span>
            <button
              onClick={() => verifyRecord()}
              disabled={loading}
              className="w-full sm:w-auto bg-[#684f9b] hover:bg-[#5a4287] text-white px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-purple-200 ${loading ? "animate-spin" : ""}`} />
              Re-verify Live Database
            </button>
          </div>

        </div>
      </div>

      {/* JUDICIAL OFFICER IN-COURT BENCH AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form onSubmit={handleJudicialAuthSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-[#684f9b] rounded-xl">
                <Gavel className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === "ta" ? "நீதிமன்ற அமர்வு அடையாள சரிபார்ப்பு" : "Judicial Officer Bench Authentication"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === "ta" ? "நீதிமன்ற அமர்வு பிரிவு 63 BSA தடயவியல் ஆய்வு" : "In-Courtroom Section 63 BSA Tamper Inspection"}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900 flex items-start gap-2">
              <Lock className="h-3.5 w-3.5 text-[#684f9b] shrink-0 mt-0.5" />
              <span>
                {language === "ta"
                  ? "ரகசிய விவரங்களைப் பார்க்க ஒவ்வொரு முறையும் நீதித்துறை அடையாள சரிபார்ப்பு கட்டாயமாகும்."
                  : "Every inspection requires fresh judicial authentication to access classified evidentiary particulars."}
              </span>
            </div>

            {authError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {authError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === "ta" ? "நீதித்துறை அதிகாரி எண் / சேவை ஐடி" : "Judicial Officer Badge / Service ID"}
                </label>
                <input
                  type="text"
                  required
                  value={benchIdentifier}
                  onChange={(e) => setBenchIdentifier(e.target.value)}
                  placeholder="TN-JUD-5512 or judge_subramanian"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-[#684f9b]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Pre-filled: Hon. Justice P. Subramanian (Bench)</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">
                    {language === "ta" ? "நீதித்துறை பின் / கடவுச்சொல்" : "Judicial PIN / Access Code"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setBenchPassword("123456")}
                    className="text-[10px] text-[#684f9b] hover:underline font-semibold cursor-pointer"
                  >
                    {language === "ta" ? "மாதிரி PIN (123456)" : "Auto-fill PIN (123456)"}
                  </button>
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={benchPassword}
                  onChange={(e) => setBenchPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none focus:border-[#684f9b] font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                {language === "ta" ? "ரத்துசெய்" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={authLoading}
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {language === "ta" ? "சரிபார்த்து திறக்க" : "Verify & Unlock"}
              </button>
            </div>
          </form>
        </div>
      )}

    </main>
  );
}

export default function PublicVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center text-xs">
        <RefreshCw className="h-6 w-6 text-[#684f9b] animate-spin mr-2" /> Initializing Live Verification...
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
