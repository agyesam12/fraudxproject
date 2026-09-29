import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageRow } from '@/components/MessageRow';
import { Button, Card, IconBubble, SectionHeader } from '@/components/ui';
import { useFraudX } from '@/state/FraudXContext';
import { colors, radius, space, type } from '@/theme';

const TIPS = [
  'MTN will never ask for your MoMo PIN, not by SMS, call or WhatsApp.',
  'Got a “sent by mistake” message? Check your real balance on *170# first.',
  'Genuine MoMo receipts come from “MobileMoney”, never from a personal number.',
  'If you must pay a fee to receive a prize, it is a scam.',
  'Entering your PIN on a prompt you did not start can send money out of your wallet.',
];

export default function ProtectionScreen() {
  const insets = useSafeAreaInsets();
  const { messages, stats, settings, device, simulateIncoming, markRead } = useFraudX();
  const tip = TIPS[new Date().getDate() % TIPS.length];

  const attention = useMemo(
    () => messages.filter((m) => m.analysis.level !== 'safe' && !m.reported).slice(0, 3),
    [messages],
  );

  const protectedNow = settings.protectionEnabled;
  const open = (id: string) => {
    markRead(id);
    router.push({ pathname: '/message/[id]', params: { id } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="shield-checkmark" size={22} color={colors.onBrand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>FraudX</Text>
          <Text style={type.small}>MoMo scam protection</Text>
        </View>
      </View>

      <View style={[styles.hero, !protectedNow && { backgroundColor: colors.danger }]}>
        <View style={styles.heroTop}>
          <View style={[styles.pulse, { backgroundColor: protectedNow ? colors.brand : '#FFFFFF' }]}>
            <Ionicons name={protectedNow ? 'shield-checkmark' : 'shield-outline'} size={26} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{protectedNow ? 'You are protected' : 'Protection is paused'}</Text>
            <Text style={styles.heroSub}>
              {protectedNow ? 'FraudX checks every message the moment it arrives.' : 'You will not be warned about scam messages.'}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Stat value={stats.scanned} label="Checked" />
          <View style={styles.divider} />
          <Stat value={stats.scams} label="Scams caught" highlight />
          <View style={styles.divider} />
          <Stat value={stats.suspicious} label="Suspicious" />
        </View>
        {!protectedNow && (
          <Button label="Turn protection on" variant="secondary" onPress={() => router.push('/settings')} style={{ marginTop: space.lg }} />
        )}
      </View>

      {device.status === 'needs_permission' || device.status === 'denied' ? (
        <Card style={styles.connect}>
          <IconBubble name="chatbox-ellipses" color={colors.onBrand} bg={colors.brand} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.heading}>Scan your real SMS inbox</Text>
            <Text style={type.body}>Allow FraudX to read incoming messages so it can warn you before you act. Everything stays on this phone.</Text>
            <Button label={device.status === 'denied' ? 'Try again' : 'Allow SMS access'} variant="dark" onPress={device.connect} style={{ marginTop: space.sm }} />
          </View>
        </Card>
      ) : device.status === 'unsupported' ? (
        <Card style={styles.connect}>
          <IconBubble name="flask" color={colors.inkSoft} bg={colors.bg} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.heading}>Demo inbox</Text>
            <Text style={type.body}>
              {Platform.OS === 'ios'
                ? 'iPhone does not let apps read your SMS. Copy a suspicious message and check it in the Check SMS tab.'
                : 'Live SMS scanning needs the Android app build. For now you are seeing sample messages.'}
            </Text>
          </View>
        </Card>
      ) : null}

      <SectionHeader
        title="Needs your attention"
        action={attention.length > 0 ? <Text style={styles.link} onPress={() => router.push('/inbox')}>See all</Text> : undefined}
      />
      {attention.length > 0 ? (
        <Card style={styles.listCard}>
          {attention.map((m, i) => (
            <View key={m.id} style={i > 0 && styles.separator}>
              <MessageRow message={m} onPress={() => open(m.id)} />
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.empty}>
          <Ionicons name="checkmark-circle" size={28} color={colors.safe} />
          <Text style={type.body}>No risky messages. You are all clear.</Text>
        </Card>
      )}

      <SectionHeader title="Try it live" />
      <Card style={{ gap: space.md }}>
        <Text style={type.body}>
          Send a sample SMS through FraudX to see how it warns you in real time, before you open the message.
        </Text>
        <Button label="Simulate incoming SMS" icon="flash" onPress={simulateIncoming} />
      </Card>

      <View style={styles.tip}>
        <Ionicons name="bulb" size={20} color={colors.warn} />
        <View style={{ flex: 1 }}>
          <Text style={[type.label, { color: colors.warn }]}>Safety tip</Text>
          <Text style={[type.body, { color: colors.ink }]}>{tip}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Stat({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && { color: colors.brand }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  logo: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 22, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 },
  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: space.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  pulse: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 20, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: space.xl, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, paddingVertical: space.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  connect: { flexDirection: 'row', gap: space.md, marginTop: space.lg },
  link: { fontSize: 13, fontWeight: '700', color: colors.ink },
  listCard: { padding: 0, overflow: 'hidden' },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  empty: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  tip: { flexDirection: 'row', gap: space.md, backgroundColor: colors.brandSoft, borderRadius: radius.lg, padding: space.lg, marginTop: space.xl },
});
