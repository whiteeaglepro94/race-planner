import { describe, it, expect } from 'vitest';
import { RaceConfigSchema, DriverSchema, StintSchema, PitStopSchema, RacePlanSchema } from '../schema';

describe('RaceConfigSchema', () => {
  it('validates a correct race config', () => {
    const config = {
      id: crypto.randomUUID(),
      name: '24 Heures du Mans',
      simulator: 'Le Mans Ultimate',
      circuit: 'Circuit de la Sarthe',
      car: 'Toyota TR010 Hybrid',
      durationMinutes: 1440,
      startTime: '16:00',
      sunsetTime: '20:05',
      sunriseTime: '07:41',
      mode: 'duration' as const,
      pitStopDurationSeconds: 60,
      fuelCapacity: 110,
      fuelPerLap: 4.16,
      avgLapTimeSeconds: 218.6,
    };
    expect(RaceConfigSchema.safeParse(config).success).toBe(true);
  });

  it('rejects invalid mode', () => {
    const config = {
      id: crypto.randomUUID(),
      name: 'Test',
      simulator: 'Test',
      circuit: 'Test',
      car: 'Test',
      durationMinutes: 180,
      startTime: '14:00',
      sunsetTime: '20:00',
      sunriseTime: '06:00',
      mode: 'invalid',
      pitStopDurationSeconds: 60,
      fuelCapacity: 100,
      fuelPerLap: 3,
      avgLapTimeSeconds: 120,
    };
    expect(RaceConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe('DriverSchema', () => {
  it('validates a correct driver', () => {
    const driver = {
      id: crypto.randomUUID(),
      name: 'Sacha',
      color: '#4CAF50',
    };
    expect(DriverSchema.safeParse(driver).success).toBe(true);
  });

  it('accepts optional maxDriveTimeMinutes', () => {
    const driver = {
      id: crypto.randomUUID(),
      name: 'Marc',
      color: '#FFC107',
      maxDriveTimeMinutes: 240,
    };
    expect(DriverSchema.safeParse(driver).success).toBe(true);
  });
});

describe('StintSchema', () => {
  it('validates a correct stint', () => {
    const stint = {
      id: crypto.randomUUID(),
      driverId: crypto.randomUUID(),
      startTime: '16:00',
      endTime: '17:24',
      durationMinutes: 84,
      locked: false,
      tireCompound: 'dry' as const,
      tireCondition: 'new' as const,
      fuelLoads: 1,
      notes: '',
      order: 0,
    };
    expect(StintSchema.safeParse(stint).success).toBe(true);
  });
});

describe('RacePlanSchema', () => {
  it('validates a complete race plan', () => {
    const driverId = crypto.randomUUID();
    const stintId = crypto.randomUUID();
    const plan = {
      id: crypto.randomUUID(),
      config: {
        id: crypto.randomUUID(),
        name: 'Test Race',
        simulator: 'Test',
        circuit: 'Test',
        car: 'Test',
        durationMinutes: 180,
        startTime: '14:00',
        sunsetTime: '20:00',
        sunriseTime: '06:00',
        mode: 'duration' as const,
        pitStopDurationSeconds: 60,
        fuelCapacity: 100,
        fuelPerLap: 3,
        avgLapTimeSeconds: 120,
      },
      drivers: [{ id: driverId, name: 'Pilote 1', color: '#FF0000' }],
      stints: [{
        id: stintId,
        driverId,
        startTime: '14:00',
        endTime: '15:30',
        durationMinutes: 90,
        locked: false,
        tireCompound: 'dry' as const,
        tireCondition: 'new' as const,
        fuelLoads: 1,
        notes: '',
        order: 0,
      }],
      pitStops: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(RacePlanSchema.safeParse(plan).success).toBe(true);
  });
});
