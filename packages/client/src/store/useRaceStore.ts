import { create } from 'zustand';
import { temporal } from 'zundo';
import type { RaceConfig, Driver, Stint, PitStop, PlanAlert } from '@race-planner/shared';

interface Viewport {
  offsetX: number;
  scale: number;
}

interface RaceState {
  raceConfig: RaceConfig;
  drivers: Driver[];
  stints: Stint[];
  pitStops: PitStop[];
  selectedStintId: string | null;
  viewport: Viewport;
  alerts: PlanAlert[];
}

interface RaceActions {
  setConfig: (partial: Partial<RaceConfig>) => void;
  addDriver: (driver: Driver) => void;
  removeDriver: (id: string) => void;
  updateDriver: (id: string, partial: Partial<Driver>) => void;
  addStint: (stint: Stint) => void;
  removeStint: (id: string) => void;
  updateStint: (id: string, partial: Partial<Stint>) => void;
  addPitStop: (pitStop: PitStop) => void;
  removePitStop: (id: string) => void;
  selectStint: (id: string | null) => void;
  setViewport: (partial: Partial<Viewport>) => void;
  setAlerts: (alerts: PlanAlert[]) => void;
  setStints: (stints: Stint[]) => void;
  setPitStops: (pitStops: PitStop[]) => void;
  reset: () => void;
}

const defaultConfig: RaceConfig = {
  id: crypto.randomUUID(),
  name: '24 Heures du Mans',
  simulator: 'Le Mans Ultimate',
  circuit: 'Circuit de la Sarthe',
  car: 'Toyota TR010 Hybrid',
  durationMinutes: 1440,
  startTime: '16:00',
  sunsetTime: '20:05',
  sunriseTime: '07:41',
  mode: 'duration',
  pitStopDurationSeconds: 60,
  fuelCapacity: 110,
  fuelPerLap: 4.16,
  avgLapTimeSeconds: 218.6,
};

const initialState: RaceState = {
  raceConfig: defaultConfig,
  drivers: [],
  stints: [],
  pitStops: [],
  selectedStintId: null,
  viewport: { offsetX: 0, scale: 3 },
  alerts: [],
};

export const useRaceStore = create<RaceState & RaceActions>()(
  temporal(
    (set) => ({
      ...initialState,

      setConfig: (partial) =>
        set((s) => ({ raceConfig: { ...s.raceConfig, ...partial } })),

      addDriver: (driver) =>
        set((s) => ({ drivers: [...s.drivers, driver] })),

      removeDriver: (id) =>
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      updateDriver: (id, partial) =>
        set((s) => ({
          drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...partial } : d)),
        })),

      addStint: (stint) =>
        set((s) => ({ stints: [...s.stints, stint] })),

      removeStint: (id) =>
        set((s) => ({
          stints: s.stints.filter((st) => st.id !== id),
          selectedStintId: s.selectedStintId === id ? null : s.selectedStintId,
        })),

      updateStint: (id, partial) =>
        set((s) => ({
          stints: s.stints.map((st) => (st.id === id ? { ...st, ...partial } : st)),
        })),

      addPitStop: (pitStop) =>
        set((s) => ({ pitStops: [...s.pitStops, pitStop] })),

      removePitStop: (id) =>
        set((s) => ({ pitStops: s.pitStops.filter((p) => p.id !== id) })),

      selectStint: (id) => set({ selectedStintId: id }),

      setViewport: (partial) =>
        set((s) => ({ viewport: { ...s.viewport, ...partial } })),

      setAlerts: (alerts) => set({ alerts }),

      setStints: (stints) => set({ stints }),

      setPitStops: (pitStops) => set({ pitStops }),

      reset: () => set(initialState),
    }),
    {
      partialize: (state) => {
        const { selectedStintId, viewport, alerts, ...tracked } = state;
        return tracked;
      },
    }
  )
);
