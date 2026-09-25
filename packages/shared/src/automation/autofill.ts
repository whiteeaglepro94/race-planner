import type { RaceConfig, Driver, Stint } from '../models.js';
import { addMinutesToTime } from './recalculate.js';

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function autofillGaps(stints: Stint[], drivers: Driver[], config: RaceConfig): Stint[] {
  if (stints.length === 0) return stints;
  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const result: Stint[] = [];

  // Calculate time per driver to find least-used
  const driverTime = new Map<string, number>();
  drivers.forEach((d) => driverTime.set(d.id, 0));
  sorted.forEach((s) => driverTime.set(s.driverId, (driverTime.get(s.driverId) ?? 0) + s.durationMinutes));

  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1) {
      const gapStart = sorted[i].endTime;
      const gapEnd = sorted[i + 1].startTime;
      const gapMin = timeToMin(gapEnd) - timeToMin(gapStart);
      if (gapMin > 1) {
        const leastUsed = [...driverTime.entries()].sort((a, b) => a[1] - b[1])[0][0];
        const fill: Stint = {
          id: crypto.randomUUID(),
          driverId: leastUsed,
          startTime: gapStart,
          endTime: gapEnd,
          durationMinutes: gapMin,
          locked: false,
          tireCompound: 'dry',
          tireCondition: 'new',
          fuelLoads: 1,
          notes: '',
          order: sorted[i].order + 0.5,
        };
        result.push(fill);
        driverTime.set(leastUsed, (driverTime.get(leastUsed) ?? 0) + gapMin);
      }
    }
  }

  // Re-order
  return result.sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }));
}
