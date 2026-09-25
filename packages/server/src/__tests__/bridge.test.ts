import { describe, it, expect } from 'vitest';
import { normalizeTelemetry } from '../iracing/bridge';

describe('normalizeTelemetry', () => {
  it('maps raw iRacing data to LiveRaceData', () => {
    const raw = {
      SessionTime: 3600.5,
      Lap: 42,
      SessionLapsTotal: 382,
      PlayerCarPosition: 3,
      FuelLevel: 45.2,
      LapLastLapTime: 218.4,
      LapBestLapTime: 216.9,
      TrackTempCrew: 28.0,
      IsOnTrack: true,
      PlayerCarDriverIncidentCount: 0,
      DriverInfo: { DriverCarIdx: 0 },
    };
    const result = normalizeTelemetry(raw);
    expect(result.sessionTime).toBe(3600.5);
    expect(result.position).toBe(3);
    expect(result.fuelRemaining).toBeCloseTo(45.2);
    expect(result.isOnTrack).toBe(true);
  });
});
