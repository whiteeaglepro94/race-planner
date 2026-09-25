import { describe, it, expect, beforeEach } from 'vitest';
import { useLiveStore } from '../useLiveStore';
import type { LiveRaceData } from '@race-planner/shared';

describe('useLiveStore', () => {
  beforeEach(() => {
    useLiveStore.getState().reset();
  });

  it('starts inactive', () => {
    expect(useLiveStore.getState().active).toBe(false);
    expect(useLiveStore.getState().connected).toBe(false);
  });

  it('starts and stops following', () => {
    useLiveStore.getState().startFollowing();
    expect(useLiveStore.getState().active).toBe(true);
    useLiveStore.getState().stopFollowing();
    expect(useLiveStore.getState().active).toBe(false);
    expect(useLiveStore.getState().data).toBeNull();
  });

  it('receives live data', () => {
    const data: LiveRaceData = {
      sessionTime: 3600, currentLap: 42, totalLaps: 382,
      position: 3, fuelRemaining: 45.2, lastLapTime: 218.4,
      bestLapTime: 216.9, trackTemp: 28, isOnTrack: true,
      currentDriverIndex: 0,
    };
    useLiveStore.getState().setLiveData(data);
    expect(useLiveStore.getState().data?.position).toBe(3);
  });

  it('records deviations', () => {
    useLiveStore.getState().recordDeviation({
      stintId: 'st-1', plannedStart: '16:00', actualStart: '16:03', deltaMinutes: 3,
    });
    expect(useLiveStore.getState().deviations).toHaveLength(1);
    expect(useLiveStore.getState().deviations[0].deltaMinutes).toBe(3);
  });
});
