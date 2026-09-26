import { describe, it, expect, beforeEach } from 'vitest';
import { useRaceStore } from '../useRaceStore';
import type { Stint } from '@race-planner/shared';

describe('useRaceStore', () => {
  beforeEach(() => {
    useRaceStore.getState().reset();
  });

  it('has default race config', () => {
    const state = useRaceStore.getState();
    expect(state.raceConfig.durationMinutes).toBe(1440);
    expect(state.raceConfig.startTime).toBe('16:00');
  });

  it('adds a driver', () => {
    const initialCount = useRaceStore.getState().drivers.length;
    useRaceStore.getState().addDriver({ id: 'drv-new', name: 'Sacha', color: '#4CAF50' });
    expect(useRaceStore.getState().drivers).toHaveLength(initialCount + 1);
    expect(useRaceStore.getState().drivers[initialCount].name).toBe('Sacha');
  });

  it('removes a driver', () => {
    const initialCount = useRaceStore.getState().drivers.length;
    useRaceStore.getState().addDriver({ id: 'drv-new', name: 'Sacha', color: '#4CAF50' });
    useRaceStore.getState().removeDriver('drv-new');
    expect(useRaceStore.getState().drivers).toHaveLength(initialCount);
  });

  it('updates a driver', () => {
    const firstId = useRaceStore.getState().drivers[0].id;
    useRaceStore.getState().updateDriver(firstId, { name: 'Sacha P.' });
    expect(useRaceStore.getState().drivers[0].name).toBe('Sacha P.');
  });

  it('adds a stint', () => {
    const initialCount = useRaceStore.getState().stints.length;
    const stint: Stint = {
      id: 'st-new', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 99,
    };
    useRaceStore.getState().addStint(stint);
    expect(useRaceStore.getState().stints).toHaveLength(initialCount + 1);
  });

  it('removes a stint', () => {
    const initialCount = useRaceStore.getState().stints.length;
    const stint: Stint = {
      id: 'st-new', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 99,
    };
    useRaceStore.getState().addStint(stint);
    useRaceStore.getState().removeStint('st-new');
    expect(useRaceStore.getState().stints).toHaveLength(initialCount);
  });

  it('updates a stint', () => {
    const firstId = useRaceStore.getState().stints[0].id;
    useRaceStore.getState().updateStint(firstId, { locked: true });
    expect(useRaceStore.getState().stints[0].locked).toBe(true);
  });

  it('selects a stint', () => {
    useRaceStore.getState().selectStint('st-1');
    expect(useRaceStore.getState().selectedStintId).toBe('st-1');
  });

  it('updates viewport', () => {
    useRaceStore.getState().setViewport({ scale: 2.5 });
    expect(useRaceStore.getState().viewport.scale).toBe(2.5);
  });

  it('updates race config', () => {
    useRaceStore.getState().setConfig({ name: '6h Spa' });
    expect(useRaceStore.getState().raceConfig.name).toBe('6h Spa');
  });
});
