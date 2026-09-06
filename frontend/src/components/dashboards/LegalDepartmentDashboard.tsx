"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Scale, FileText, CheckCircle2, Clock, AlertCircle, 
  MessageSquare, Upload, Eye, History, Shield, Send, RefreshCw
} from "lucide-react";
import { UserProfile, LegalReviewItem } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface LegalDashboardProps {
  currentUser: UserProfile;
}

export default function LegalDepartmentDashboard({ currentUser }: LegalDashboardProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<LegalReviewItem | null>(null);
  const [legalRemarkText, setLegalRemarkText] = useState("");
  const [statutoryAdvisoryText, setStatutoryAdvisoryText] = useState("");
  const [recommendation, setRecommendation] = useState("RECOMMENDED_WITH_CONDITIONS");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLegalQueue();
  }, []);

  const fetchLegalQueue = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const res = await axios.get("http://localhost:8000/api/v1/documents/legal-queue", config);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/documents/legal-remark", {
        caseId: selectedReview.caseId,
        documentId: selectedReview.document,
        legalRemark: legalRemarkText,
        statutoryAdvisory: statutoryAdvisoryText,
        approvalRecommendation: recommendation
      }, config);

      setActionSuccess(`Legal remark recorded for Case ${selectedReview.caseId} (${selectedReview.document}).`);
      setSelectedReview(null);
      setLegalRemarkText("");
      setStatutoryAdvisoryText("");
      fetchLegalQueue();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope Disclaimer */}
      <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#684f9b]" /> Directorate of Legal Affairs & Statutory Review
          </h3>
          <p className="text-xs text-indigo-800/80 mt-0.5">
            Institutional oversight and advisory coordination for Section 63 BSA compliance, inter-agency notices, and judicial proceedings.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#684f9b] bg-white border border-indigo-200 px-3 py-1 rounded-full">
          Advisory Wing
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

      {/* Top Cards (Page 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.activeLegalMatters")}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data?.summary.activeLegalMatters || 24}</p>
          <span className="text-[10px] text-slate-500">Under Directorate Advisory</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.awaitingLegalReview")}</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data?.summary.documentsAwaitingLegalReview || 6}</p>
          <span className="text-[10px] text-amber-600 font-medium">Police & FSL Submissions</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.legalNotices")}</span>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{data?.summary.legalNotices || 9}</p>
          <span className="text-[10px] text-indigo-600 font-medium">Statutory Notices Issued</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Upcoming Deadlines</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{data?.summary.upcomingDeadlines || 3}</p>
          <span className="text-[10px] text-rose-600 font-medium">Court Filing Cutoffs</span>
        </div>
      </div>

      {/* Main Sections: Legal Review Queue & Legal Documents (Pages 11 - 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Legal Review Queue Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Legal Review Queue (Page 11)</h3>
              <p className="text-xs text-slate-500">Submissions requiring institutional statutory scrutiny before trial filing.</p>
            </div>
            <button onClick={fetchLegalQueue} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Submitted By</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.legalReviewQueue?.map((q: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-[#684f9b]">{q.caseId}</td>
                    <td className="p-3 font-semibold text-slate-900">{q.document}</td>
                    <td className="p-3 text-slate-600">{q.submittedBy}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedReview(q)}
                        className="px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        Review & Remark
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Legal Documents & Correspondence Explorer (Page 12) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Legal Documents & Statutory Notices</h3>
          <div className="space-y-2.5">
            {data?.legalDocuments?.map((doc: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-[#684f9b] uppercase">
                    {doc.type}
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">{doc.title}</p>
                  <p className="text-[10px] text-slate-500">Addressed to: {doc.target}</p>
                </div>
                <button
                  onClick={() => setActionSuccess(`Opened dossier view for ${doc.title}`)}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 flex gap-2">
            <button
              onClick={() => setActionSuccess("Legal document upload modal initialized.")}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" /> Upload Legal Document
            </button>
          </div>
        </div>
      </div>

      {/* Add Legal Remark Modal (Page 12) */}
      {selectedReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddRemarkSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#684f9b]" /> Add Official Legal Advisory Remark
            </h3>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Matter: </span> Case {selectedReview.caseId} • {selectedReview.document}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Statutory Advisory Note (Section 63 BSA)</label>
                <textarea
                  rows={3}
                  required
                  value={statutoryAdvisoryText}
                  onChange={(e) => setStatutoryAdvisoryText(e.target.value)}
                  placeholder="Enter statutory evidentiary remarks, admissibility caveats, or cross-examination points..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-[#684f9b] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none"
                >
                  <option value="CLEARANCE_GRANTED">Statutory Clearance Granted</option>
                  <option value="RECOMMENDED_WITH_CONDITIONS">Recommended With Evidentiary Conditions</option>
                  <option value="DEFECT_REQUIRES_AMENDMENT">Defect Noted - Requires Amendment by IO</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Direct Remarks to Prosecution / Court</label>
                <input
                  type="text"
                  value={legalRemarkText}
                  onChange={(e) => setLegalRemarkText(e.target.value)}
                  placeholder="e.g. Admissible under Section 63(2) with certified cryptographic hash."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
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
                Seal & Record Legal Remark
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
