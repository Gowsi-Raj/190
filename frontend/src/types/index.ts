export interface UserProfile {
  token: string;
  badgeNumber: string;
  fullName: string;
  role: string;
  state: string;
  district: string;
  stationOrCourt: string;
  email?: string;
  mobile?: string;
  organization?: string;
  orgId?: string;
  status?: string;
}

export interface ScanResult {
  tempDocId: string;
  docHash: string;
  fileName: string;
  extractedText: string;
  redactedText?: string;
  detectedSections: string[];
  confidenceScore: number;
}

export interface AssignedCase {
  caseId: string;
  firNumber: string;
  caseTitle: string;
  investigationStatus: string;
  lastActivity: string;
  documentCount: number;
  assignments?: {
    io?: string;
    forensic?: string;
    prosecution?: string;
    court?: string;
    legal?: string;
  };
}

export interface ForensicEvidenceItem {
  evidenceId: string;
  caseId: string;
  type: string;
  received: string;
  status: string;
  description: string;
}

export interface ProsecutionCaseAction {
  caseId: string;
  case: string;
  status: string;
  action: string;
}

export interface CourtActionItem {
  caseId: string;
  filing: string;
  submittedBy: string;
  status: string;
  submittedDate: string;
}

export interface LegalReviewItem {
  caseId: string;
  document: string;
  submittedBy: string;
  status: string;
  priority: string;
}

export interface AdminMetrics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    pendingUserApprovals: number;
    activeCases: number;
    accessRequests: number;
    systemAlerts: number;
  };
  distribution: {
    police: number;
    forensics: number;
    prosecution: number;
    court: number;
    legal: number;
    auditors: number;
  };
}

export interface AdminUser {
  badgeNumber: string;
  username: string;
  fullName: string;
  role: string;
  organization: string;
  orgId: string;
  status: string;
  lastLogin: string;
  isSeeded?: boolean;
}