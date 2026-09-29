import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { RiskLevel } from '@/engine';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const colors = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  ink: '#111418',
  inkSoft: '#3F4652',
  muted: '#7A828E',
  border: '#E4E7EB',
  brand: '#FFCB05',
  brandSoft: '#FFF6CC',
  onBrand: '#111418',
  safe: '#0E7C55',
  safeBg: '#E4F5EC',
  warn: '#A65B00',
  warnBg: '#FFF1D6',
  danger: '#C62828',
  dangerBg: '#FDEBEB',
  overlay: 'rgba(17, 20, 24, 0.55)',
};

export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.ink },
  title: { fontSize: 20, fontWeight: '700' as const, color: colors.ink },
  heading: { fontSize: 16, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: colors.muted },
};

export const shadow = {
  shadowColor: '#0B0D10',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

export const risk: Record<RiskLevel, { fg: string; bg: string; label: string; icon: IconName }> = {
  safe: { fg: colors.safe, bg: colors.safeBg, label: 'Safe', icon: 'shield-checkmark' },
  suspicious: { fg: colors.warn, bg: colors.warnBg, label: 'Suspicious', icon: 'alert-circle' },
  scam: { fg: colors.danger, bg: colors.dangerBg, label: 'Scam', icon: 'warning' },
};
