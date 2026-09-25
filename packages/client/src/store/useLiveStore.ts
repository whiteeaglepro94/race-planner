import { create } from 'zustand';
import type { LiveRaceData, LiveState, StintDeviation } from '@race-planner/shared';

interface LiveActions {
  setLiveData: (data: LiveRaceData) => void;
  startFollowing: () => void;
  stopFollowing: () => void;
  setConnected: (connected: boolean) => void;
  recordDeviation: (deviation: StintDeviation) => void;
  setCurrentStintIndex: (index: number) => void;
  setElapsedMinutes: (minutes: number) => void;
  reset: () => void;
}

const initialState: LiveState = {
  active: false,
  connected: false,
  data: null,
  currentStintIndex: 0,
  elapsedMinutes: 0,
  deviations: [],
};

export const useLiveStore = create<LiveState & LiveActions>()((set) => ({
  ...initialState,

  setLiveData: (data) => set({ data }),

  startFollowing: () => set({ active: true }),

  stopFollowing: () => set({ active: false, data: null }),

  setConnected: (connected) => set({ connected }),

  recordDeviation: (deviation) =>
    set((s) => ({ deviations: [...s.deviations, deviation] })),

  setCurrentStintIndex: (index) => set({ currentStintIndex: index }),

  setElapsedMinutes: (minutes) => set({ elapsedMinutes: minutes }),

  reset: () => set(initialState),
}));
