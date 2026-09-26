import { describe, it, expect } from 'vitest';
import { planToCSV } from '../export/csv';
import type { RacePlan } from '@race-planner/shared';

const plan: RacePlan = {
  id: 'p-1',
  config: { id: 'c-1', name: 'Test', teamName: '', simulator: 'S', circuit: 'C', car: 'V', durationMinutes: 180, startTime: '14:00', sunsetTime: '20:00', sunriseTime: '06:00', mode: 'duration', pitStopDurationSeconds: 60, fuelCapacity: 100, fuelPerLap: 3, avgLapTimeSeconds: 120 },
  drivers: [{ id: 'drv-1', name: 'Alice', color: '#f00' }],
  stints: [{ id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:30', durationMinutes: 90, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: 'push', order: 0 }],
  pitStops: [],
  createdAt: '', updatedAt: '',
};

describe('planToCSV', () => {
  it('produces valid CSV with headers', () => {
    const csv = planToCSV(plan);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Pilote');
    expect(lines[0]).toContain('Début');
    expect(lines[1]).toContain('Alice');
    expect(lines[1]).toContain('14:00');
  });
});
