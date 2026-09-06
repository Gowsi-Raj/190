"use client";

import React, { useState, useEffect } from "react";
import { UserProfile } from "@/types";
import LoginPage from "@/components/LoginPage";
import Header from "@/components/Header";
import CustodyTransferModal from "@/components/CustodyTransferModal";

import InvestigatingOfficerDashboard from "@/components/dashboards/InvestigatingOfficerDashboard";
import StationHouseOfficerDashboard from "@/components/dashboards/StationHouseOfficerDashboard";
import ForensicExaminerDashboard from "@/components/dashboards/ForensicExaminerDashboard";
import PublicProsecutorDashboard from "@/components/dashboards/PublicProsecutorDashboard";
import JudicialOfficerDashboard from "@/components/dashboards/JudicialOfficerDashboard";
import SystemAuditorDashboard from "@/components/dashboards/SystemAuditorDashboard";
import LegalDepartmentDashboard from "@/components/dashboards/LegalDepartmentDashboard";
import AdministratorDashboard from "@/components/dashboards/AdministratorDashboard";

export default function LegalDMSApp() {

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [transferDocHash, setTransferDocHash] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("legal_dms_user");
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("legal_dms_user");
      }
    }
  }, []);

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(profile) => setCurrentUser(profile)} />;
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-6 font-sans">
      <Header
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem("legal_dms_user");
          setCurrentUser(null);
        }}
      />

      {currentUser.role === "INVESTIGATING_OFFICER" && (
        <InvestigatingOfficerDashboard currentUser={currentUser} />
      )}

      {currentUser.role === "STATION_HOUSE_OFFICER" && (
        <StationHouseOfficerDashboard
          currentUser={currentUser}
          onInitiateTransfer={(hash) => setTransferDocHash(hash)}
        />
      )}

      {currentUser.role === "FORENSIC_EXAMINER" && (
        <ForensicExaminerDashboard
          currentUser={currentUser}
          onInitiateTransfer={(hash) => setTransferDocHash(hash)}
        />
      )}

      {currentUser.role === "PUBLIC_PROSECUTOR" && (
        <PublicProsecutorDashboard currentUser={currentUser} />
      )}

      {currentUser.role === "JUDICIAL_OFFICER" && (
        <JudicialOfficerDashboard currentUser={currentUser} />
      )}

      {currentUser.role === "SYSTEM_AUDITOR" && (
        <SystemAuditorDashboard currentUser={currentUser} />
      )}

      {currentUser.role === "LEGAL_OFFICER" && (
        <LegalDepartmentDashboard currentUser={currentUser} />
      )}

      {currentUser.role === "ADMINISTRATOR" && (
        <AdministratorDashboard currentUser={currentUser} />
      )}

      {transferDocHash && (

        <CustodyTransferModal
          docHash={transferDocHash}
          currentUser={currentUser}
          onClose={() => setTransferDocHash(null)}
          onSuccess={() => setTransferDocHash(null)}
        />
      )}
    </main>
  );
}