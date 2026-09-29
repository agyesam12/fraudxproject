import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ScannedMessage } from '@/state/FraudXContext';
import { colors, risk, space } from '@/theme';
import { initialOf, timeAgo } from '@/utils/format';
import { RiskBadge } from './RiskBadge';

export function MessageRow({ message, onPress }: { message: ScannedMessage; onPress: () => void }) {
  const { analysis } = message;
  const r = risk[analysis.level];
  const unread = !message.read;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens the full message and risk report"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
      <View style={[styles.avatar, { backgroundColor: analysis.level === 'safe' ? colors.bg : r.bg }]}>
        <Text style={[styles.avatarText, { color: analysis.level === 'safe' ? colors.inkSoft : r.fg }]}>{initialOf(message.sender)}</Text>
        {unread && <View style={[styles.dot, { backgroundColor: analysis.level === 'safe' ? colors.ink : r.fg }]} />}
      </View>
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={[styles.sender, unread && styles.bold]} numberOfLines={1}>
            {message.sender}
          </Text>
          <Text style={styles.time}>{timeAgo(message.receivedAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={2}>
          {message.body}
        </Text>
        <View style={styles.meta}>
          <RiskBadge level={analysis.level} score={analysis.level === 'safe' ? undefined : analysis.score} />
          {message.reported && <Text style={styles.reported}>Reported</Text>}
          {message.source === 'device' && <Text style={styles.source}>SMS</Text>}
          {message.source === 'manual' && <Text style={styles.source}>Checked manually</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg, backgroundColor: colors.surface },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  dot: { position: 'absolute', top: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.surface },
  content: { flex: 1, gap: 4 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  sender: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  bold: { fontWeight: '800' },
  time: { fontSize: 12, color: colors.muted },
  preview: { fontSize: 14, lineHeight: 19, color: colors.inkSoft },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 },
  reported: { fontSize: 12, fontWeight: '600', color: colors.muted },
  source: { fontSize: 11, fontWeight: '600', color: colors.muted },
});
