import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageRow } from '@/components/MessageRow';
import { Chip } from '@/components/ui';
import type { RiskLevel } from '@/engine';
import { useFraudX } from '@/state/FraudXContext';
import { colors, space, type } from '@/theme';

type Filter = 'all' | RiskLevel;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scam', label: 'Scams' },
  { key: 'suspicious', label: 'Suspicious' },
  { key: 'safe', label: 'Safe' },
];

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { messages, markRead } = useFraudX();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: messages.length, scam: 0, suspicious: 0, safe: 0 };
    messages.forEach((m) => c[m.analysis.level]++);
    return c;
  }, [messages]);

  const visible = useMemo(
    () => (filter === 'all' ? messages : messages.filter((m) => m.analysis.level === filter)),
    [messages, filter],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.md }]}>
      <View style={styles.header}>
        <Text style={type.display}>Messages</Text>
        <Text style={type.small}>Every message is risk-checked on your phone.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterBar}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} count={counts[f.key]} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>
      <FlatList
        data={visible}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MessageRow
            message={item}
            onPress={() => {
              markRead(item.id);
              router.push({ pathname: '/message/[id]', params: { id: item.id } });
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={36} color={colors.muted} />
            <Text style={type.body}>No messages here.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: space.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.lg, gap: 2 },
  filterBar: { flexGrow: 0, flexShrink: 0, marginVertical: space.md },
  filters: { paddingHorizontal: space.lg, paddingVertical: 2, gap: space.sm, alignItems: 'center' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 72 },
  empty: { alignItems: 'center', gap: space.sm, paddingTop: 80 },
});
