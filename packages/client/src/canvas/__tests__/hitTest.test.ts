import { describe, it, expect } from 'vitest';
import { findStintAt } from '../hitTest';
import { Viewport } from '../viewport';
import type { Stint } from '@race-planner/shared';

describe('findStintAt', () => {
  const stints: Stint[] = [{
    id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
    durationMinutes: 84, locked: false, tireCompound: 'dry',
    tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
  }];

  it('finds stint under cursor', () => {
    const vp = new Viewport(0, 3, 1200);
    const hit = findStintAt(100, 130, vp, stints, '16:00', 100, 60);
    expect(hit?.id).toBe('st-1');
  });

  it('returns null when clicking empty area', () => {
    const vp = new Viewport(0, 3, 1200);
    const hit = findStintAt(800, 130, vp, stints, '16:00', 100, 60);
    expect(hit).toBeNull();
  });
});
