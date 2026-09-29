import type { AnalysisContext, RawMessage, Signal } from './types';

/** Sender IDs MTN Ghana uses for MoMo and service messages (normalized). */
const OFFICIAL_SENDERS = ['mobilemoney', 'mtn', 'mtnghana', 'mtnmomo'];
const OFFICIAL_DOMAINS = ['mtn.com.gh', 'mtn.com', 'mtnonline.com'];
const SHORTENERS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 't.co', 'is.gd', 'rb.gy', 'shorturl.at', 'tiny.cc', 'ow.ly', 'rebrand.ly'];
const RISKY_TLDS = ['xyz', 'top', 'click', 'info', 'live', 'online', 'site', 'buzz', 'icu', 'win', 'loan'];

const PHONE_RE = /(?:\+?233|\b0)\d{9}\b/;
const LINK_RE = /\b(?:https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|gh|net|org|ly|xyz|top|click|info|live|online|site|me|co|at|cc|gd)(?:\/[^\s]*)?)/gi;

export const normalizeSender = (s: string) =>
  s.toLowerCase().replace(/[\s._-]/g, '').replace(/0/g, 'o').replace(/[1|]/g, 'l');

const isPhoneSender = (s: string) => /^\+?[\d\s-]{7,}$/.test(s.trim());

export const isOfficialSender = (sender: string) => OFFICIAL_SENDERS.includes(normalizeSender(sender));

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function extractLinks(text: string): string[] {
  return [...new Set((text.match(LINK_RE) ?? []).map((l) => l.replace(/[.,)!?]+$/, '')))];
}

function hostOf(link: string): string {
  return link.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase();
}

type LinkVerdict = { id: string; weight: number; title: string; explanation: string; host: string };

function judgeLink(link: string): LinkVerdict {
  const host = hostOf(link);
  if (OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { id: 'official_link', weight: 0, host, title: 'Official MTN link', explanation: `${host} is an official MTN domain.` };
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return { id: 'ip_link', weight: 32, host, title: 'Link to a raw IP address', explanation: 'Real companies do not send links to bare number addresses. This is a common way to hide a fake login page.' };
  }
  if (/(mtn|momo|mobilemoney)/.test(host)) {
    return { id: 'lookalike_domain', weight: 35, host, title: 'Fake MTN-looking website', explanation: `“${host}” uses MTN or MoMo in its name but is not an MTN website. Pages like this are built to steal your PIN.` };
  }
  if (SHORTENERS.some((d) => host === d)) {
    return { id: 'short_link', weight: 25, host, title: 'Hidden link destination', explanation: `${host} is a link shortener. It hides where the link really goes, which scammers use to disguise phishing pages.` };
  }
  const tld = host.split('.').pop() ?? '';
  if (RISKY_TLDS.includes(tld)) {
    return { id: 'risky_tld', weight: 22, host, title: 'Link to a high-risk website', explanation: `Websites ending in “.${tld}” are cheap to register and often used for scams.` };
  }
  return { id: 'link', weight: 10, host, title: 'Contains a link', explanation: 'The message asks you to open a website. Only open links you were expecting.' };
}

const has = (re: RegExp, text: string) => re.test(text);
const match = (re: RegExp, text: string) => text.match(re)?.[0];

/**
 * Explainable fraud signals. Each rule encodes a pattern MoMo fraud teams see
 * repeatedly, and carries the plain-language explanation shown to customers.
 */
