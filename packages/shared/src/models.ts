export type AlertSeverity = 'error' | 'warning' | 'info';

export interface RaceConfig {
  id: string;
  name: string;
  simulator: string;
  circuit: string;
  car: string;
  durationMinutes: number;
  startTime: string;
  sunsetTime: string;
  sunriseTime: string;
  mode: 'duration' | 'laps';
  totalLaps?: number;
  pitStopDurationSeconds: number;
  fuelCapacity: number;
  fuelPerLap: number;
  avgLapTimeSeconds: number;
}

export interface Driver {
  id: string;
  name: string;
  color: string;
  maxDriveTimeMinutes?: number;
}

export interface Stint {
  id: string;
  driverId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  locked: boolean;
  tireCompound: 'dry' | 'wet' | 'intermediate';
  tireCondition: 'new' | 'used';
  fuelLoads: number;
  targetLapTimeSeconds?: number;
  notes: string;
  order: number;
}

export interface PitStop {
  id: string;
  afterStintId: string;
  time: string;
  durationSeconds: number;
  tireChange: boolean;
  refuel: boolean;
}

export interface RacePlan {
  id: string;
  config: RaceConfig;
  drivers: Driver[];
  stints: Stint[];
  pitStops: PitStop[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanSummary {
  id: string;
  name: string;
  circuit: string;
  durationMinutes: number;
  driverCount: number;
  updatedAt: string;
}

export interface LiveRaceData {
  sessionTime: number;
  currentLap: number;
  totalLaps: number;
  position: number;
  fuelRemaining: number;
  lastLapTime: number;
  bestLapTime: number;
  trackTemp: number;
  isOnTrack: boolean;
  currentDriverIndex: number;
}

export interface StintDeviation {
  stintId: string;
  plannedStart: string;
  actualStart: string;
  deltaMinutes: number;
}

export interface LiveState {
  active: boolean;
  connected: boolean;
  data: LiveRaceData | null;
  currentStintIndex: number;
  elapsedMinutes: number;
  deviations: StintDeviation[];
}

export interface PlanAlert {
  severity: AlertSeverity;
  stintId?: string;
  driverId?: string;
  message: string;
}

export type ClientMessage =
  | { type: 'save-plan'; plan: RacePlan }
  | { type: 'load-plan'; id: string }
  | { type: 'list-plans' }
  | { type: 'delete-plan'; id: string }
  | { type: 'export'; format: 'pdf' | 'png' | 'csv'; plan: RacePlan }
  | { type: 'iracing-connect' }
  | { type: 'iracing-disconnect' };

export type ServerMessage =
  | { type: 'plan-saved'; id: string }
  | { type: 'plan-loaded'; plan: RacePlan }
  | { type: 'plan-list'; plans: PlanSummary[] }
  | { type: 'export-ready'; url: string }
  | { type: 'iracing-status'; connected: boolean }
  | { type: 'iracing-data'; data: LiveRaceData }
  | { type: 'error'; message: string };
