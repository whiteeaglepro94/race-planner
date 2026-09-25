import type { LiveRaceData } from '@race-planner/shared';

export function normalizeTelemetry(raw: Record<string, unknown>): LiveRaceData {
  const driverInfo = raw.DriverInfo as Record<string, unknown> | undefined;
  return {
    sessionTime: (raw.SessionTime as number) ?? 0,
    currentLap: (raw.Lap as number) ?? 0,
    totalLaps: (raw.SessionLapsTotal as number) ?? 0,
    position: (raw.PlayerCarPosition as number) ?? 0,
    fuelRemaining: (raw.FuelLevel as number) ?? 0,
    lastLapTime: (raw.LapLastLapTime as number) ?? 0,
    bestLapTime: (raw.LapBestLapTime as number) ?? 0,
    trackTemp: (raw.TrackTempCrew as number) ?? 0,
    isOnTrack: (raw.IsOnTrack as boolean) ?? false,
    currentDriverIndex: (driverInfo?.DriverCarIdx as number) ?? 0,
  };
}

type DataCallback = (data: LiveRaceData) => void;

export class IracingBridge {
  private interval: ReturnType<typeof setInterval> | null = null;
  private callback: DataCallback | null = null;
  private iracing: unknown = null;

  async start(): Promise<boolean> {
    try {
      const irsdk = await import('node-irsdk');
      this.iracing = irsdk.init({ telemetryUpdateInterval: 100 });
      const sdk = this.iracing as { on: (event: string, cb: (data: unknown) => void) => void };

      sdk.on('Telemetry', (data: unknown) => {
        const values = (data as { values: Record<string, unknown> }).values;
        if (this.callback && values) {
          this.callback(normalizeTelemetry(values));
        }
      });

      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.iracing = null;
  }

  onData(cb: DataCallback): void {
    this.callback = cb;
  }
}
