"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  ShieldCheck, Users, FolderKanban, Bell, ShieldAlert, CheckCircle2, 
  XCircle, UserPlus, RefreshCw, KeyRound, UserCheck, Lock, FileText, ArrowRightLeft, 
  Layers, Settings, Sliders, ShieldX, Database, Search
} from "lucide-react";
import { UserProfile, AdminMetrics, AdminUser } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export default function AdministratorDashboard({ currentUser }: AdminDashboardProps) {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"USERS" | "PENDING" | "CASES" | "POLICIES">("USERS");

  // Approval Modal State
  const [selectedPendingUser, setSelectedPendingUser] = useState<AdminUser | null>(null);
  const [assignedRole, setAssignedRole] = useState("INVESTIGATING_OFFICER");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Case Assignment Modal State
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [assignIo, setAssignIo] = useState("");
  const [assignForensic, setAssignForensic] = useState("");
  const [assignPros, setAssignPros] = useState("");
  const [assignCourt, setAssignCourt] = useState("");

  // Direct User Creation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newOrg, setNewOrg] = useState("Tamil Nadu Police");
  const [newOrgId, setNewOrgId] = useState("ORG-TN-POL-01");
  const [newRole, setNewRole] = useState("INVESTIGATING_OFFICER");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      const [mRes, uRes, cRes, pRes] = await Promise.all([
        axios.get("http://localhost:8000/api/v1/admin/metrics", config),
        axios.get("http://localhost:8000/api/v1/admin/users", config),
        axios.get("http://localhost:8000/api/v1/admin/cases", config),
        axios.get("http://localhost:8000/api/v1/admin/pending-actions", config)
      ]);
      setMetrics(mRes.data);
      setUsers(uRes.data);
      setCases(cRes.data);
      setPendingActions(pRes.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async () => {
    if (!selectedPendingUser) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/admin/users/approve", {
        badgeNumber: selectedPendingUser.badgeNumber,
        assignedRole: assignedRole,
        organization: selectedPendingUser.organization,
        status: "ACTIVE"
      }, config);

      setActionSuccess(`User ${selectedPendingUser.badgeNumber} approved and activated as ${assignedRole}`);
      setSelectedPendingUser(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignCaseStakeholders = async () => {
    if (!selectedCase) return;
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/admin/cases/assign", {
        caseId: selectedCase.caseId,
        investigatingOfficer: assignIo || selectedCase.assignments?.io,
        forensicOfficer: assignForensic || selectedCase.assignments?.forensic,
        prosecutionLawyer: assignPros || selectedCase.assignments?.prosecution,
        courtUser: assignCourt || selectedCase.assignments?.court
      }, config);

      setActionSuccess(`Stakeholders successfully assigned to Case ${selectedCase.caseId}`);
      setSelectedCase(null);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeStakeholder = async (caseId: string, role: string) => {
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/admin/cases/revoke", {
        caseId,
        stakeholderRole: role
      }, config);
      setActionSuccess(`Access for ${role} revoked from case ${caseId}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${currentUser.token}` } };
      await axios.post("http://localhost:8000/api/v1/admin/users/create", {
        fullName: newFullName,
        email: newEmail,
        mobile: newMobile,
        username: newUsername,
        password: newPassword,
        organization: newOrg,
        organizationId: newOrgId,
        role: newRole
      }, config);
      setCreateModalOpen(false);
      setActionSuccess(`Official user ${newUsername} created successfully.`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.badgeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notice Banner (Page 19) */}
      <div className="bg-purple-50 border-l-4 border-[#684f9b] p-3.5 rounded-r-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-[#684f9b] shrink-0" />
          <p className="text-xs text-slate-800">
            <span className="font-bold">Administrative Access Boundary:</span> The Administrator is managing the system and authorization trees, not investigating cases. By design, administrators do not possess automatic access to evidentiary contents of FIRs or witness statements.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3 py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
        >
          <UserPlus className="h-3.5 w-3.5" /> + Create User
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

      {/* Top Cards (Pages 16 - 17) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.totalUsers")}</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.summary.totalUsers || 248}</p>
          <span className="text-[10px] text-slate-500">Registered Officials</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.activeUsers")}</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics?.summary.activeUsers || 236}</p>
          <span className="text-[10px] text-emerald-600">Active & Verified</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.pendingApprovals")}</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics?.summary.pendingUserApprovals || 12}</p>
          <span className="text-[10px] text-amber-600 font-medium">Awaiting Affiliation Check</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.activeCases")}</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{metrics?.summary.activeCases || 86}</p>
          <span className="text-[10px] text-blue-600">State Dockets</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Access Requests</span>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{metrics?.summary.accessRequests || 12}</p>
          <span className="text-[10px] text-indigo-600">Inter-Agency Queries</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">{t("card.systemAlerts")}</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{metrics?.summary.systemAlerts || 3}</p>
          <span className="text-[10px] text-rose-600">Operational Integrity</span>
        </div>
      </div>

      {/* Distribution Breakdown (Page 17) */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          User Distribution Breakdown by Stakeholder Agency (Page 17)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Police</span>
            <span className="text-sm font-bold text-slate-900">{metrics?.distribution.police || 124}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Forensics</span>
            <span className="text-sm font-bold text-slate-900">{metrics?.distribution.forensics || 16}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Prosecution</span>
            <span className="text-sm font-bold text-slate-900">{metrics?.distribution.prosecution || 26}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Court</span>
            <span className="text-sm font-bold text-slate-900">{metrics?.distribution.court || 10}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Legal</span>
            <span className="text-sm font-bold text-slate-900">{metrics?.distribution.legal || 14}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Auditors</span>
            <span className="text-sm font-bold text-slate-900">{metrics?.distribution.auditors || 5}</span>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "USERS" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" /> User Management & RBAC
        </button>
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "PENDING" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="h-4 w-4" /> Pending Actions ({pendingActions.length})
        </button>
        <button
          onClick={() => setActiveTab("CASES")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "CASES" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderKanban className="h-4 w-4" /> Case Assignment Structure
        </button>
        <button
          onClick={() => setActiveTab("POLICIES")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 cursor-pointer transition ${
            activeTab === "POLICIES" ? "border-[#684f9b] text-[#684f9b]" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="h-4 w-4" /> Retention & System Policies
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT (Page 17) */}
      {activeTab === "USERS" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Attributes & Directory</h3>
              <p className="text-xs text-slate-500">Attributes: User, Role, Organization, Status, Last Login</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, badge, role..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">User & Badge</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Login / Action</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.badgeNumber} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-medium">
                      <div className="font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.badgeNumber}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-[#684f9b] border border-purple-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{u.organization}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.orgId}</div>
                    </td>
                    <td className="p-3">
                      {u.status === "ACTIVE" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">PENDING APPROVAL</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">{u.lastLogin}</td>
                    <td className="p-3 text-right space-x-2">
                      {u.status === "PENDING_APPROVAL" ? (
                        <button
                          onClick={() => setSelectedPendingUser(u)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          Approve / Assign Role
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPendingUser(u);
                            setAssignedRole(u.role);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          Modify Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING ACTIONS (Page 17) */}
      {activeTab === "PENDING" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pending Actions Queue (Page 17)</h3>
            <p className="text-xs text-slate-500">New user registrations, role assignment requests, case assignment requests, access requests, revocation requests.</p>
          </div>

          <div className="space-y-3">
            {pendingActions.map((p, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#684f9b]/10 text-[#684f9b] font-bold rounded text-[10px] uppercase">
                      {p.type.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{p.title}</span>
                    <span className="font-mono text-[10px] text-slate-500">({p.identifier})</span>
                  </div>
                  <p className="text-xs text-slate-600">{p.details}</p>
                  <span className="text-[10px] text-slate-400">Requested: {p.requestedAt}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const matched = users.find(u => u.badgeNumber === p.identifier);
                      if (matched) setSelectedPendingUser(matched);
                      else setActionSuccess(`Action ${p.title} approved.`);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setActionSuccess(`Request ${p.identifier} dismissed.`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CASE ASSIGNMENT STRUCTURE (Page 18) */}
      {activeTab === "CASES" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Case Assignment Structure (Page 18)</h3>
            <p className="text-xs text-slate-500">
              Architecture: Case C-1024 ── IO: Officer A | Forensic: Officer F | Prosecution: Lawyer P | Court: Court User C
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cases.map((c) => (
              <div key={c.caseId} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#684f9b] font-mono">{c.caseId}</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">{c.caseTitle}</h4>
                    <p className="text-[10px] text-slate-500">{c.firNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                    {c.investigationStatus}
                  </span>
                </div>

                {/* Case Tree Assignment */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono space-y-1.5">
                  <div className="text-slate-400 font-bold">{c.caseId}</div>
                  <div className="flex justify-between items-center pl-3 border-l-2 border-slate-300">
                    <span className="text-slate-700">├── IO: <span className="font-sans font-medium text-slate-900">{c.assignments?.io || "Unassigned"}</span></span>
                    {c.assignments?.io && (
                      <button onClick={() => handleRevokeStakeholder(c.caseId, "IO")} className="text-red-500 hover:text-red-700 text-[10px] font-sans font-semibold">Revoke</button>
                    )}
                  </div>
                  <div className="flex justify-between items-center pl-3 border-l-2 border-slate-300">
                    <span className="text-slate-700">├── Forensic: <span className="font-sans font-medium text-slate-900">{c.assignments?.forensic || "Unassigned"}</span></span>
                    {c.assignments?.forensic && (
                      <button onClick={() => handleRevokeStakeholder(c.caseId, "FORENSIC")} className="text-red-500 hover:text-red-700 text-[10px] font-sans font-semibold">Revoke</button>
                    )}
                  </div>
                  <div className="flex justify-between items-center pl-3 border-l-2 border-slate-300">
                    <span className="text-slate-700">├── Prosecution: <span className="font-sans font-medium text-slate-900">{c.assignments?.prosecution || "Unassigned"}</span></span>
                    {c.assignments?.prosecution && (
                      <button onClick={() => handleRevokeStakeholder(c.caseId, "PROSECUTION")} className="text-red-500 hover:text-red-700 text-[10px] font-sans font-semibold">Revoke</button>
                    )}
                  </div>
                  <div className="flex justify-between items-center pl-3 border-l-2 border-slate-300">
                    <span className="text-slate-700">└── Court: <span className="font-sans font-medium text-slate-900">{c.assignments?.court || "Unassigned"}</span></span>
                    {c.assignments?.court && (
                      <button onClick={() => handleRevokeStakeholder(c.caseId, "COURT")} className="text-red-500 hover:text-red-700 text-[10px] font-sans font-semibold">Revoke</button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCase(c);
                    setAssignIo(c.assignments?.io || "");
                    setAssignForensic(c.assignments?.forensic || "");
                    setAssignPros(c.assignments?.prosecution || "");
                    setAssignCourt(c.assignments?.court || "");
                  }}
                  className="w-full py-1.5 bg-[#684f9b] hover:bg-[#5a4287] text-white rounded text-xs font-semibold transition cursor-pointer"
                >
                  Assign / Update Stakeholders
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RETENTION & SYSTEM CONFIG (Page 18 - 19) */}
      {activeTab === "POLICIES" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">System Configuration & Retention Policies (Page 18)</h3>
            <p className="text-xs text-slate-500">Configure institutional retention, cryptographic parameters, and audit enforcement.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#684f9b]" /> Cryptographic Ingestion Standards
              </h4>
              <p className="text-slate-600 text-[11px]">Primary Hash Algorithm: SHA-256 (NIST FIPS 180-4)</p>
              <p className="text-slate-600 text-[11px]">Digital Certificate Standard: Section 63 BSA 2023 (Form II)</p>
              <p className="text-slate-600 text-[11px]">Vault Storage: WORM (Write-Once-Read-Many) Enforced</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-[#684f9b]" /> Case Retention & Purge Policy
              </h4>
              <p className="text-slate-600 text-[11px]">Cognizable FIR Dossiers: Permanent Archival (Life + 50 Years)</p>
              <p className="text-slate-600 text-[11px]">Preliminary Inquiries (Non-Cognizable): 3 Years</p>
              <p className="text-slate-600 text-[11px]">Audit Logs: Mandatory 7-Year Immutable Retention</p>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Assign Role Modal */}
      {selectedPendingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#684f9b]" /> Verify & Approve Official Account
            </h3>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
              <p><span className="font-bold text-slate-700">Official Name:</span> {selectedPendingUser.fullName}</p>
              <p><span className="font-bold text-slate-700">Badge / Reference:</span> <span className="font-mono">{selectedPendingUser.badgeNumber}</span></p>
              <p><span className="font-bold text-slate-700">Organization:</span> {selectedPendingUser.organization} ({selectedPendingUser.orgId})</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assign Confirmed Role</label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-[#684f9b] outline-none"
              >
                <option value="INVESTIGATING_OFFICER">Investigating Officer (IO)</option>
                <option value="STATION_HOUSE_OFFICER">Station House Officer (SHO)</option>
                <option value="FORENSIC_EXAMINER">Forensic Examiner (SFSL)</option>
                <option value="PUBLIC_PROSECUTOR">Public Prosecutor</option>
                <option value="JUDICIAL_OFFICER">Judicial Officer (Magistrate / Judge)</option>
                <option value="LEGAL_OFFICER">Legal Department Adviser</option>
                <option value="SYSTEM_AUDITOR">System Security Auditor</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSelectedPendingUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveUser}
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Approve & Activate User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Stakeholder Assignment Modal (Page 18) */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#684f9b]" /> Assign Case Stakeholders ({selectedCase.caseId})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">├── IO (Investigating Officer)</label>
                <input
                  type="text"
                  value={assignIo}
                  onChange={(e) => setAssignIo(e.target.value)}
                  placeholder="e.g. Insp. G. Senthil Nathan (TN-POL-4921)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">├── Forensic Officer</label>
                <input
                  type="text"
                  value={assignForensic}
                  onChange={(e) => setAssignForensic(e.target.value)}
                  placeholder="e.g. Dr. R. Ramanathan (TN-FSL-8840)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">├── Prosecution Lawyer</label>
                <input
                  type="text"
                  value={assignPros}
                  onChange={(e) => setAssignPros(e.target.value)}
                  placeholder="e.g. Adv. S. Meenakshi (TN-PROS-3301)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">└── Court User / Magistrate</label>
                <input
                  type="text"
                  value={assignCourt}
                  onChange={(e) => setAssignCourt(e.target.value)}
                  placeholder="e.g. Hon. Justice P. Subramanian (TN-JUD-5512)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCaseStakeholders}
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Save Case Stakeholder Bindings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct User Creation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateUser} className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#684f9b]" /> Direct Administrative User Provisioning
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Officer Name"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Official Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="officer@tn.gov.in"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Mobile Number</label>
                <input
                  type="text"
                  required
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="+91 94440 00000"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="username"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                >
                  <option value="INVESTIGATING_OFFICER">Investigating Officer</option>
                  <option value="FORENSIC_EXAMINER">Forensic Examiner</option>
                  <option value="PUBLIC_PROSECUTOR">Public Prosecutor</option>
                  <option value="JUDICIAL_OFFICER">Judicial Officer</option>
                  <option value="LEGAL_OFFICER">Legal Department</option>
                  <option value="SYSTEM_AUDITOR">System Auditor</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700">Organization</label>
                <input
                  type="text"
                  required
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#684f9b] hover:bg-[#5a4287] text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Create Official Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
