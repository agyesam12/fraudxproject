import { predict } from './classifier';
import { collectSignals, extractLinks, normalizeSender } from './signals';
import type { Analysis, AnalysisContext, RawMessage, RiskLevel, Sensitivity, ThreatCategory } from './types';

export * from './types';
export { isOfficialSender, normalizeSender } from './signals';

export const ENGINE_VERSION = '0.1.0-proto';

const THRESHOLDS: Record<Sensitivity, { suspicious: number; scam: number }> = {
  relaxed: { suspicious: 45, scam: 78 },
  balanced: { suspicious: 35, scam: 65 },
  strict: { suspicious: 25, scam: 55 },
};

const RULE_WEIGHT = 0.65;
const MODEL_WEIGHT = 0.35;
const BASELINE = 15;

export const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  pin_otp_theft: 'PIN / code theft',
  impersonation: 'MTN impersonation',
  phishing_link: 'Phishing link',
  fake_promotion: 'Fake promotion',
  reversal_scam: 'Refund scam',
  fake_credit_alert: 'Fake credit alert',
  payment_approval: 'Payment approval trick',
  account_threat: 'Account threat',
  emergency_request: 'Emergency scam',
  personal_data: 'Identity theft',
};

const HEADLINES: Record<ThreatCategory, string> = {
  pin_otp_theft: 'Someone is trying to get your PIN or code',
  impersonation: 'Someone is pretending to be MTN',
  phishing_link: 'This link may steal your details',
  fake_promotion: 'This looks like a fake prize or promotion',
  reversal_scam: 'This looks like a “sent by mistake” scam',
  fake_credit_alert: 'This money-received alert may be fake',
  payment_approval: 'This could make you approve a payment',
  account_threat: 'This is a fake account threat',
  emergency_request: 'This looks like an emergency money scam',
  personal_data: 'Someone wants your personal details',
};

const CATEGORY_ADVICE: Record<ThreatCategory, string> = {
  pin_otp_theft: 'Never share your MoMo PIN or any code, not even with someone who says they are from MTN.',
  impersonation: 'Contact MTN only through official channels, not through the number or link in this message.',
  phishing_link: 'Do not open the link. If you already entered your PIN, change it now on *170#.',
  fake_promotion: 'Real prizes never require a fee. Ignore the message and do not send money.',
  reversal_scam: 'Check your real balance on *170#. If someone really sent money by mistake, MTN reverses it and you do nothing.',
  fake_credit_alert: 'Check your balance on *170# before you act on any “money received” message.',
  payment_approval: 'Do not enter your PIN on any prompt you did not start yourself. Reject it.',
  account_threat: 'Your account is not closed by SMS. Visit an MTN service centre if you are worried.',
  emergency_request: 'Call your relative on the number you already have before you send anything.',
  personal_data: 'Share your Ghana Card details only in person at an MTN office.',
};

export function levelFor(score: number, sensitivity: Sensitivity): RiskLevel {
  const t = THRESHOLDS[sensitivity];
  if (score >= t.scam) return 'scam';
  if (score >= t.suspicious) return 'suspicious';
  return 'safe';
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Scores a message on-device. Pure and synchronous, fast enough to run on every SMS. */
export function analyzeMessage(msg: RawMessage, ctx: AnalysisContext): Analysis {
  const signals = collectSignals(msg, ctx);
  const model = predict(msg.body);

  const ruleScore = clamp(BASELINE + signals.reduce((sum, s) => sum + s.weight, 0));
  let score = RULE_WEIGHT * ruleScore + MODEL_WEIGHT * model.probability * 100;

  const ids = new Set(signals.map((s) => s.id));
  const userTrusted = ids.has('trusted_sender');
  // Hard floors: some patterns are dangerous regardless of how the rest reads.
  // A PIN request stays critical even from a trusted sender (their phone may be compromised).
  if (ids.has('pin_request')) score = Math.max(score, 85);
  if (ids.has('lookalike_domain') || ids.has('ip_link')) score = Math.max(score, 72);
  if (ids.has('blocked_sender')) score = Math.max(score, 75);
  if (userTrusted && !ids.has('pin_request')) score = Math.min(score, 25);
  score = Math.round(clamp(score));

  const level = levelFor(score, ctx.sensitivity);
  const threats = signals.filter((s) => s.weight > 0 && s.category).sort((a, b) => b.weight - a.weight);
  const category = level === 'safe' ? null : (threats[0]?.category ?? null);

  const headline =
    category ? HEADLINES[category]
    : level === 'suspicious' ? 'Some warning signs found. Be careful'
    : 'No scam patterns found';

  const advice: string[] = [];
  if (level !== 'safe') {
    const seen = new Set<ThreatCategory>();
    for (const t of threats) {
      if (!seen.has(t.category!)) advice.push(CATEGORY_ADVICE[t.category!]);
      seen.add(t.category!);
      if (advice.length === 2) break;
    }
    advice.push('Do not reply, open links, call numbers or send money from this message.');
    advice.push('MTN will never ask for your MoMo PIN.');
  }

  return {
    score,
    level,
    category,
    headline,
    signals: signals.sort((a, b) => b.weight - a.weight),
    modelTerms: model.probability >= 0.55 ? model.topTerms : [],
    modelProbability: model.probability,
    ruleScore,
    links: extractLinks(msg.body),
    advice,
  };
}
