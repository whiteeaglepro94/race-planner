import { describe, it, expect } from 'vitest';
import { getStintScreenRect } from '../layers/stintBlocks';
import { Viewport } from '../viewport';
import type { Stint } from '@race-planner/shared';

describe('getStintScreenRect', () => {
  const stint: Stint = {
    id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
    durationMinutes: 84, locked: false, tireCompound: 'dry',
    tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
  };

  it('calculates screen rectangle', () => {
    const vp = new Viewport(0, 3, 1200);
    const rect = getStintScreenRect(stint, vp, 100, 60, '16:00');
    expect(rect.x).toBe(0); // starts at minute 0
    expect(rect.w).toBe(84 * 3); // 252px
    expect(rect.y).toBe(100);
    expect(rect.h).toBe(60);
  });

  it('offsets correctly with viewport scroll', () => {
    const vp = new Viewport(30, 3, 1200);
    const rect = getStintScreenRect(stint, vp, 100, 60, '16:00');
    expect(rect.x).toBe(-90); // (0-30)*3
  });
});
