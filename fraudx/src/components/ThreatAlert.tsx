import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFraudX } from '@/state/FraudXContext';
import { colors, radius, risk, space, type } from '@/theme';
import { Button } from './ui';

/**
 * Real-time intervention: appears the moment a risky message lands, before the
 * customer has opened it, clicked a link or replied.
 */
export function ThreatAlert() {
  const { alert, dismissAlert, markRead } = useFraudX();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (alert && Platform.OS !== 'web') {
      Haptics.notificationAsync(
        alert.analysis.level === 'scam' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Warning,
      ).catch(() => {});
    }
  }, [alert?.id]);

  if (!alert) return null;
  const { analysis } = alert;
  const r = risk[analysis.level];
  const topReason = analysis.signals.find((s) => s.weight > 0);

  const openDetails = () => {
    dismissAlert();
    markRead(alert.id);
    router.push({ pathname: '/message/[id]', params: { id: alert.id } });
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissAlert} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={dismissAlert} accessibilityLabel="Dismiss alert" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]} accessibilityViewIsModal accessibilityLiveRegion="assertive">
        <View style={[styles.banner, { backgroundColor: r.fg }]}>
          <Ionicons name="shield" size={20} color="#FFFFFF" />
          <Text style={styles.bannerText}>
            {analysis.level === 'scam' ? 'FraudX stopped a likely scam' : 'FraudX: suspicious message'}
          </Text>
          <Text style={styles.bannerScore}>{analysis.score}/100</Text>
        </View>

        <View style={styles.content}>
          <Text style={type.label}>New message from {alert.sender}</Text>
          <Text style={styles.headline}>{analysis.headline}</Text>
          <View style={styles.quote}>
            <Text style={styles.quoteText} numberOfLines={3}>
              {alert.body}
            </Text>
          </View>
          {topReason && (
            <View style={styles.reason}>
              <Ionicons name="information-circle" size={18} color={r.fg} />
              <Text style={[type.body, { flex: 1 }]}>{topReason.explanation}</Text>
            </View>
          )}
          <Text style={styles.warning}>Do not reply, open links or send money until you have read why.</Text>
          <Button label="See why it's dangerous" icon="eye" variant="dark" onPress={openDetails} />
          <Button label="Dismiss" variant="ghost" onPress={dismissAlert} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, paddingVertical: space.md },
  bannerText: { flex: 1, color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  bannerScore: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, opacity: 0.9 },
  content: { padding: space.xl, gap: space.md },
  headline: { fontSize: 22, fontWeight: '800', color: colors.ink, lineHeight: 28 },
  quote: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md, borderLeftWidth: 3, borderLeftColor: colors.border },
  quoteText: { fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  reason: { flexDirection: 'row', gap: space.sm },
  warning: { fontSize: 13, fontWeight: '700', color: colors.danger },
});
