import type { RaceConfig, Driver, Stint } from '../models.js';
import { addMinutesToTime } from './recalculate.js';

export function distributeStints(drivers: Driver[], config: RaceConfig, lockedStints: Stint[]): Stint[] {
  const lockedTime = lockedStints.reduce((s, st) => s + st.durationMinutes, 0);
  const remaining = config.durationMinutes - lockedTime;
  const stintTarget = 90;
  const stintCount = Math.max(drivers.length, Math.round(remaining / stintTarget));
  const stintDuration = Math.floor(remaining / stintCount);

  const result: Stint[] = [...lockedStints];
  let currentTime = config.startTime;

  // Skip past locked stints at the start
  const sortedLocked = [...lockedStints].sort((a, b) => a.order - b.order);
  if (sortedLocked.length > 0) {
    const lastLocked = sortedLocked[sortedLocked.length - 1];
    currentTime = addMinutesToTime(lastLocked.endTime, 1);
  }

  for (let i = 0; i < stintCount; i++) {
    const driver = drivers[i % drivers.length];
    const duration = i === stintCount - 1 ? remaining - stintDuration * (stintCount - 1) : stintDuration;
    const endTime = addMinutesToTime(currentTime, duration);
    result.push({
      id: crypto.randomUUID(),
      driverId: driver.id,
      startTime: currentTime,
      endTime,
      durationMinutes: duration,
      locked: false,
      tireCompound: 'dry',
      tireCondition: i % 2 === 0 ? 'new' : 'used',
      fuelLoads: 1,
      notes: '',
      order: lockedStints.length + i,
    });
    currentTime = addMinutesToTime(endTime, 1); // 1 min pit
  }

  return result.sort((a, b) => a.order - b.order);
}
