import { z } from 'zod';

export const RaceConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  teamName: z.string(),
  simulator: z.string(),
  circuit: z.string(),
  car: z.string(),
  durationMinutes: z.number().positive(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  sunsetTime: z.string().regex(/^\d{2}:\d{2}$/),
  sunriseTime: z.string().regex(/^\d{2}:\d{2}$/),
  mode: z.enum(['duration', 'laps']),
  totalLaps: z.number().positive().optional(),
  pitStopDurationSeconds: z.number().nonnegative(),
  fuelCapacity: z.number().positive(),
  fuelPerLap: z.number().positive(),
  avgLapTimeSeconds: z.number().positive(),
});

export const DriverSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  maxDriveTimeMinutes: z.number().positive().optional(),
});

export const StintSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().positive(),
  locked: z.boolean(),
  tireCompound: z.enum(['dry', 'wet', 'intermediate']),
  tireCondition: z.enum(['new', 'used']),
  fuelLoads: z.number().nonnegative(),
  targetLapTimeSeconds: z.number().positive().optional(),
  notes: z.string(),
  order: z.number().nonnegative(),
});

export const PitStopSchema = z.object({
  id: z.string().uuid(),
  afterStintId: z.string().uuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationSeconds: z.number().nonnegative(),
  tireChange: z.boolean(),
  refuel: z.boolean(),
});

export const RacePlanSchema = z.object({
  id: z.string().uuid(),
  config: RaceConfigSchema,
  drivers: z.array(DriverSchema),
  stints: z.array(StintSchema),
  pitStops: z.array(PitStopSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const LiveRaceDataSchema = z.object({
  sessionTime: z.number(),
  sessionTimeOfDay: z.number(),
  currentLap: z.number(),
  totalLaps: z.number(),
  position: z.number(),
  fuelRemaining: z.number(),
  lastLapTime: z.number(),
  bestLapTime: z.number(),
  trackTemp: z.number(),
  isOnTrack: z.boolean(),
  isOnPitRoad: z.boolean(),
  currentDriverIndex: z.number(),
  sessionFlags: z.number(),
});
