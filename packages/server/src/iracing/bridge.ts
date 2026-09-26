import type { LiveRaceData, SessionDriver } from '@race-planner/shared';

type DataCallback = (data: LiveRaceData) => void;
type DriversCallback = (drivers: SessionDriver[]) => void;

// Injected by main.cjs in Electron, or loaded dynamically in dev
let _iracingModule: typeof import('irsdk-node') | null = null;

export function injectIracingSDK(mod: typeof import('irsdk-node')): void {
  _iracingModule = mod;
}

async function getIracingSDK(): Promise<typeof import('irsdk-node')> {
  if (_iracingModule) return _iracingModule;
  return await import('irsdk-node');
}

const CLASS_PATTERNS: [RegExp, string][] = [
  [/\bGT3\b/i, 'GT3'],
  [/\bGT4\b/i, 'GT4'],
  [/\bGTE\b/i, 'GTE'],
  [/\bGT1\b/i, 'GT1'],
  [/\bLMP2\b/i, 'LMP2'],
  [/\bLMP3\b/i, 'LMP3'],
  [/\bLMP1\b/i, 'LMP1'],
  [/\bLMDh\b/i, 'LMDh'],
  [/\bLMH\b/i, 'LMH'],
  [/\bHypercar\b/i, 'HYP'],
  [/\b499P\b|prototype/i, 'GTP'],
  [/\bGTP\b/i, 'GTP'],
  [/\bDPi\b/i, 'DPi'],
  [/\bTCR\b/i, 'TCR'],
  [/\bCup\b/i, 'CUP'],
  [/\bF4\b/i, 'F4'],
  [/\bF3\b/i, 'F3'],
  [/Formula.*Renault/i, 'FR'],
  [/\bMX-?5\b/i, 'MX5'],
  [/\bNASCAR\b/i, 'NASCAR'],
];

function detectClass(carName: string): string {
  for (const [re, label] of CLASS_PATTERNS) {
    if (re.test(carName)) return label;
  }
  return carName.length > 12 ? carName.slice(0, 12) : carName;
}

export class IracingBridge {
  private interval: ReturnType<typeof setInterval> | null = null;
  private callback: DataCallback | null = null;
  private driversCallback: DriversCallback | null = null;
  private sdk: InstanceType<typeof import('irsdk-node').IRacingSDK> | null = null;
  private lastDriversHash = '';
  private driversTick = 0;

