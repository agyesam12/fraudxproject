export type RiskLevel = 'safe' | 'suspicious' | 'scam';

export type ThreatCategory =
  | 'pin_otp_theft'
  | 'impersonation'
  | 'phishing_link'
  | 'fake_promotion'
  | 'reversal_scam'
  | 'fake_credit_alert'
  | 'payment_approval'
  | 'account_threat'
  | 'emergency_request'
  | 'personal_data';

export type Sensitivity = 'relaxed' | 'balanced' | 'strict';

/** One explainable reason that moved the score, shown to the customer verbatim. */
export type Signal = {
  id: string;
  title: string;
  explanation: string;
  /** Positive pushes toward scam, negative toward legitimate. */
  weight: number;
  category?: ThreatCategory;
  evidence?: string;
};

export type Analysis = {
  score: number;
  level: RiskLevel;
  category: ThreatCategory | null;
  headline: string;
  signals: Signal[];
  /** Tokens the language model found most indicative of scams. */
  modelTerms: string[];
  modelProbability: number;
  ruleScore: number;
  links: string[];
  advice: string[];
};

export type AnalysisContext = {
  sensitivity: Sensitivity;
  trustedSenders: string[];
  blockedSenders: string[];
};

export type RawMessage = {
  sender: string;
  body: string;
};
