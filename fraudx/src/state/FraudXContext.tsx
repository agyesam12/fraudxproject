import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { DEMO_INBOX, INCOMING_POOL } from '@/data/demoMessages';
import { analyzeMessage, normalizeSender, type Analysis, type AnalysisContext, type RawMessage, type Sensitivity } from '@/engine';
import { useDeviceSms, type DeviceSmsStatus } from '@/sources/useDeviceSms';

export type MessageSource = 'demo' | 'device' | 'manual';

export type Message = RawMessage & {
  id: string;
  receivedAt: number;
  source: MessageSource;
  read: boolean;
  reported: boolean;
};

export type ScannedMessage = Message & { analysis: Analysis };

export type Settings = {
  protectionEnabled: boolean;
  alertsEnabled: boolean;
  sensitivity: Sensitivity;
  deviceSmsEnabled: boolean;
};

type State = {
  hydrated: boolean;
  messages: Message[];
  trustedSenders: string[];
  blockedSenders: string[];
  settings: Settings;
  alertId: string | null;
  simCursor: number;
};

type Action =
  | { type: 'hydrate'; state: Partial<State> | null }
  | { type: 'add'; messages: Message[]; live: boolean }
  | { type: 'markRead'; id: string }
  | { type: 'report'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'trust'; sender: string }
  | { type: 'untrust'; sender: string }
  | { type: 'block'; sender: string }
  | { type: 'unblock'; sender: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'dismissAlert' }
  | { type: 'advanceSim' }
  | { type: 'reset' };

const STORAGE_KEY = 'fraudx:v1';

const DEFAULT_SETTINGS: Settings = {
  protectionEnabled: true,
  alertsEnabled: true,
  sensitivity: 'balanced',
  deviceSmsEnabled: true,
};

function seedMessages(): Message[] {
  const now = Date.now();
  return DEMO_INBOX.map((m, i) => ({
    id: `demo:${i}`,
    sender: m.sender,
    body: m.body,
    receivedAt: now - m.minutesAgo * 60_000,
    source: 'demo',
    read: m.minutesAgo > 60,
    reported: false,
  }));
}

const initialState = (): State => ({
  hydrated: false,
  messages: [],
  trustedSenders: [],
  blockedSenders: [],
  settings: DEFAULT_SETTINGS,
  alertId: null,
  simCursor: 0,
});

const analysisContext = (s: Pick<State, 'settings' | 'trustedSenders' | 'blockedSenders'>): AnalysisContext => ({
  sensitivity: s.settings.sensitivity,
  trustedSenders: s.trustedSenders,
  blockedSenders: s.blockedSenders,
});

const addUnique = (list: string[], v: string) =>
  list.some((x) => normalizeSender(x) === normalizeSender(v)) ? list : [...list, v];
const removeSender = (list: string[], v: string) => list.filter((x) => normalizeSender(x) !== normalizeSender(v));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate': {
      const saved = action.state;
      return {
        ...state,
        ...saved,
        settings: { ...DEFAULT_SETTINGS, ...saved?.settings },
        messages: saved?.messages ?? seedMessages(),
        alertId: null,
        hydrated: true,
      };
    }
    case 'add': {
      const known = new Set(state.messages.map((m) => m.id));
      const fresh = action.messages.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return state;
      let alertId = state.alertId;
      const { protectionEnabled, alertsEnabled } = state.settings;
      if (action.live && protectionEnabled && alertsEnabled) {
        const ctx = analysisContext(state);
        const threat = [...fresh]
          .sort((a, b) => b.receivedAt - a.receivedAt)
          .find((m) => analyzeMessage(m, ctx).level !== 'safe');
        if (threat) alertId = threat.id;
      }
      const messages = [...fresh, ...state.messages].sort((a, b) => b.receivedAt - a.receivedAt);
      return { ...state, messages, alertId };
    }
    case 'markRead':
      return { ...state, messages: state.messages.map((m) => (m.id === action.id ? { ...m, read: true } : m)) };
    case 'report':
      return { ...state, messages: state.messages.map((m) => (m.id === action.id ? { ...m, reported: true, read: true } : m)) };
    case 'delete':
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.id),
        alertId: state.alertId === action.id ? null : state.alertId,
      };
    case 'trust':
      return { ...state, trustedSenders: addUnique(state.trustedSenders, action.sender), blockedSenders: removeSender(state.blockedSenders, action.sender) };
    case 'untrust':
      return { ...state, trustedSenders: removeSender(state.trustedSenders, action.sender) };
    case 'block':
      return { ...state, blockedSenders: addUnique(state.blockedSenders, action.sender), trustedSenders: removeSender(state.trustedSenders, action.sender) };
    case 'unblock':
      return { ...state, blockedSenders: removeSender(state.blockedSenders, action.sender) };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'dismissAlert':
      return { ...state, alertId: null };
    case 'advanceSim':
      return { ...state, simCursor: (state.simCursor + 1) % INCOMING_POOL.length };
    case 'reset':
      return { ...initialState(), hydrated: true, messages: seedMessages() };
  }
}

