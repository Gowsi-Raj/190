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
  AlertOctagon
} from "lucide-react";

function VerifyContent() {
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

      // Use relative API URL - seamlessly routed through Next.js server over ngrok
      const res = await fetch(`/api/verify-record?${queryParams.toString()}`, {
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      const data = await res.json();

      setLastCheckedTime(new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }));

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
    } finally {
      setLoading(false);
    }
  }, [hash, fir, badge]);

  useEffect(() => {
    verifyRecord();
  }, [verifyRecord]);

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
            <span className="hidden sm:inline-block hover:underline cursor-pointer">Helpline: 112 / 100</span>
            <span className="hidden sm:inline-block text-purple-300">|</span>
            <span className="bg-white/15 px-2 py-0.5 rounded text-[10px] font-medium text-white border border-white/20 cursor-pointer">
              தமிழ் மொழி
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-purple-200">A A+ A++</span>
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
        <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          
          {/* Top Status Header */}
          <div className="text-center space-y-2">
            {isAuthentic ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> 100% BIT-PERFECT & LEDGER ANCHORED
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 border border-red-300 text-red-800 text-xs font-semibold shadow-sm animate-pulse">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" /> TAMPER DETECTED: INTEGRITY BREACH
              </div>
            )}
            
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              <Scale className="h-4 w-4 text-[#684f9b]" />
              National Judicial Evidence Verification
            </h2>
            <p className="text-[11px] text-slate-500">
              Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Digital Certificate Seal
            </p>
          </div>

          {/* Dynamic Card Display */}
          {isAuthentic ? (
            <div className="space-y-3.5 text-xs">
              
              {/* SHA-256 Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 flex items-center gap-1 font-mono text-[10px] uppercase font-semibold">
                  <Hash className="h-3 w-3 text-[#684f9b]" /> SHA-256 Evidence Checksum
                </span>
                <p className="text-emerald-700 font-mono break-all text-[11px] leading-tight font-medium">
                  {hash}
                </p>
              </div>

              {/* Case Particulars Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
                    <ShieldCheck className="h-3 w-3 text-[#684f9b]" /> Case / FIR Reference
                  </span>
                  <p className="text-slate-900 font-bold mt-0.5 text-xs">{matchedDoc?.firNumber || fir}</p>
                  <p className="text-slate-500 text-[10px]">{matchedDoc?.caseId || "N/A"}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1 font-medium">
                    <UserCheck className="h-3 w-3 text-[#684f9b]" /> Attesting Officer
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
            <div className="space-y-3.5 text-xs">
              <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-center space-y-2">
                <AlertOctagon className="h-9 w-9 text-red-600 mx-auto" />
                <p className="text-red-900 font-bold text-sm">INTEGRITY BREACH DETECTED</p>
                <div className="text-[11px] text-red-900 font-mono bg-white p-3 rounded-lg border border-red-200 text-left space-y-1 shadow-sm">
                  <p className="font-semibold text-red-700">Diagnosis:</p>
                  <p className="leading-relaxed text-slate-800">{tamperMessage}</p>
                  {tamperDetails?.expectedFir && (
                    <p className="text-[10px] text-slate-700 pt-1 border-t border-slate-100 mt-1">
                      Expected FIR in Certificate: <span className="text-emerald-700 font-semibold">{tamperDetails.expectedFir}</span><br />
                      Found FIR in Database: <span className="text-red-700 font-bold">{tamperDetails.databaseFir}</span>
                    </p>
                  )}
                  {tamperDetails?.expectedBadge && (
                    <p className="text-[10px] text-slate-700 pt-1 border-t border-slate-100 mt-1">
                      Expected Badge in Certificate: <span className="text-emerald-700 font-semibold">{tamperDetails.expectedBadge}</span><br />
                      Found Badge in Database: <span className="text-red-700 font-bold">{tamperDetails.databaseBadge}</span>
                    </p>
                  )}
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