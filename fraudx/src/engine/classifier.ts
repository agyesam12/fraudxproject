import { LEGIT_SAMPLES, SCAM_SAMPLES } from './corpus';

/**
 * Multinomial Naive Bayes over unigrams + bigrams.
 *
 * Small, dependency-free and fully on-device: message text never leaves the
 * phone. It is the "language" half of the hybrid detector; the rule signals in
 * signals.ts provide the explainable half.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'and', 'or', 'in', 'on', 'for', 'is', 'it', 'at', 'by', 'be',
  'with', 'this', 'that', 'you', 'your', 'our', 'we', 'i', 'my', 'me', 'has', 'have', 'been',
  'are', 'was', 'from', 'will', 'so', 'as', 'can', 'if', 'do', 'am',
]);

/** Readable labels for placeholder tokens when surfacing model evidence. */
const PLACEHOLDER_LABELS: Record<string, string> = {
  _url: 'a web link',
  _phone: 'a phone number',
  _amount: 'a money amount',
  _num: 'a number',
  _ussd: 'a dial code',
};

export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/https?:\/\/\S+|www\.\S+|\b[a-z0-9-]+\.(?:xyz|top|com|net|org|gh|ly|me|click|info)\/\S*/g, ' _url ')
    .replace(/\*\d[\d*#]*#?/g, ' _ussd ')
    .replace(/(?:\+?233|0)\d{9}\b/g, ' _phone ')
    .replace(/ghs?\s?[\d,]+(?:\.\d+)?/g, ' _amount ')
    .replace(/\d+/g, ' _num ')
    .replace(/[^a-z_\s]/g, ' ');

  const words = normalized.split(/\s+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));
  const tokens = [...words];
  for (let i = 0; i < words.length - 1; i++) tokens.push(`${words[i]} ${words[i + 1]}`);
  return tokens;
}

type Model = {
  vocab: Set<string>;
  counts: { scam: Map<string, number>; legit: Map<string, number> };
  totals: { scam: number; legit: number };
};

function train(): Model {
  const model: Model = {
    vocab: new Set(),
    counts: { scam: new Map(), legit: new Map() },
    totals: { scam: 0, legit: 0 },
  };
  const add = (label: 'scam' | 'legit', text: string) => {
    for (const t of tokenize(text)) {
      model.vocab.add(t);
      model.counts[label].set(t, (model.counts[label].get(t) ?? 0) + 1);
      model.totals[label]++;
    }
  };
  SCAM_SAMPLES.forEach((s) => add('scam', s));
  LEGIT_SAMPLES.forEach((s) => add('legit', s));
  return model;
}

let cached: Model | null = null;
const getModel = () => (cached ??= train());

export type ModelPrediction = {
  probability: number;
  topTerms: string[];
};

export function predict(text: string): ModelPrediction {
  const model = getModel();
  const v = model.vocab.size;
  const tokens = tokenize(text).filter((t) => model.vocab.has(t));
  if (tokens.length === 0) return { probability: 0.5, topTerms: [] };

  const contributions = new Map<string, number>();
  let logOdds = 0; // Equal priors: the corpus is balanced by design.
  for (const t of tokens) {
    const pScam = ((model.counts.scam.get(t) ?? 0) + 1) / (model.totals.scam + v);
    const pLegit = ((model.counts.legit.get(t) ?? 0) + 1) / (model.totals.legit + v);
    const llr = Math.log(pScam / pLegit);
    logOdds += llr;
    contributions.set(t, (contributions.get(t) ?? 0) + llr);
  }

  // Temper the naive independence assumption so short texts are not overconfident.
  const probability = 1 / (1 + Math.exp(-logOdds / Math.max(2, Math.sqrt(tokens.length))));

  const topTerms = [...contributions.entries()]
    .filter(([t, c]) => c > 0.6 && !t.includes(' '))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => PLACEHOLDER_LABELS[t] ?? `“${t}”`);

  return { probability, topTerms };
}