type FraudXValue = {
  hydrated: boolean;
  settings: Settings;
  trustedSenders: string[];
  blockedSenders: string[];
  messages: ScannedMessage[];
  alert: ScannedMessage | null;
  stats: { scanned: number; scams: number; suspicious: number; unresolved: number };
  device: { status: DeviceSmsStatus; supported: boolean; connect: () => Promise<boolean> };
  getMessage: (id: string) => ScannedMessage | undefined;
  analyze: (msg: RawMessage) => Analysis;
  simulateIncoming: () => void;
  saveManual: (msg: RawMessage) => string;
  markRead: (id: string) => void;
  report: (id: string) => void;
  remove: (id: string) => void;
  trustSender: (sender: string) => void;
  untrustSender: (sender: string) => void;
  blockSender: (sender: string) => void;
  unblockSender: (sender: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  dismissAlert: () => void;
  resetDemo: () => void;
};

const FraudXContext = createContext<FraudXValue | null>(null);

let idCounter = 0;
const newId = (prefix: string) => `${prefix}:${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export function FraudXProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : null }))
      .catch(() => dispatch({ type: 'hydrate', state: null }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, alertId, ...persisted } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted)).catch(() => {});
  }, [state]);

  const device = useDeviceSms(state.hydrated && state.settings.deviceSmsEnabled, (msgs, live) =>
    dispatch({
      type: 'add',
      live,
      messages: msgs.map((m) => ({
        id: `device:${m.id}`,
        sender: m.sender,
        body: m.body,
        receivedAt: m.receivedAt,
        source: 'device',
        read: !live,
        reported: false,
      })),
    }),
  );

  const ctx = useMemo(
    () => analysisContext(state),
    [state.settings, state.trustedSenders, state.blockedSenders],
  );

  const messages = useMemo<ScannedMessage[]>(
    () => state.messages.map((m) => ({ ...m, analysis: analyzeMessage(m, ctx) })),
    [state.messages, ctx],
  );

  const stats = useMemo(() => {
    const scams = messages.filter((m) => m.analysis.level === 'scam').length;
    const suspicious = messages.filter((m) => m.analysis.level === 'suspicious').length;
    const unresolved = messages.filter((m) => m.analysis.level !== 'safe' && !m.reported && !m.read).length;
    return { scanned: messages.length, scams, suspicious, unresolved };
  }, [messages]);

  const simulateIncoming = useCallback(() => {
    const sample = INCOMING_POOL[state.simCursor];
    dispatch({ type: 'advanceSim' });
    dispatch({
      type: 'add',
      live: true,
      messages: [{ ...sample, id: newId('sim'), receivedAt: Date.now(), source: 'demo', read: false, reported: false }],
    });
  }, [state.simCursor]);

  const saveManual = useCallback((msg: RawMessage) => {
    const id = newId('manual');
    dispatch({
      type: 'add',
      live: false,
      messages: [{ ...msg, id, receivedAt: Date.now(), source: 'manual', read: true, reported: false }],
    });
    return id;
  }, []);

  const value = useMemo<FraudXValue>(
    () => ({
      hydrated: state.hydrated,
      settings: state.settings,
      trustedSenders: state.trustedSenders,
      blockedSenders: state.blockedSenders,
      messages,
      alert: state.alertId ? (messages.find((m) => m.id === state.alertId) ?? null) : null,
      stats,
      device: {
        status: device.status,
        supported: device.supported,
        connect: async () => {
          const ok = await device.requestAccess();
          if (ok) dispatch({ type: 'settings', patch: { deviceSmsEnabled: true } });
          return ok;
        },
      },
      getMessage: (id) => messages.find((m) => m.id === id),
      analyze: (msg) => analyzeMessage(msg, ctx),
      simulateIncoming,
      saveManual,
      markRead: (id) => dispatch({ type: 'markRead', id }),
      report: (id) => dispatch({ type: 'report', id }),
      remove: (id) => dispatch({ type: 'delete', id }),
      trustSender: (sender) => dispatch({ type: 'trust', sender }),
      untrustSender: (sender) => dispatch({ type: 'untrust', sender }),
      blockSender: (sender) => dispatch({ type: 'block', sender }),
      unblockSender: (sender) => dispatch({ type: 'unblock', sender }),
      updateSettings: (patch) => dispatch({ type: 'settings', patch }),
      dismissAlert: () => dispatch({ type: 'dismissAlert' }),
      resetDemo: () => dispatch({ type: 'reset' }),
    }),
    [state.hydrated, state.settings, state.trustedSenders, state.blockedSenders, state.alertId, messages, stats, device, ctx, simulateIncoming, saveManual],
  );

  return <FraudXContext.Provider value={value}>{children}</FraudXContext.Provider>;
}

export function useFraudX() {
  const value = useContext(FraudXContext);
  if (!value) throw new Error('useFraudX must be used inside <FraudXProvider>');
  return value;
}
