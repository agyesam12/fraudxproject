import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalysisDetails, MessageBody, VerdictCard } from '@/components/AnalysisView';
import { Button, Card, SectionHeader } from '@/components/ui';
import { isOfficialSender, normalizeSender } from '@/engine';
import { useFraudX } from '@/state/FraudXContext';
import { colors, radius, space, type } from '@/theme';
import { fullTime, initialOf } from '@/utils/format';

export default function MessageReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const fx = useFraudX();
  const [copied, setCopied] = useState(false);
  const message = fx.getMessage(id);

  if (!message) {
    return (
      <View style={styles.missing}>
        <Ionicons name="trash-outline" size={32} color={colors.muted} />
        <Text style={type.body}>This message is no longer available.</Text>
        <Button label="Back to messages" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const { analysis } = message;
  const risky = analysis.level !== 'safe';
  const key = normalizeSender(message.sender);
  const blocked = fx.blockedSenders.some((s) => normalizeSender(s) === key);
  const trusted = fx.trustedSenders.some((s) => normalizeSender(s) === key);
  const official = isOfficialSender(message.sender);

  const copy = async () => {
    await Clipboard.setStringAsync(message.body);
    setCopied(true);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}>
      <Card style={{ gap: space.md }}>
        <View style={styles.senderRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialOf(message.sender)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.senderLine}>
              <Text style={type.heading}>{message.sender}</Text>
              {official && <Ionicons name="checkmark-circle" size={16} color={colors.safe} accessibilityLabel="Registered MTN sender" />}
            </View>
            <Text style={type.small}>{fullTime(message.receivedAt)}</Text>
          </View>
          <Button label={copied ? 'Copied' : 'Copy'} icon={copied ? 'checkmark' : 'copy-outline'} variant="ghost" onPress={copy} style={styles.copy} />
        </View>
        <View style={styles.bubble}>
          <MessageBody body={message.body} links={analysis.links} level={analysis.level} />
        </View>
        {risky && analysis.links.length > 0 && (
          <View style={styles.note}>
            <Ionicons name="lock-closed" size={14} color={colors.danger} />
            <Text style={styles.noteText}>Links in this message are disabled for your safety.</Text>
          </View>
        )}
      </Card>

      <View style={{ marginTop: space.lg }}>
        <VerdictCard analysis={analysis} />
      </View>

      {message.reported && (
        <View style={styles.reported}>
          <Ionicons name="flag" size={18} color={colors.safe} />
          <Text style={[type.body, { flex: 1, color: colors.ink }]}>
            Reported to the MTN fraud team. Reports help block scam numbers for everyone.
          </Text>
        </View>
      )}

      <AnalysisDetails analysis={analysis} />

      <SectionHeader title="Actions" />
      <View style={{ gap: space.sm }}>
        {risky && !message.reported && (
          <Button label="Report scam to MTN" icon="flag" variant="danger" onPress={() => fx.report(message.id)} />
        )}
        {blocked ? (
          <Button label={`Unblock ${message.sender}`} icon="lock-open-outline" variant="secondary" onPress={() => fx.unblockSender(message.sender)} />
        ) : (
          !official && <Button label="Block this sender" icon="ban" variant={risky ? 'dark' : 'secondary'} onPress={() => fx.blockSender(message.sender)} />
        )}
        {trusted ? (
          <Button label="Stop trusting this sender" icon="close-circle-outline" variant="secondary" onPress={() => fx.untrustSender(message.sender)} />
        ) : (
          <Button label="I know this sender, it's safe" icon="checkmark-circle-outline" variant="secondary" onPress={() => fx.trustSender(message.sender)} />
        )}
        <Button
          label="Delete message"
          icon="trash-outline"
          variant="ghost"
          onPress={() => {
            router.back();
            fx.remove(message.id);
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md, padding: space.xl, backgroundColor: colors.bg },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  senderLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: colors.inkSoft },
  copy: { minHeight: 36, paddingHorizontal: space.sm },
  bubble: { backgroundColor: colors.bg, borderRadius: radius.lg, borderTopLeftRadius: 4, padding: space.lg },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteText: { fontSize: 13, fontWeight: '600', color: colors.danger },
  reported: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.safeBg, borderRadius: radius.md, padding: space.lg, marginTop: space.lg },
});
