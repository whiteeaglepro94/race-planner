import { useMemo } from 'react';
import { useNightMode } from './useNightMode';

export interface Theme {
  night: boolean;
  bgCanvas: string;
  bgCard: string;
  bgElevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  green: string;
  red: string;
  blue: string;
  orange: string;
  greenBg: string;
  redBg: string;
}

const DAY: Theme = {
  night: false,
  bgCanvas: '#0d1117',
  bgCard: '#161b22',
  bgElevated: '#21262d',
  border: '#21262d',
  borderSubtle: '#30363d',
  textPrimary: '#e6edf3',
  textSecondary: '#c9d1d9',
  textMuted: '#7d8590',
  textFaint: '#484f58',
  accent: '#f5a623',
  green: '#3fb950',
  red: '#f85149',
  blue: '#58a6ff',
  orange: '#f0883e',
  greenBg: '#0d2818',
  redBg: '#3d1a0d',
};

const NIGHT: Theme = {
  night: true,
  bgCanvas: '#0a0605',
  bgCard: '#120c09',
  bgElevated: '#1a110c',
  border: '#1a110c',
  borderSubtle: '#2a1a12',
  textPrimary: '#d4845a',
  textSecondary: '#a06040',
  textMuted: '#704530',
  textFaint: '#503020',
  accent: '#c06020',
  green: '#507830',
  red: '#903030',
  blue: '#4a6080',
  orange: '#b06030',
  greenBg: '#0f1a08',
  redBg: '#1a0c05',
};

export function useTheme(): Theme {
  const isNight = useNightMode();
  return useMemo(() => isNight ? NIGHT : DAY, [isNight]);
}
