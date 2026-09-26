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
  showTireIcons: boolean;
  showFuelIcons: boolean;
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
  setShowTireIcons: (v: boolean) => void;
  setShowFuelIcons: (v: boolean) => void;
  reset: () => void;
}

const defaultConfig: RaceConfig = {
  id: crypto.randomUUID(),
  name: '',
  teamName: '',
  simulator: '',
  circuit: '',
  car: '',
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

const defaultDrivers: Driver[] = [
  { id: 'drv-1', name: 'Pilote 1', color: '#2ecc71' },
  { id: 'drv-2', name: 'Pilote 2', color: '#3498db' },
  { id: 'drv-3', name: 'Pilote 3', color: '#f1c40f' },
  { id: 'drv-4', name: 'Pilote 4', color: '#9b59b6' },
];

function generateDefaultStints(): Stint[] {
  const stintDuration = 90;
  const pitDuration = 1;
  const totalMinutes = defaultConfig.durationMinutes;
  const stints: Stint[] = [];
  let currentTime = defaultConfig.startTime;
  let order = 0;

  const addMin = (hhmm: string, min: number): string => {
    const [h, m] = hhmm.split(':').map(Number);
    const total = (h * 60 + m + min) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  let elapsed = 0;
  while (elapsed + stintDuration <= totalMinutes) {
    const driver = defaultDrivers[order % defaultDrivers.length];
    const dur = Math.min(stintDuration, totalMinutes - elapsed);
    const endTime = addMin(currentTime, dur);
    stints.push({
      id: `st-${order}`,
      driverId: driver.id,
      startTime: currentTime,
      endTime,
      durationMinutes: dur,
      locked: false,
      tireCompound: 'dry',
      tireCondition: order % 2 === 0 ? 'new' : 'used',
      fuelLoads: 1,
      notes: '',
      order,
    });
    elapsed += dur + pitDuration;
    currentTime = addMin(endTime, pitDuration);
    order++;
  }
  return stints;
}

function generateDefaultPitStops(stints: Stint[]): PitStop[] {
  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const pitStops: PitStop[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const driverChange = current.driverId !== next.driverId;
    pitStops.push({
      id: `pit-${i}`,
      afterStintId: current.id,
      time: current.endTime,
      durationSeconds: defaultConfig.pitStopDurationSeconds,
      tireChange: next.tireCondition === 'new',
      refuel: next.fuelLoads > 0,
    });
  }
  return pitStops;
}

const defaultStints = generateDefaultStints();

const initialState: RaceState = {
  raceConfig: defaultConfig,
  drivers: defaultDrivers,
  stints: defaultStints,
  pitStops: generateDefaultPitStops(defaultStints),
  selectedStintId: null,
  viewport: { offsetX: 0, scale: 3 },
  alerts: [],
  showTireIcons: true,
  showFuelIcons: true,
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

      setShowTireIcons: (v) => set({ showTireIcons: v }),
      setShowFuelIcons: (v) => set({ showFuelIcons: v }),

      reset: () => set(initialState),
    }),
    {
      partialize: (state) => {
        const { selectedStintId, viewport, alerts, showTireIcons, showFuelIcons, ...tracked } = state;
        return tracked;
      },
    }
  )
);
