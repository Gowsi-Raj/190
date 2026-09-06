"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "ta";
export type FontSize = "normal" | "large" | "xlarge";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Top Header Banner
  "portal.title": {
    en: "Tamil Nadu Police • CCTNS Portal",
    ta: "தமிழ்நாடு காவல் • CCTNS தளம்"
  },
  "portal.subtitle": {
    en: "National Legal DMS & Section 63 BSA Digital Evidentiary Gateway",
    ta: "தேசிய சட்ட ஆவண மேலாண்மை & பிரிவு 63 BSA மின்னணு சான்றாதார நுழைவாயில்"
  },
  "portal.helpline": {
    en: "Helpline: 112 / 100",
    ta: "அவசர உதவி: 112 / 100"
  },
  "portal.logout": {
    en: "Logout",
    ta: "வெளியேறு"
  },

  // Role Titles & Workstations
  "role.INVESTIGATING_OFFICER": {
    en: "Investigating Officer (IO)",
    ta: "புலனாய்வு அதிகாரி (IO)"
  },
  "role.STATION_HOUSE_OFFICER": {
    en: "Station House Officer (SHO)",
    ta: "காவல் நிலைய பொறுப்பு அதிகாரி (SHO)"
  },
  "role.FORENSIC_EXAMINER": {
    en: "Forensic Examiner (SFSL)",
    ta: "தடய அறிவியல் ஆய்வாளர் (SFSL)"
  },
  "role.PUBLIC_PROSECUTOR": {
    en: "Public Prosecutor",
    ta: "அரசு வழக்கறிஞர் (Prosecutor)"
  },
  "role.JUDICIAL_OFFICER": {
    en: "Judicial Magistrate / Judge",
    ta: "நீதித்துறை நடுவர் / நீதிபதி"
  },
  "role.LEGAL_OFFICER": {
    en: "Legal Department Adviser",
    ta: "சட்டத்துறை ஆலோசகர் (Legal Dept)"
  },
  "role.SYSTEM_AUDITOR": {
    en: "System Security Auditor",
    ta: "கணினி பாதுகாப்பு தணிக்கையாளர்"
  },
  "role.ADMINISTRATOR": {
    en: "System Administrator",
    ta: "கணினி முதன்மை நிர்வாகி"
  },

  // Workstation Sub-Headers
  "header.workstation.io": {
    en: "Investigating Officer (IO) Workstation",
    ta: "புலனாய்வு அதிகாரி (IO) பணித்தளம்"
  },
  "header.workstation.sho": {
    en: "Station House Officer (SHO) Command Center",
    ta: "காவல் நிலைய பொறுப்பு அதிகாரி (SHO) கட்டளை மையம்"
  },
  "header.workstation.forensic": {
    en: "Forensic Science Evidence Lab (SFSL)",
    ta: "மாநில தடய அறிவியல் ஆய்வகம் (SFSL)"
  },
  "header.workstation.prosecution": {
    en: "Public Prosecution Trial Briefing Suite",
    ta: "அரசு வழக்குரைஞர் வழக்கு விசாரணை அறை"
  },
  "header.workstation.court": {
    en: "Judicial Magistrate / Sessions Bench",
    ta: "முதன்மை அமர்வு நீதிமன்ற நீதிபதி இருக்கை"
  },
  "header.workstation.legal": {
    en: "Legal Affairs & Regulatory Directorate",
    ta: "சட்ட விவகாரங்கள் & ஒழுங்குமுறை இயக்குநரகம்"
  },
  "header.workstation.auditor": {
    en: "System Security & Compliance Audit Log",
    ta: "கணினி பாதுகாப்பு & இணக்க தணிக்கைப் பதிவு"
  },
  "header.workstation.admin": {
    en: "System Administration & RBAC Oversight",
    ta: "கணினி நிர்வாகம் & அணுகல் உரிமை மேற்பார்வை"
  },

  // Login Page & Auth
  "login.signIn": {
    en: "Officer Sign In",
    ta: "அதிகாரி உள்நுழைவு"
  },
  "login.register": {
    en: "New Official Registration",
    ta: "புதிய அதிகாரி பதிவு"
  },
  "login.terminalAuth": {
    en: "Official Terminal Authentication",
    ta: "அதிகாரப்பூர்வ முனைய அங்கீகரிப்பு"
  },
  "login.terminalAuthDesc": {
    en: "Enter your official Badge Number or Service Username to initiate MFA challenge.",
    ta: "MFA ஒருமுறை கடவுச்சொல்லை பெற உங்கள் பணி அடையாள எண் அல்லது பயனர்பெயரை உள்ளிடவும்."
  },
  "login.badgeLabel": {
    en: "Official Username / Badge ID / Email",
    ta: "பயனர்பெயர் / பணி எண் / மின்னஞ்சல்"
  },
  "login.passwordLabel": {
    en: "Password",
    ta: "கடவுச்சொல்"
  },
  "login.submitMfa": {
    en: "Authenticate with MFA OTP",
    ta: "MFA மூலம் உள்நுழைக"
  },
  "login.directoryTitle": {
    en: "Fast-Login Stakeholder Directory (7 Roles)",
    ta: "விரைவு உள்நுழைவு அடைவு (7 பொறுப்புகள்)"
  },
  "login.directoryDesc": {
    en: "Click any official credential below to instantly authenticate and inspect that role's specialized workflow.",
    ta: "அந்தந்த பொறுப்பின் பணிப்பாய்வை சோதிக்க கீழே உள்ள அடையாள அட்டையைக் கிளிக் செய்யவும்."
  },

  // Registration Form
  "reg.title": {
    en: "Official Account Registration",
    ta: "அதிகாரப்பூர்வ கணக்கு பதிவு"
  },
  "reg.notice": {
    en: "Accounts enter PENDING_APPROVAL until verified by an Administrator.",
    ta: "நிர்வாகி சரிபார்க்கும் வரை கணக்குகள் 'ஒப்புதல் நிலுவை' நிலையில் இருக்கும்."
  },
  "reg.sec1": {
    en: "1. Account Information",
    ta: "1. கணக்கு விவரங்கள்"
  },
  "reg.sec2": {
    en: "2. Organization & Role Affiliation",
    ta: "2. நிறுவனம் & பொறுப்பு இணைப்பு"
  },
  "reg.fullName": {
    en: "Full Name",
    ta: "முழுப் பெயர்"
  },
  "reg.email": {
    en: "Official Email",
    ta: "அலுவலக மின்னஞ்சல்"
  },
  "reg.mobile": {
    en: "Mobile Number (MFA/OTP)",
    ta: "கைபேசி எண் (MFA/OTP)"
  },
  "reg.username": {
    en: "System Username",
    ta: "பயனர் பெயர்"
  },
  "reg.confirmPassword": {
    en: "Confirm Password",
    ta: "கடவுச்சொல்லை உறுதிப்படுத்துக"
  },
  "reg.organization": {
    en: "Organization",
    ta: "துறை / நிறுவனம்"
  },
  "reg.orgId": {
    en: "Organization ID",
    ta: "நிறுவன குறியீட்டு எண்"
  },
  "reg.requestedRole": {
    en: "Requested Role",
    ta: "கோரப்படும் பொறுப்பு"
  },
  "reg.submit": {
    en: "Submit Registration for Administrator Approval",
    ta: "நிர்வாகி ஒப்புதலுக்காக பதிவை சமர்ப்பிக்கவும்"
  },

  // Dashboard Top Cards & Common Metrics
  "card.activeCases": {
    en: "My Active Cases",
    ta: "செயலில் உள்ள வழக்குகள்"
  },
  "card.pendingUpload": {
    en: "Documents Pending Upload",
    ta: "பதிவேற்ற வேண்டிய ஆவணங்கள்"
  },
  "card.pendingApproval": {
    en: "Pending Review / Approval",
    ta: "சரிபார்ப்பு / ஒப்புதல் நிலுவை"
  },
  "card.recentActivity": {
    en: "Recent Case Activity",
    ta: "சமீபத்திய வழக்கு நிகழ்வுகள்"
  },
  "card.assignedCases": {
    en: "Assigned Cases",
    ta: "ஒதுக்கப்பட்ட வழக்குகள்"
  },
  "card.pendingExam": {
    en: "Pending Examination",
    ta: "ஆய்வு நிலுவையிலுள்ளவை"
  },
  "card.reportsProgress": {
    en: "Reports in Progress",
    ta: "தயாராகும் அறிக்கைகள்"
  },
  "card.reportsSubmitted": {
    en: "Reports Submitted",
    ta: "சமர்ப்பிக்கப்பட்ட அறிக்கைகள்"
  },
  "card.casesBeforeCourt": {
    en: "Cases Before Court",
    ta: "நீதிமன்ற விசாரணை வழக்குகள்"
  },
  "card.filingsPending": {
    en: "Filings Pending Review",
    ta: "மறுஆய்வு நிலுவை மனுக்கள்"
  },
  "card.awaitingApproval": {
    en: "Awaiting Approval",
    ta: "ஒப்புதல் நிலுவையிலுள்ளவை"
  },
  "card.ordersJudgments": {
    en: "Orders / Judgments",
    ta: "நீதிமன்ற உத்தரவுகள் / தீர்ப்புகள்"
  },
  "card.totalUsers": {
    en: "Total Users",
    ta: "மொத்த பயனர்கள்"
  },
  "card.activeUsers": {
    en: "Active Users",
    ta: "செயலில் உள்ள பயனர்கள்"
  },
  "card.pendingApprovals": {
    en: "Pending Approvals",
    ta: "நிலுவை ஒப்புதல்கள்"
  },
  "card.systemAlerts": {
    en: "System Alerts",
    ta: "கணினி எச்சரிக்கைகள்"
  },
  "card.totalAuditEvents": {
    en: "Total Audit Events",
    ta: "மொத்த தணிக்கை பதிவுகள்"
  },
  "card.failedAccess": {
    en: "Failed Access Attempts",
    ta: "தோல்வியடைந்த அணுகல்கள்"
  },
  "card.suspiciousActivities": {
    en: "Suspicious Activities",
    ta: "சந்தேகத்திற்குரிய செயல்கள்"
  },
  "card.integrityAlerts": {
    en: "Integrity Alerts",
    ta: "ஒருமைப்பாடு எச்சரிக்கைகள்"
  },

  // Prosecutor & Legal Cards
  "card.authorizedCases": {
    en: "Assigned / Authorized",
    ta: "அங்கீகரிக்கப்பட்ட வழக்குகள்"
  },
  "card.casesAwaitingLegalPrep": {
    en: "Awaiting Legal Prep",
    ta: "தயாரிப்பு நிலுவையிலுள்ளவை"
  },
  "card.chargeSheets": {
    en: "Charge Sheets",
    ta: "குற்றப்பத்திரிகைகள்"
  },
  "card.courtFilingsPending": {
    en: "Court Filings Pending",
    ta: "நீதிமன்ற மனுக்கள் நிலுவை"
  },
  "card.activeLegalMatters": {
    en: "Active Legal Matters",
    ta: "செயலில் உள்ள சட்ட வழக்குகள்"
  },
  "card.awaitingLegalReview": {
    en: "Awaiting Legal Review",
    ta: "சட்ட மறுஆய்வு நிலுவை"
  },
  "card.legalNotices": {
    en: "Legal Notices",
    ta: "சட்ட அறிவிப்புகள்"
  },
  "card.advisoriesIssued": {
    en: "Advisories Issued",
    ta: "வழங்கப்பட்ட ஆலோசனைகள்"
  },

  // Buttons & Actions
  "btn.createCase": {
    en: "+ Create Case",
    ta: "+ புதிய வழக்கு உருவாக்குக"
  },
  "btn.uploadEvidence": {
    en: "Upload Evidence",
    ta: "சான்றாதாரத்தை பதிவேற்றுக"
  },
  "btn.createReport": {
    en: "Create Forensic Report",
    ta: "தடய அறிக்கை உருவாக்குக"
  },
  "btn.approve": {
    en: "Approve",
    ta: "ஒப்புதல் அளி"
  },
  "btn.uploadOrder": {
    en: "Upload Order",
    ta: "உத்தரவை பதிவேற்றுக"
  },
  "btn.uploadJudgment": {
    en: "Upload Judgment",
    ta: "தீர்ப்பை பதிவேற்றுக"
  },
  "btn.reviewRemark": {
    en: "Review & Remark",
    ta: "ஆய்வு செய்து குறிப்பு சேர்க்க"
  },
  "btn.inspect": {
    en: "Inspect",
    ta: "ஆய்வு செய்க"
  },
  "btn.cancel": {
    en: "Cancel",
    ta: "ரத்து செய்"
  },
  "btn.save": {
    en: "Save",
    ta: "சேமி"
  },
  "btn.search": {
    en: "Search",
    ta: "தேடுக"
  },
  "btn.export": {
    en: "Export Audit Report",
    ta: "தணிக்கை அறிக்கை பதிவிறக்குக"
  },

  // Verification Page (QR Verification)
  "verify.title": {
    en: "Section 63 BSA Digital Evidence Verification",
    ta: "பிரிவு 63 BSA மின்னணு சான்றாதார சரிபார்ப்பு"
  },
  "verify.authentic": {
    en: "RECORD AUTHENTIC & VERIFIED",
    ta: "ஆவணம் உண்மையானது & சரிபார்க்கப்பட்டது"
  },
  "verify.tampered": {
    en: "SECURITY ALERT: DATA TAMPERING DETECTED",
    ta: "பாதுகாப்பு எச்சரிக்கை: தரவு மாற்றம்/சிதைவு கண்டறியப்பட்டது"
  },
  "verify.sealHash": {
    en: "Section 63 BSA Record Seal (SHA-256)",
    ta: "பிரிவு 63 BSA ஆவண முத்திரை (SHA-256)"
  },
  "verify.caseNo": {
    en: "Case Number",
    ta: "வழக்கு எண்"
  },
  "verify.firNo": {
    en: "FIR Number",
    ta: "முதல் தகவல் அறிக்கை எண்"
  },
  "verify.officer": {
    en: "Officer / Examiner",
    ta: "பதிவு செய்த அதிகாரி"
  },
  "verify.station": {
    en: "Police Station / Laboratory",
    ta: "காவல் நிலையம் / ஆய்வகம்"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");

  useEffect(() => {
    // Load persisted settings from localStorage
    const savedLang = localStorage.getItem("legal_dms_lang") as Language;
    if (savedLang === "en" || savedLang === "ta") {
      setLanguageState(savedLang);
    }

    const savedSize = localStorage.getItem("legal_dms_font_size") as FontSize;
    if (savedSize === "normal" || savedSize === "large" || savedSize === "xlarge") {
      applyFontSize(savedSize);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("legal_dms_lang", lang);
  };

  const applyFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("legal_dms_font_size", size);

    if (typeof document !== "undefined") {
      const htmlEl = document.documentElement;
      if (size === "normal") {
        htmlEl.style.fontSize = "16px";
        htmlEl.style.zoom = "1";
      } else if (size === "large") {
        htmlEl.style.fontSize = "17.5px";
        htmlEl.style.zoom = "1.08";
      } else if (size === "xlarge") {
        htmlEl.style.fontSize = "19px";
        htmlEl.style.zoom = "1.16";
      }
    }
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, fontSize, setFontSize: applyFontSize, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function AccessibilityBar() {
  const { language, setLanguage, fontSize, setFontSize } = useLanguage();

  return (
    <div className="flex items-center gap-2 text-xs select-none">
      {/* Tamil / English Toggle Button */}
      <button
        onClick={() => setLanguage(language === "en" ? "ta" : "en")}
        title="Toggle between English and தமிழ்"
        className="bg-white/15 hover:bg-white/25 px-2.5 py-0.5 rounded text-[11px] font-bold text-white border border-white/20 transition cursor-pointer flex items-center gap-1 shadow-inner"
      >
        <span>{language === "en" ? "தமிழ் மொழி" : "English"}</span>
      </button>

      {/* Font Resizing Controls (A / A+ / A++) */}
      <div className="flex items-center gap-0.5 bg-black/15 border border-white/15 rounded px-1.5 py-0.5 text-[11px] font-bold">
        <button
          onClick={() => setFontSize("normal")}
          title="Default Font Size (100%)"
          className={`px-1.5 py-0.2 rounded transition cursor-pointer ${
            fontSize === "normal"
              ? "bg-white text-[#684f9b] font-black shadow-xs"
              : "text-purple-200 hover:text-white"
          }`}
        >
          A
        </button>
        <button
          onClick={() => setFontSize("large")}
          title="Larger Font Size (110%)"
          className={`px-1.5 py-0.2 rounded transition cursor-pointer ${
            fontSize === "large"
              ? "bg-white text-[#684f9b] font-black shadow-xs"
              : "text-purple-200 hover:text-white"
          }`}
        >
          A+
        </button>
        <button
          onClick={() => setFontSize("xlarge")}
          title="Largest Accessible Font Size (120%)"
          className={`px-1.5 py-0.2 rounded transition cursor-pointer ${
            fontSize === "xlarge"
              ? "bg-white text-[#684f9b] font-black shadow-xs"
              : "text-purple-200 hover:text-white"
          }`}
        >
          A++
        </button>
      </div>
    </div>
  );
}
