import type { RaceConfig } from '../models.js';

export function estimatePitStops(config: RaceConfig): number {
  const totalLaps = (config.durationMinutes * 60) / config.avgLapTimeSeconds;
  const lapsPerTank = config.fuelCapacity / config.fuelPerLap;
  return Math.ceil(totalLaps / lapsPerTank) - 1;
}
