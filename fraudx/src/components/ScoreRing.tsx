import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { RiskLevel } from '@/engine';
import { colors, risk } from '@/theme';

export function ScoreRing({ score, level, size = 120 }: { score: number; level: RiskLevel; size?: number }) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.max(0.02, score / 100);
  const color = risk[level].fg;

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`Risk score ${score} out of 100`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference * progress} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={[styles.score, { color, fontSize: size * 0.3 }]}>{score}</Text>
          <Text style={styles.caption}>RISK</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  score: { fontWeight: '800', letterSpacing: -1 },
  caption: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.muted, marginTop: -2 },
});
