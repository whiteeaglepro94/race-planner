import { describe, it, expect } from 'vitest';
import { distributeStints } from '../automation/distribute';
import { autofillGaps } from '../automation/autofill';
import { recalculateAfter } from '../automation/recalculate';
import { validatePlan } from '../automation/validate';
import { estimatePitStops } from '../automation/pitEstimate';
import type { RaceConfig, Driver, Stint, RacePlan } from '../models';

const config: RaceConfig = {
  id: 'cfg-1', name: 'Test', simulator: 'Test', circuit: 'Test', car: 'Test',
  durationMinutes: 360, startTime: '14:00', sunsetTime: '20:00', sunriseTime: '06:00',
  mode: 'duration', pitStopDurationSeconds: 60, fuelCapacity: 100,
  fuelPerLap: 3.5, avgLapTimeSeconds: 120,
};

const drivers: Driver[] = [
  { id: 'drv-1', name: 'A', color: '#f00' },
  { id: 'drv-2', name: 'B', color: '#0f0' },
];

describe('distributeStints', () => {
  it('fills race duration equally between drivers', () => {
    const stints = distributeStints(drivers, config, []);
    const totalMin = stints.reduce((sum, s) => sum + s.durationMinutes, 0);
    expect(totalMin).toBeGreaterThanOrEqual(config.durationMinutes - 10);
    expect(totalMin).toBeLessThanOrEqual(config.durationMinutes + 10);
    const drvA = stints.filter((s) => s.driverId === 'drv-1');
    const drvB = stints.filter((s) => s.driverId === 'drv-2');
    expect(Math.abs(drvA.length - drvB.length)).toBeLessThanOrEqual(1);
  });

  it('respects locked stints', () => {
    const locked: Stint[] = [{
      id: 'locked-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:30',
      durationMinutes: 90, locked: true, tireCompound: 'dry', tireCondition: 'new',
      fuelLoads: 1, notes: '', order: 0,
    }];
    const stints = distributeStints(drivers, config, locked);
    expect(stints.find((s) => s.id === 'locked-1')).toBeDefined();
  });
});

describe('autofillGaps', () => {
  it('fills gap between stints', () => {
    const stints: Stint[] = [
      { id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 0 },
      { id: 'st-2', driverId: 'drv-2', startTime: '16:00', endTime: '17:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 2 },
    ];
    const filled = autofillGaps(stints, drivers, config);
    expect(filled.length).toBe(3);
    expect(filled[1].startTime).toBe('15:00');
    expect(filled[1].endTime).toBe('16:00');
  });
});

describe('recalculateAfter', () => {
  it('cascades time changes', () => {
    const stints: Stint[] = [
      { id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:30', durationMinutes: 90, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 0 },
      { id: 'st-2', driverId: 'drv-2', startTime: '15:30', endTime: '17:00', durationMinutes: 90, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 1 },
    ];
    stints[0].durationMinutes = 120;
    const result = recalculateAfter(0, stints, config);
    expect(result[0].endTime).toBe('16:00');
    expect(result[1].startTime).toBe('16:01'); // +1 min pit
  });
});

describe('validatePlan', () => {
  it('detects gap', () => {
    const plan: RacePlan = {
      id: 'p-1', config, drivers,
      stints: [
        { id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 0 },
        { id: 'st-2', driverId: 'drv-2', startTime: '16:00', endTime: '17:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 1 },
      ],
      pitStops: [],
      createdAt: '', updatedAt: '',
    };
    const alerts = validatePlan(plan);
    expect(alerts.some((a) => a.severity === 'warning' && a.message.includes('Trou'))).toBe(true);
  });
});

describe('estimatePitStops', () => {
  it('calculates from fuel', () => {
    const count = estimatePitStops(config);
    // 360min * 60 / 120s = 180 laps. 100/3.5 = 28.57 laps/tank. 180/28.57 = 6.3 => 6 stops
    expect(count).toBe(6);
  });
});