  async start(): Promise<{ ok: boolean; error?: string }> {
    try {
      console.log('[iRacing] Loading SDK module...');
      const { IRacingSDK } = await getIracingSDK();
      console.log('[iRacing] SDK module loaded');

      const isRunning = await IRacingSDK.IsSimRunning();
      console.log('[iRacing] IsSimRunning:', isRunning);
      if (!isRunning) return { ok: false, error: 'iRacing non détecté' };

      this.sdk = new IRacingSDK({ autoEnableTelemetry: true });
      const started = this.sdk.startSDK();
      console.log('[iRacing] startSDK:', started);
      if (!started) return { ok: false, error: 'SDK start failed' };

      // Wait for first data frame (SDK needs ~1s to initialize shared memory)
      let ready = false;
      for (let i = 0; i < 10; i++) {
        if (this.sdk.waitForData(1000)) { ready = true; break; }
      }
      if (!ready) {
        console.error('[iRacing] SDK started but no data available');
        this.sdk.stopSDK();
        this.sdk = null;
        return { ok: false, error: 'Pas de données télémétrie' };
      }

      console.log('[iRacing] First data frame received, starting polling');
      this.poll();

      this.interval = setInterval(() => this.poll(), 250);

      return { ok: true };
    } catch (err: any) {
      console.error('[iRacing] Bridge start error:', err);
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  private poll(): void {
    if (!this.sdk || !this.callback) return;
    const hasData = this.sdk.waitForData(100);
    if (!hasData) return;

    const telem = this.sdk.getTelemetry();
    this.callback({
      sessionTime: telem.SessionTime?.value?.[0] ?? 0,
      sessionTimeOfDay: telem.SessionTimeOfDay?.value?.[0] ?? 0,
      currentLap: telem.Lap?.value?.[0] ?? 0,
      totalLaps: telem.SessionLapsTotal?.value?.[0] ?? 0,
      position: telem.PlayerCarPosition?.value?.[0] ?? 0,
      fuelRemaining: telem.FuelLevel?.value?.[0] ?? 0,
      lastLapTime: telem.LapLastLapTime?.value?.[0] ?? 0,
      bestLapTime: telem.LapBestLapTime?.value?.[0] ?? 0,
      trackTemp: telem.TrackTempCrew?.value?.[0] ?? 0,
      isOnTrack: telem.IsOnTrack?.value?.[0] ?? false,
      isOnPitRoad: telem.OnPitRoad?.value?.[0] ?? false,
      currentDriverIndex: telem.PlayerCarIdx?.value?.[0] ?? 0,
      sessionFlags: telem.SessionFlags?.value?.[0] ?? 0,
    });

    this.driversTick++;
    if (this.driversCallback && this.driversTick % 10 === 0) {
      this.emitDrivers(telem);
    }
  }

  private emitDrivers(telem: any): void {
    if (!this.sdk || !this.driversCallback) return;

    try {
      const session = this.sdk.getSessionData();
      const driverInfo = session?.DriverInfo;
      if (!driverInfo?.Drivers) return;

      const playerIdx = telem.PlayerCarIdx?.value?.[0] ?? -1;
      const positions = telem.CarIdxPosition?.value ?? [];
      const classPositions = telem.CarIdxClassPosition?.value ?? [];
      const laps = telem.CarIdxLap?.value ?? [];
      const lastLapTimes = telem.CarIdxLastLapTime?.value ?? [];
      const bestLapTimes = telem.CarIdxBestLapTime?.value ?? [];
      const onPitRoad = telem.CarIdxOnPitRoad?.value ?? [];
      const estTimes = telem.CarIdxEstTime?.value ?? [];
      const playerEstTime = estTimes[playerIdx] ?? 0;

      // Build class label per CarClassID by detecting category from car names
      const classLabels = new Map<number, string>();
      for (const d of driverInfo.Drivers) {
        const cid = d.CarClassID ?? 0;
        if (classLabels.has(cid)) continue;
        const label = d.CarClassShortName
          || detectClass(d.CarScreenNameShort || d.CarScreenName || d.CarPath || '');
        classLabels.set(cid, label);
      }

      const drivers: SessionDriver[] = [];

      for (const d of driverInfo.Drivers) {
        const idx = d.CarIdx ?? -1;
        if (idx < 0) continue;
        const pos = positions[idx] ?? 0;
        if (pos <= 0) continue;

        const rawColor = d.CarClassColor ?? 0xFFFFFF;
        const classColor = '#' + (rawColor & 0xFFFFFF).toString(16).padStart(6, '0');

        drivers.push({
          carIdx: idx,
          name: d.UserName ?? d.AbbrevName ?? '?',
          carNumber: String(d.CarNumber ?? '?'),
          teamName: d.TeamName ?? '',
          carClass: classLabels.get(d.CarClassID ?? 0) || '',
          carClassColor: classColor,
          carName: d.CarScreenNameShort || d.CarScreenName || '',
          iRating: d.IRating ?? 0,
          position: pos,
          classPosition: classPositions[idx] ?? 0,
          lap: laps[idx] ?? 0,
          lastLapTime: lastLapTimes[idx] ?? 0,
          bestLapTime: bestLapTimes[idx] ?? 0,
          gapToLeader: estTimes[idx] ? estTimes[idx] - playerEstTime : 0,
          isOnPitRoad: !!onPitRoad[idx],
          isPlayer: idx === playerIdx,
        });
      }

      drivers.sort((a, b) => a.position - b.position);

      const hash = drivers.map(d => `${d.carIdx}:${d.position}:${d.lap}:${d.lastLapTime.toFixed(1)}`).join('|');
      if (hash !== this.lastDriversHash) {
        this.lastDriversHash = hash;
        this.driversCallback(drivers);
      }
    } catch { /* session data not yet available */ }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.sdk) {
      this.sdk.stopSDK();
      this.sdk = null;
    }
  }

  onData(cb: DataCallback): void {
    this.callback = cb;
  }

  onDrivers(cb: DriversCallback): void {
    this.driversCallback = cb;
  }
}
