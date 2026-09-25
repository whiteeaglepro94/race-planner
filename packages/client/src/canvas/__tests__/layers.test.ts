import { describe, it, expect, vi } from 'vitest';
import { Viewport } from '../viewport';
import { timeToMinutes } from '../layers/background';

describe('timeToMinutes', () => {
  it('converts HH:mm to minutes since midnight', () => {
    expect(timeToMinutes('16:00')).toBe(960);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('20:05')).toBe(1205);
  });

  it('handles cross-midnight offset', () => {
    // 02:00 next day relative to 16:00 start = 600 minutes
    const start = timeToMinutes('16:00');
    let target = timeToMinutes('02:00');
    if (target < start) target += 1440;
    expect(target - start).toBe(600);
  });
});
