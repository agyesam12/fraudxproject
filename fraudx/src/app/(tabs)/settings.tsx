import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, SectionHeader } from '@/components/ui';
import { ENGINE_VERSION, type Sensitivity } from '@/engine';
import { useFraudX } from '@/state/FraudXContext';
import type { DeviceSmsStatus } from '@/sources/useDeviceSms';
import { colors, radius, space, type, type IconName } from '@/theme';

const SENSITIVITY: { key: Sensitivity; label: string; hint: string }[] = [
  { key: 'relaxed', label: 'Relaxed', hint: 'Only warn about clear scams.' },
  { key: 'balanced', label: 'Balanced', hint: 'Recommended for most people.' },
  { key: 'strict', label: 'Strict', hint: 'Warn about anything unusual. Best for family members who are new to MoMo.' },
];

const DEVICE_STATUS: Record<DeviceSmsStatus, { label: string; color: string }> = {
  connected: { label: 'Connected', color: colors.safe },
  needs_permission: { label: 'Not connected', color: colors.warn },
  denied: { label: 'Permission denied', color: colors.danger },
  error: { label: 'Error reading SMS', color: colors.danger },
  unsupported: { label: 'Not available', color: colors.muted },
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const fx = useFraudX();
  const { settings } = fx;
  const deviceStatus = DEVICE_STATUS[fx.device.status];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}>
      <Text style={type.display}>Settings</Text>

      <SectionHeader title="Protection" />
      <Card style={styles.group}>
        <ToggleRow
          icon="shield-checkmark"
          title="Scam protection"
          subtitle="Check every incoming message for fraud."
          value={settings.protectionEnabled}
          onChange={(v) => fx.updateSettings({ protectionEnabled: v })}
        />
        <ToggleRow
          icon="notifications"
          title="Instant scam alerts"
          subtitle="Warn me the moment a risky message arrives."
          value={settings.alertsEnabled && settings.protectionEnabled}
          disabled={!settings.protectionEnabled}
          onChange={(v) => fx.updateSettings({ alertsEnabled: v })}
        />
      </Card>

      <SectionHeader title="Detection sensitivity" />
      <Card style={{ gap: space.md }}>
        <View style={styles.segment}>
          {SENSITIVITY.map((s) => {
            const active = settings.sensitivity === s.key;
            return (
              <Pressable
                key={s.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => fx.updateSettings({ sensitivity: s.key })}
                style={[styles.segmentItem, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={type.small}>{SENSITIVITY.find((s) => s.key === settings.sensitivity)?.hint}</Text>
      </Card>

      <SectionHeader title="SMS inbox access" />
      <Card style={{ gap: space.md }}>
        <View style={styles.rowBetween}>
          <Text style={type.heading}>Device SMS</Text>
          <View style={[styles.status, { backgroundColor: `${deviceStatus.color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: deviceStatus.color }]} />
            <Text style={[styles.statusText, { color: deviceStatus.color }]}>{deviceStatus.label}</Text>
          </View>
        </View>
        {fx.device.status === 'unsupported' ? (
          <Text style={type.body}>
            {Platform.OS === 'ios'
              ? 'Apple does not allow apps to read your text messages. Paste suspicious messages into Check SMS instead. A future version can use iOS SMS filtering for unknown senders.'
              : 'Reading SMS needs the FraudX Android build (not Expo Go or the web preview). The app is using sample messages.'}
          </Text>
        ) : (
          <>
            <Text style={type.body}>Messages are analysed only on this phone. FraudX never uploads your SMS.</Text>
            {fx.device.status === 'connected' ? (
              <ToggleRow
                icon="chatbox-ellipses"
                title="Scan device messages"
                value={settings.deviceSmsEnabled}
                onChange={(v) => fx.updateSettings({ deviceSmsEnabled: v })}
              />
            ) : (
              <Button label="Allow SMS access" icon="lock-open" variant="dark" onPress={fx.device.connect} />
            )}
          </>
        )}
      </Card>

      <SenderList
        title="Trusted senders"
        empty="Senders you mark as safe will appear here."
        senders={fx.trustedSenders}
        onRemove={fx.untrustSender}
      />
      <SenderList title="Blocked senders" empty="You have not blocked anyone." senders={fx.blockedSenders} onRemove={fx.unblockSender} />

      <SectionHeader title="About" />
      <Card style={{ gap: space.sm }}>
        <InfoRow label="Detection engine" value={ENGINE_VERSION} />
        <InfoRow label="Method" value="Fraud rules + on-device AI" />
        <InfoRow label="Privacy" value="On-device only" />
        <Button label="Reset demo data" icon="refresh" variant="secondary" onPress={fx.resetDemo} style={{ marginTop: space.md }} />
      </Card>
      <Text style={[type.small, styles.footer]}>FraudX prototype · Built for MTN MoMo customers</Text>
    </ScrollView>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
  disabled,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.5 }]}>
      <Ionicons name={icon} size={20} color={colors.ink} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={type.small}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.ink, false: colors.border }}
        thumbColor={Platform.OS === 'android' ? (value ? colors.brand : '#FFFFFF') : undefined}
        accessibilityLabel={title}
      />
    </View>
  );
}

function SenderList({ title, empty, senders, onRemove }: { title: string; empty: string; senders: string[]; onRemove: (s: string) => void }) {
  return (
    <>
      <SectionHeader title={`${title} · ${senders.length}`} />
      <Card style={{ gap: space.sm }}>
        {senders.length === 0 ? (
          <Text style={type.small}>{empty}</Text>
        ) : (
          senders.map((s) => (
            <View key={s} style={styles.rowBetween}>
              <Text style={styles.rowTitle}>{s}</Text>
              <Text style={styles.remove} onPress={() => onRemove(s)} accessibilityRole="button">
                Remove
              </Text>
            </View>
          ))
        )}
      </Card>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={type.body}>{label}</Text>
      <Text style={styles.rowTitle}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl },
  group: { gap: space.lg },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  segment: { flexDirection: 'row', backgroundColor: colors.bg, borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: radius.sm, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.ink },
  segmentLabel: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
  segmentLabelActive: { color: '#FFFFFF' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  remove: { fontSize: 14, fontWeight: '700', color: colors.danger },
  footer: { textAlign: 'center', marginTop: space.xl },
});
