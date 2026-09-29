import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { CATEGORY_LABELS, type Analysis, type RiskLevel, type Signal } from '@/engine';
import { colors, radius, risk, space, type } from '@/theme';
import { ScoreRing } from './ScoreRing';
import { Card, SectionHeader } from './ui';

const VERDICT: Record<RiskLevel, string> = {
  scam: 'Likely scam',
  suspicious: 'Be careful',
  safe: 'Looks safe',
};

export function VerdictCard({ analysis }: { analysis: Analysis }) {
  const r = risk[analysis.level];
  return (
    <Card style={[styles.verdict, { borderColor: r.fg }]}>
      <ScoreRing score={analysis.score} level={analysis.level} size={104} />
      <View style={styles.verdictText}>
        <View style={[styles.verdictPill, { backgroundColor: r.bg }]}>
          <Ionicons name={r.icon} size={14} color={r.fg} />
          <Text style={[styles.verdictPillText, { color: r.fg }]}>{VERDICT[analysis.level]}</Text>
        </View>
        <Text style={styles.headline}>{analysis.headline}</Text>
        {analysis.category && <Text style={type.small}>{CATEGORY_LABELS[analysis.category]}</Text>}
      </View>
    </Card>
  );
}

function SignalItem({ signal }: { signal: Signal }) {
  const good = signal.weight < 0;
  const strong = signal.weight >= 25;
  const color = good ? colors.safe : strong ? colors.danger : colors.warn;
  const bg = good ? colors.safeBg : strong ? colors.dangerBg : colors.warnBg;
  return (
    <View style={styles.signal}>
      <View style={[styles.signalIcon, { backgroundColor: bg }]}>
        <Ionicons name={good ? 'checkmark' : strong ? 'close' : 'alert'} size={16} color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.signalTitle}>{signal.title}</Text>
        <Text style={type.body}>{signal.explanation}</Text>
        {signal.evidence && (
          <Text style={styles.evidence} numberOfLines={2}>
            Found: “{signal.evidence}”
          </Text>
        )}
      </View>
    </View>
  );
}

export function AnalysisDetails({ analysis }: { analysis: Analysis }) {
  const warnings = analysis.signals.filter((s) => s.weight > 0);
  const reassurances = analysis.signals.filter((s) => s.weight < 0);
  const modelPct = Math.round(analysis.modelProbability * 100);

  return (
    <View>
      {warnings.length > 0 && (
        <>
          <SectionHeader title={`Why FraudX flagged this · ${warnings.length}`} />
          <Card style={styles.list}>
            {warnings.map((s) => (
              <SignalItem key={s.id} signal={s} />
            ))}
          </Card>
        </>
      )}

      {analysis.advice.length > 0 && (
        <>
          <SectionHeader title="What you should do" />
          <Card style={[styles.list, { backgroundColor: colors.ink }]}>
            {analysis.advice.map((a, i) => (
              <View key={i} style={styles.adviceRow}>
                <Text style={styles.adviceNum}>{i + 1}</Text>
                <Text style={styles.adviceText}>{a}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {reassurances.length > 0 && (
        <>
          <SectionHeader title="Reassuring signs" />
          <Card style={styles.list}>
            {reassurances.map((s) => (
              <SignalItem key={s.id} signal={s} />
            ))}
          </Card>
        </>
      )}

      <SectionHeader title="AI language check" />
      <Card style={{ gap: space.sm }}>
        <View style={styles.meterRow}>
          <Text style={styles.signalTitle}>Similarity to known scams</Text>
          <Text style={[styles.signalTitle, { color: modelPct >= 55 ? colors.danger : colors.safe }]}>{modelPct}%</Text>
        </View>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${modelPct}%`, backgroundColor: modelPct >= 55 ? colors.danger : colors.safe }]} />
        </View>
        <Text style={type.small}>
          {analysis.modelTerms.length > 0
            ? `Wording that often appears in scams: ${analysis.modelTerms.join(', ')}.`
            : 'The wording is not typical of scam messages we have seen.'}{' '}
          Checked on your phone. The message was not uploaded.
        </Text>
      </Card>
      {!warnings.length && !reassurances.length && (
        <Text style={[type.small, { marginTop: space.md, textAlign: 'center' }]}>No specific warning signs were found in this message.</Text>
      )}
    </View>
  );
}

/** Message text with links highlighted and non-interactive, so a risky link cannot be tapped. */
export function MessageBody({ body, links, level }: { body: string; links: string[]; level: RiskLevel }) {
  const parts: { text: string; link: boolean }[] = [];
  let rest = body;
  while (rest.length) {
    const hits = links.map((l) => ({ l, i: rest.indexOf(l) })).filter((h) => h.i >= 0).sort((a, b) => a.i - b.i);
    if (!hits.length) {
      parts.push({ text: rest, link: false });
      break;
    }
    const { l, i } = hits[0];
    if (i > 0) parts.push({ text: rest.slice(0, i), link: false });
    parts.push({ text: l, link: true });
    rest = rest.slice(i + l.length);
  }
  const linkColor = level === 'safe' ? colors.inkSoft : risk[level].fg;

  return (
    <Text style={styles.body} selectable>
      {parts.map((p, i) =>
        p.link ? (
          <Text key={i} style={[styles.link, { color: linkColor, backgroundColor: level === 'safe' ? colors.bg : risk[level].bg }]}>
            {p.text}
          </Text>
        ) : (
          p.text
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  verdict: { flexDirection: 'row', alignItems: 'center', gap: space.lg, borderLeftWidth: 5 },
  verdictText: { flex: 1, gap: 6 },
  verdictPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  verdictPillText: { fontSize: 13, fontWeight: '800' },
  headline: { fontSize: 18, fontWeight: '800', color: colors.ink, lineHeight: 23 },
  list: { gap: space.lg },
  signal: { flexDirection: 'row', gap: space.md },
  signalIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  signalTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  evidence: { fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: 2 },
  adviceRow: { flexDirection: 'row', gap: space.md },
  adviceNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.brand, color: colors.onBrand, textAlign: 'center', fontWeight: '800', fontSize: 13, lineHeight: 22, overflow: 'hidden' },
  adviceText: { flex: 1, color: '#FFFFFF', fontSize: 15, lineHeight: 22 },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4 },
  body: { fontSize: 16, lineHeight: 24, color: colors.ink },
  link: { fontWeight: '700', textDecorationLine: 'underline' },
});
