"use client";

import React, { useState } from "react";
import axios from "axios";
import { ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { UserProfile } from "@/types";

interface CustodyTransferModalProps {
  docHash: string;
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustodyTransferModal({ docHash, currentUser, onClose, onSuccess }: CustodyTransferModalProps) {
  const [targetDept, setTargetDept] = useState("State Forensic Science Laboratory (SFSL)");
  const [receivingOfficer, setReceivingOfficer] = useState("Dr. R. Ramanathan (Forensic Director)");
  const [transferReason, setTransferReason] = useState("Forensic Analysis & Verification");
  const [loading, setLoading] = useState(false);

  const handleExecuteTransfer = async () => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/api/v1/documents/transfer-custody",
        {
          docHash,
          fromOfficer: `${currentUser.fullName} (${currentUser.badgeNumber})`,
          toDepartment: targetDept,
          receivingOfficer,
          transferReason
        },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      );
      alert("Custody transfer permanently logged.");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-[#684f9b]" /> Legal Custody Transfer
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Target Department</label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
            >
              <option value="State Forensic Science Laboratory (SFSL)">State Forensic Science Laboratory (SFSL)</option>
              <option value="Principal Sessions Court Registry">Principal Sessions Court Registry</option>
              <option value="District Crime Records Bureau (DCRB)">District Crime Records Bureau (DCRB)</option>
              <option value="Cyber Crime Cell HQ">Cyber Crime Cell HQ</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Receiving Official</label>
            <input
              type="text"
              value={receivingOfficer}
              onChange={(e) => setReceivingOfficer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Transfer Reason</label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-[#684f9b] focus:bg-white outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteTransfer}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" /> Seal & Transfer
          </button>
        </div>
      </div>
    </div>
  );
}