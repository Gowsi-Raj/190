"use client";

import React from "react";
import { FileCheck2, Clock, Stamp, Download, ArrowRightLeft } from "lucide-react";

interface CaseDossierViewProps {
  dossierData: any;
  userRole: string;
  onInitiateTransfer: (hash: string) => void;
}

export default function CaseDossierView({ dossierData, userRole, onInitiateTransfer }: CaseDossierViewProps) {
  const canTransfer = ["INVESTIGATING_OFFICER", "STATION_HOUSE_OFFICER", "FORENSIC_EXAMINER"].includes(userRole);

  const formatLocalDate = (isoStr: string) => {
    if (!isoStr) return "N/A";
    const parsedStr = isoStr.endsWith("Z") || isoStr.includes("+") ? isoStr : `${isoStr}Z`;
    const date = new Date(parsedStr);
    return isNaN(date.getTime()) ? isoStr : date.toLocaleString();
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4 shadow-sm">
        <div>
          <span className="text-xs text-slate-500 font-medium">Case Reference</span>
          <p className="text-sm font-bold text-slate-900">{dossierData.firNumber}</p>
          <p className="text-xs text-slate-500">{dossierData.caseId}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Police Jurisdiction</span>
          <p className="text-sm font-semibold text-slate-800">{dossierData.policeStation}</p>
          <p className="text-xs text-slate-500">{dossierData.district}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Complainant vs Accused</span>
          <p className="text-sm font-semibold text-slate-800">{dossierData.complainantName}</p>
          <p className="text-xs text-slate-500">vs {dossierData.accusedName}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Active Viewing Role</span>
          <p className="text-sm font-bold text-[#684f9b]">{dossierData.viewingRole || userRole}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-[#684f9b]" /> Anchored Case Exhibits & Certificates
        </h3>
        <div className="space-y-3">
          {dossierData.documents.map((doc: any) => (
            <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-[#684f9b] rounded border border-purple-200 font-mono">
                    {doc.docType}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{doc.fileName}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-600 mt-1">Hash: {doc.docHash}</p>
                <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                  Custodian: <strong>{doc.currentCustodian}</strong>
                </p>
                <p className="text-xs text-slate-600 mt-0.5 font-mono text-[11px]">
                  Transcript: {doc.verifiedData?.text?.slice(0, 80)}...
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canTransfer && (
                  <button
                    onClick={() => onInitiateTransfer(doc.docHash)}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer Custody
                  </button>
                )}

                <a
                  href={`http://localhost:8000/api/v1/documents/download-watermarked/${doc.docHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#684f9b] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Stamp className="h-3.5 w-3.5" /> Watermarked Copy
                </a>

                <a
                  href={`http://localhost:8000/api/v1/documents/certificate/section-63-bsa/${doc.docHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Sec 63 BSA Certificate
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" /> Chronological Custody Audit Log
        </h3>
        <div className="space-y-4 border-l-2 border-purple-200 ml-3 pl-4">
          {dossierData.chainOfCustodyAudit.map((audit: any, idx: number) => (
            <div key={idx} className="relative">
              <div className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full bg-[#684f9b] border-2 border-white shadow-sm"></div>
              <p className="text-xs font-bold text-[#684f9b]">
                {audit.action} — {audit.fromEntity} <span className="text-slate-400 font-normal">➔</span> {audit.toEntity}
              </p>
              <p className="text-xs text-slate-700 mt-0.5">Reason: {audit.reason}</p>
              <p className="text-xs text-slate-500 mt-0.5">Timestamp: {formatLocalDate(audit.timestamp)}</p>
              <p className="text-xs font-mono text-slate-500 break-all mt-0.5">Tx: {audit.txHash}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}