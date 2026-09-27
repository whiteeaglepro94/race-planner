import { create } from 'zustand';
import type { LiveRaceData, LiveState, StintDeviation, SessionDriver, RivalPitEvent } from '@race-planner/shared';

interface ExtendedLiveState extends LiveState {
  sessionDrivers: SessionDriver[];
  compareCarIdx: number | null;
  rivalPitHistory: RivalPitEvent[];
  error: string | null;
  demo: boolean;
}

interface LiveActions {
  setLiveData: (data: LiveRaceData) => void;
  startFollowing: () => void;
  stopFollowing: () => void;
  setConnected: (connected: boolean) => void;
  recordDeviation: (deviation: StintDeviation) => void;
  setCurrentStintIndex: (index: number) => void;
  setElapsedMinutes: (minutes: number) => void;
  setSessionDrivers: (drivers: SessionDriver[]) => void;
  setCompareCarIdx: (idx: number | null) => void;
  addRivalPitEvent: (event: RivalPitEvent) => void;
  updateRivalPitEvent: (carIdx: number, partial: Partial<RivalPitEvent>) => void;
  setError: (error: string) => void;
  setDemo: (demo: boolean) => void;
  reset: () => void;
}

const initialState: ExtendedLiveState = {
  active: false,
  connected: false,
  data: null,
  currentStintIndex: 0,
  elapsedMinutes: 0,
  deviations: [],
  sessionDrivers: [],
  compareCarIdx: null,
  rivalPitHistory: [],
  error: null,
  demo: false,
};

export const useLiveStore = create<ExtendedLiveState & LiveActions>()((set) => ({
  ...initialState,

  setLiveData: (data) => set({ data }),

  startFollowing: () => set({ active: true }),

  stopFollowing: () => set({ active: false, data: null, sessionDrivers: [], compareCarIdx: null, rivalPitHistory: [], error: null }),

  setConnected: (connected) => set({ connected }),

  recordDeviation: (deviation) =>
    set((s) => ({ deviations: [...s.deviations, deviation] })),

  setCurrentStintIndex: (index) => set({ currentStintIndex: index }),

  setElapsedMinutes: (minutes) => set({ elapsedMinutes: minutes }),

  setSessionDrivers: (drivers) => set({ sessionDrivers: drivers }),

  setCompareCarIdx: (idx) => set({ compareCarIdx: idx }),

  addRivalPitEvent: (event) =>
    set((s) => ({ rivalPitHistory: [...s.rivalPitHistory, event] })),

  updateRivalPitEvent: (carIdx, partial) =>
    set((s) => {
      let idx = -1;
      for (let i = s.rivalPitHistory.length - 1; i >= 0; i--) {
        if (s.rivalPitHistory[i].carIdx === carIdx && s.rivalPitHistory[i].pitOutTime === null) { idx = i; break; }
      }
      if (idx === -1) return {};
      const updated = [...s.rivalPitHistory];
      updated[idx] = { ...updated[idx], ...partial };
      return { rivalPitHistory: updated };
    }),

  setError: (error) => set({ error }),

  setDemo: (demo) => set({ demo }),

  reset: () => set(initialState),
}));
