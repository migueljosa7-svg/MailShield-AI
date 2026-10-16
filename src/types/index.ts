export interface ExtractedLink {
  originalUrl: string;
  anchorText: string;
  isButton: boolean;
}

export interface LinkAnalysis {
  url: string;
  anchorText: string;
  domain: string;
  isSuspicious: boolean;
  isShortener: boolean;
  isIpAddress: boolean;
  isLookalikeDomain: boolean;
  isHighRiskTld: boolean;
  anchorDomainMismatch: boolean;
  resolvedUrl?: string;
  reasons: string[];
}

export interface EmailData {
  id?: string;
  senderName: string;
  senderEmail: string;
  senderDomain: string;
  replyTo?: string;
  subject: string;
  bodySnippet: string;
  links: ExtractedLink[];
}

export interface RiskBreakdown {
  id: string;
  category: 'sender' | 'links' | 'content' | 'headers';
  severity: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
}

export interface EmailRiskResult {
  score: number; // 0 to 100
  level: 'low' | 'moderate' | 'high';
  reasons: string[];
  breakdowns: RiskBreakdown[];
  linkAnalyses: LinkAnalysis[];
  senderDetails: {
    name: string;
    email: string;
    domain: string;
    isWellKnownBrand: boolean;
    brandImpersonationRisk: boolean;
    impersonatedBrand?: string;
    isSuspiciousTld: boolean;
    isPunycode: boolean;
    replyToMismatch: boolean;
  };
  urgencyDetected: boolean;
  urgencyKeywords: string[];
  analyzedAt: number;
}

export interface CachedDomain {
  domain: string;
  reputation: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  reasons: string[];
  timestamp: number;
}

export interface ExtensionStats {
  scannedCount: number;
  threatsBlocked: number;
  lastScannedSubject?: string;
  lastRiskScore?: number;
}

export type ExtensionMessage =
  | { type: 'ANALYZE_EMAIL'; payload: EmailData }
  | { type: 'RESOLVE_URL'; payload: { url: string } }
  | { type: 'GET_STATS' }
  | { type: 'RECORD_SCAN'; payload: { isThreat: boolean; score: number; subject: string } }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<MailShieldSettings> }
  | { type: 'REPORT_PHISHING'; payload: { email: EmailData; score: number } };

export interface MailShieldSettings {
  strictMode: boolean;
  enableCloudAnalysis: boolean;
  backendApiUrl: string;
  autoScan: boolean;
  darkTheme: boolean;
}
