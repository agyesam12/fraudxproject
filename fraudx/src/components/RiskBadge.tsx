import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { RiskLevel } from '@/engine';
import { radius, risk } from '@/theme';

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const r = risk[level];
  return (
    <View style={[styles.badge, { backgroundColor: r.bg }]} accessibilityLabel={`${r.label}${score != null ? `, risk ${score}` : ''}`}>
      <Ionicons name={r.icon} size={12} color={r.fg} />
      <Text style={[styles.label, { color: r.fg }]}>
        {r.label}
        {score != null ? ` · ${score}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12, fontWeight: '700' },
});