export function collectSignals(msg: RawMessage, ctx: AnalysisContext): Signal[] {
  const body = msg.body;
  const text = body.toLowerCase();
  const signals: Signal[] = [];
  const add = (s: Signal) => signals.push(s);

  const senderKey = normalizeSender(msg.sender);
  const official = isOfficialSender(msg.sender);
  const phoneSender = isPhoneSender(msg.sender);
  const mentionsBrand = has(/\bmtn\b|\bmomo\b|mobile ?money/, text);
  const safetyNotice = has(/(do not|don'?t|never)\s+(share|give|disclose|tell)|will never ask/, text);

  // --- Sender -------------------------------------------------------------
  if (ctx.trustedSenders.map(normalizeSender).includes(senderKey)) {
    add({ id: 'trusted_sender', title: 'You trust this sender', explanation: 'You marked this sender as safe earlier.', weight: -40 });
  }
  if (ctx.blockedSenders.map(normalizeSender).includes(senderKey)) {
    add({ id: 'blocked_sender', title: 'You blocked this sender', explanation: 'You previously blocked this sender for suspicious activity.', weight: 45 });
  }
  if (official) {
    add({
      id: 'official_sender',
      title: 'Registered MTN sender ID',
      explanation: `Sent from “${msg.sender}”, a registered MTN sender name. Sender names can occasionally be faked, so FraudX still checks the content.`,
      weight: -30,
    });
  } else if (!phoneSender && (/(mtn|momo|mobilemoney)/.test(senderKey) || OFFICIAL_SENDERS.some((o) => o.length > 4 && levenshtein(o, senderKey) <= 2))) {
    add({
      id: 'lookalike_sender',
      title: 'Sender imitates MTN',
      explanation: `“${msg.sender}” looks like an MTN name but is not one MTN uses. Official MoMo messages come from “MobileMoney”.`,
      weight: 30,
      category: 'impersonation',
      evidence: msg.sender,
    });
  } else if (phoneSender && mentionsBrand && has(/(customer (care|service)|staff|agent|promo|reward|account|wallet|free|bundle|users|mtn:)/, text)) {
    add({
      id: 'phone_claims_brand',
      title: 'Personal number claiming to be MTN',
      explanation: 'This came from an ordinary phone number but talks as if it is MTN. MTN does not message customers from personal numbers.',
      weight: 30,
      category: 'impersonation',
      evidence: msg.sender,
    });
  }

  // --- PIN / OTP theft ----------------------------------------------------
  const secretRe = /\b(pin|otp|password|secret code|verification code|the code|code (we|sent))\b/;
  const askRe = /\b(send|share|reply|provide|give|forward|tell|enter|confirm|type)\b[^.!?]{0,45}\b(pin|otp|password|secret code|verification code|code)\b/;
  if (!safetyNotice && has(secretRe, text) && has(askRe, text)) {
    add({
      id: 'pin_request',
      title: 'Asks for your PIN or code',
      explanation: 'MTN will never ask for your MoMo PIN or one-time code by SMS, phone call or website. Anyone who has it can empty your wallet.',
      weight: 45,
      category: 'pin_otp_theft',
      evidence: match(askRe, text),
    });
  }
  if (safetyNotice) {
    add({ id: 'safety_notice', title: 'Includes a safety warning', explanation: 'The message tells you not to share codes, which genuine services do.', weight: -10 });
  }

  // --- Links --------------------------------------------------------------
  const links = extractLinks(body);
  if (links.length) {
    const worst = links.map(judgeLink).sort((a, b) => b.weight - a.weight)[0];
    if (worst.weight > 0) {
      add({ id: worst.id, title: worst.title, explanation: worst.explanation, weight: worst.weight, category: worst.weight >= 20 ? 'phishing_link' : undefined, evidence: worst.host });
    }
  }

  // --- Scam narratives ----------------------------------------------------
  const promoRe = /\b(congratulations|congrats|you (have )?won|winner|lucky|jackpot|prize|promo|reward|bonus|cash ?back|grant|giveaway|free \d+ ?gb|been selected|double your money)\b/;
  if (has(promoRe, text) && !official) {
    add({
      id: 'promotion',
      title: 'Unexpected prize or promotion',
      explanation: 'Messages about prizes or rewards you did not enter for are the most common MoMo scam. Real MTN promotions are announced from official channels.',
      weight: 22,
      category: 'fake_promotion',
      evidence: match(promoRe, text),
    });
  }
  const feeRe = /\b(processing|activation|clearance|insurance|registration|release|delivery|claim(ing)?|withdrawal) fee\b|\bpay\b[^.]{0,40}\bto (claim|receive|withdraw|unlock)\b|\bregister with ghs?/;
  if (has(feeRe, text)) {
    add({
      id: 'upfront_fee',
      title: 'Pay a fee to receive money',
      explanation: 'You are asked to pay first in order to receive a prize, loan or parcel. Genuine payouts never require an upfront fee.',
      weight: 22,
      category: 'fake_promotion',
      evidence: match(feeRe, text),
    });
  }

  const reversalRe = /\b(by mistake|mistakenly|wrong(ly)? (sent|transfer\w*|number)|sent[^.]{0,30}by error|credited[^.]{0,30}by error|send it back|reverse it|kindly refund|refund (it|the|my|ghs?))\b/;
  if (!official && has(reversalRe, text)) {
    add({
      id: 'reversal',
      title: '“Sent by mistake” refund request',
      explanation: 'Scammers send a fake “money received” SMS, then ask you to send it back. Check your real balance on *170#. Genuine mistakes are reversed by MTN, not by you.',
      weight: 40,
      category: 'reversal_scam',
      evidence: match(reversalRe, text),
    });
  }

  const creditRe = /\b(payment received|you have received|cash in received|credited with|has been credited|received ghs?)\b/;
  if (!official && has(creditRe, text) && !ctx.trustedSenders.map(normalizeSender).includes(senderKey)) {
    add({
      id: 'fake_credit',
      title: 'Money-received alert from a non-MTN sender',
      explanation: `Real MoMo receipts only come from “MobileMoney”. This one came from “${msg.sender}”, so the money may not exist. Check your balance on *170# before acting.`,
      weight: 35,
      category: 'fake_credit_alert',
      evidence: match(creditRe, text),
    });
  }

  const approvalRe = /\b(dial|enter)\b[^.]{0,40}(\*\d[\d*#]*|pin|secret code)[^.]{0,50}\b(approve|confirm|accept|receive|withdraw|claim|unlock)\b|\b(approve|confirm)\b[^.]{0,30}\b(with|using) (your )?(pin|secret code)\b/;
  if (has(approvalRe, text)) {
    add({
      id: 'payment_approval',
      title: 'Trick to approve a payment',
      explanation: 'Entering your PIN on a prompt approves money leaving your wallet. Scammers present it as “receiving” or “claiming” money.',
      weight: 30,
      category: 'payment_approval',
      evidence: match(approvalRe, text),
    });
  }

  const threatRe = /\b(suspend(ed)?|block(ed)?|deactivat(ed|e)|clos(ed|ure)|expired?|restricted|frozen|locked)\b/;
  if (!official && has(threatRe, text) && has(/\b(account|wallet|sim|number|momo)\b/, text)) {
    add({
      id: 'account_threat',
      title: 'Threatens to close your account',
      explanation: 'Scammers create fear that your wallet or SIM will be blocked so you act without thinking. MTN resolves account issues through official channels.',
      weight: 20,
      category: 'account_threat',
      evidence: match(threatRe, text),
    });
  }

  const urgencyRe = /\b(urgent(ly)?|immediately|asap|final warning|last chance|limited slots|before it expires|within \d+ ?(hours?|hrs|minutes|mins))\b|\b(call|click|verify|visit|reply|send|act|claim) now\b/;
  if (has(urgencyRe, text)) {
    add({
      id: 'urgency',
      title: 'Pressure to act fast',
      explanation: 'Deadlines and urgent language are used to stop you from checking whether the message is real.',
      weight: 12,
      evidence: match(urgencyRe, text),
    });
  }

  if (has(/\b(call|contact|whatsapp|reach|text)\b/, text) && PHONE_RE.test(body) && has(/\b(agent|manager|staff|customer (care|service)|officer)\b/, text)) {
    add({
      id: 'callback',
      title: 'Asks you to call a private “agent”',
      explanation: 'The message gives a personal number for an “agent” or “manager”. MTN customer care does not use personal mobile numbers.',
      weight: 20,
      category: 'impersonation',
      evidence: match(PHONE_RE, body),
    });
  }

  const dataRe = /\b(ghana card|id (card|number)|date of birth|password|account details|mother'?s maiden name)\b/;
  if (has(dataRe, text) && has(/\b(send|provide|update|confirm|verify|enter|share)\b/, text)) {
    add({
      id: 'personal_data',
      title: 'Asks for personal details',
      explanation: 'Your ID and personal details can be used to take over your SIM and wallet. Only share them in person at an MTN office.',
      weight: 22,
      category: 'personal_data',
      evidence: match(dataRe, text),
    });
  }

  const moneyAskRe = /\b(send|pay|transfer)\b[^.]{0,40}(ghs?|money|cash|fee)/;
  if (has(/\b(stranded|hospital|accident|emergency|arrested|help me|phone is off)\b/, text) && has(moneyAskRe, text)) {
    add({
      id: 'emergency',
      title: 'Emergency request for money',
      explanation: 'Someone claims to be a relative in trouble and asks for money urgently. Call the person on their usual number first.',
      weight: 22,
      category: 'emergency_request',
    });
  } else if (has(moneyAskRe, text) && PHONE_RE.test(body) && !official) {
    add({
      id: 'money_to_number',
      title: 'Asks you to send money to a number',
      explanation: 'You are asked to send money to a personal number. Make sure you know and trust the recipient.',
      weight: 14,
      evidence: match(PHONE_RE, body),
    });
  }

  const words = body.split(/\s+/).filter((w) => /^[A-Za-z]{4,}$/.test(w));
  const capsRatio = words.length ? words.filter((w) => w === w.toUpperCase()).length / words.length : 0;
  if ((body.match(/!/g) ?? []).length >= 3 || (words.length >= 5 && capsRatio > 0.4)) {
    add({ id: 'shouting', title: 'Aggressive formatting', explanation: 'Heavy use of capitals and exclamation marks is typical of scam messages.', weight: 6 });
  }

  // --- Legitimacy indicators ---------------------------------------------
  if (official && has(/transaction id/, text) && has(/balance/, text)) {
    add({ id: 'receipt_structure', title: 'Genuine receipt format', explanation: 'Includes a transaction ID and balance in the standard MoMo receipt format.', weight: -20 });
  }

  return signals;
}
