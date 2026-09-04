export interface UserProfile {
  token: string;
  badgeNumber: string;
  fullName: string;
  role: string;
  state: string;
  district: string;
  stationOrCourt: string;
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