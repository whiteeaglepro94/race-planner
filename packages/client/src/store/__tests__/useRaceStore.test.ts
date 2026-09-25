import { describe, it, expect, beforeEach } from 'vitest';
import { useRaceStore } from '../useRaceStore';
import type { Driver, Stint } from '@race-planner/shared';

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
    const { addDriver } = useRaceStore.getState();
    addDriver({ id: 'drv-1', name: 'Sacha', color: '#4CAF50' });
    expect(useRaceStore.getState().drivers).toHaveLength(1);
    expect(useRaceStore.getState().drivers[0].name).toBe('Sacha');
  });

  it('removes a driver', () => {
    const { addDriver, removeDriver } = useRaceStore.getState();
    addDriver({ id: 'drv-1', name: 'Sacha', color: '#4CAF50' });
    removeDriver('drv-1');
    expect(useRaceStore.getState().drivers).toHaveLength(0);
  });

  it('updates a driver', () => {
    const { addDriver, updateDriver } = useRaceStore.getState();
    addDriver({ id: 'drv-1', name: 'Sacha', color: '#4CAF50' });
    updateDriver('drv-1', { name: 'Sacha P.' });
    expect(useRaceStore.getState().drivers[0].name).toBe('Sacha P.');
  });

  it('adds a stint', () => {
    const stint: Stint = {
      id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
    };
    useRaceStore.getState().addStint(stint);
    expect(useRaceStore.getState().stints).toHaveLength(1);
  });

  it('removes a stint', () => {
    const stint: Stint = {
      id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
    };
    useRaceStore.getState().addStint(stint);
    useRaceStore.getState().removeStint('st-1');
    expect(useRaceStore.getState().stints).toHaveLength(0);
  });

  it('updates a stint', () => {
    const stint: Stint = {
      id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
    };
    useRaceStore.getState().addStint(stint);
    useRaceStore.getState().updateStint('st-1', { locked: true });
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
