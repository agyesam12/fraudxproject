import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnalysisDetails, VerdictCard } from '@/components/AnalysisView';
import { Button, Card, Chip, SectionHeader } from '@/components/ui';
import type { Analysis } from '@/engine';
import { useFraudX } from '@/state/FraudXContext';
import { colors, radius, space, type } from '@/theme';

const EXAMPLES = [
  { label: 'Refund request', sender: '0551239876', body: 'Please I sent GHS 200 to your number by mistake. Kindly send it back to 0551239876, I beg you.' },
  { label: 'Prize', sender: 'MTN-Rewards', body: 'Congratulations! You have won GHS 3,000 in the MoMo loyalty draw. Pay GHS 30 activation fee to receive your prize.' },
  { label: 'Real receipt', sender: 'MobileMoney', body: 'Payment received for GHS 80.00 from ESI BOATENG. Current Balance: GHS 530.00. Transaction ID: 49105550123. Fee charged: GHS 0.00.' },
];

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { analyze, saveManual } = useFraudX();
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const scroll = useRef<ScrollView>(null);

  const run = (s = sender, b = body) => {
    if (!b.trim()) return;
    setResult(analyze({ sender: s.trim() || 'Unknown sender', body: b.trim() }));
    setTimeout(() => scroll.current?.scrollTo({ y: 360, animated: true }), 50);
  };

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setBody(text);
      setResult(null);
    }
  };

  const clear = () => {
    setSender('');
    setBody('');
    setResult(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={type.display}>Check a message</Text>
        <Text style={[type.body, { marginTop: 4 }]}>
          Got an SMS, WhatsApp or call script you are unsure about? Paste it here and FraudX will tell you if it is safe.
        </Text>

        <Card style={styles.form}>
          <Text style={type.label}>Sender (optional)</Text>
          <TextInput
            value={sender}
            onChangeText={(t) => {
              setSender(t);
              setResult(null);
            }}
            placeholder="e.g. MobileMoney or 0551234567"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.labelRow}>
            <Text style={type.label}>Message</Text>
            <Text style={styles.paste} onPress={paste} accessibilityRole="button">
              <Ionicons name="clipboard-outline" size={13} /> Paste
            </Text>
          </View>
          <TextInput
            value={body}
            onChangeText={(t) => {
              setBody(t);
              setResult(null);
            }}
            placeholder="Paste or type the message you received…"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textarea]}
            multiline
            textAlignVertical="top"
          />
          <Button label="Check this message" icon="shield-checkmark" variant="dark" disabled={!body.trim()} onPress={() => run()} />
          {(body || result) && <Button label="Clear" variant="ghost" onPress={clear} />}
        </Card>

        {!result && (
          <>
            <SectionHeader title="Try an example" />
            <View style={styles.examples}>
              {EXAMPLES.map((e) => (
                <Chip
                  key={e.label}
                  label={e.label}
                  active={false}
                  onPress={() => {
                    setSender(e.sender);
                    setBody(e.body);
                    run(e.sender, e.body);
                  }}
                />
              ))}
            </View>
          </>
        )}

        {result && (
          <View style={{ marginTop: space.xl }}>
            <VerdictCard analysis={result} />
            <AnalysisDetails analysis={result} />
            <Button
              label="Save to my messages"
              icon="download-outline"
              variant="secondary"
              style={{ marginTop: space.xl }}
              onPress={() => {
                const id = saveManual({ sender: sender.trim() || 'Unknown sender', body: body.trim() });
                clear();
                router.push({ pathname: '/message/[id]', params: { id } });
              }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl * 2 },
  form: { marginTop: space.xl, gap: space.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm },
  paste: { fontSize: 13, fontWeight: '700', color: colors.ink },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 15,
    color: colors.ink,
  },
  textarea: { minHeight: 130, marginBottom: space.sm },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
