import type { LiveRaceData, SessionDriver } from '@race-planner/shared';

interface DriverState {
  lap: number;
  elapsed: number;
  lastLapTime: number;
  bestLapTime: number;
  fuel: number;
  onPit: boolean;
}

interface DemoDriver {
  carIdx: number;
  name: string;
  carNumber: string;
  teamName: string;
  carClass: string;
  carClassColor: string;
  carName: string;
  iRating: number;
  baseLapTime: number;
  variance: number;
}

const DEMO_DRIVERS: DemoDriver[] = [
  { carIdx: 0, name: 'M. Verstappen', carNumber: '1', teamName: 'Red Bull Racing', carClass: 'GTP', carClassColor: '#d40000', carName: 'Porsche 963', iRating: 8200, baseLapTime: 210, variance: 1.5 },
  { carIdx: 1, name: 'L. Hamilton', carNumber: '44', teamName: 'Ferrari', carClass: 'GTP', carClassColor: '#d40000', carName: 'Ferrari 499P', iRating: 7800, baseLapTime: 211, variance: 1.2 },
  { carIdx: 2, name: 'C. Leclerc', carNumber: '16', teamName: 'Ferrari', carClass: 'GTP', carClassColor: '#d40000', carName: 'Ferrari 499P', iRating: 7600, baseLapTime: 211.5, variance: 1.8 },
  { carIdx: 3, name: 'F. Alonso', carNumber: '14', teamName: 'Aston Martin', carClass: 'GTP', carClassColor: '#d40000', carName: 'Cadillac V-Series.R', iRating: 7400, baseLapTime: 212, variance: 1.0 },
  { carIdx: 4, name: 'L. Norris', carNumber: '4', teamName: 'McLaren', carClass: 'GTP', carClassColor: '#d40000', carName: 'Porsche 963', iRating: 7200, baseLapTime: 212.5, variance: 2.0 },
  { carIdx: 5, name: 'O. Piastri', carNumber: '81', teamName: 'McLaren', carClass: 'GTP', carClassColor: '#d40000', carName: 'Cadillac V-Series.R', iRating: 7000, baseLapTime: 213, variance: 1.6 },
  { carIdx: 10, name: 'V. Bottas', carNumber: '77', teamName: 'Team WRT', carClass: 'GT3', carClassColor: '#00aa44', carName: 'BMW M4 GT3', iRating: 5800, baseLapTime: 224, variance: 2.0 },
  { carIdx: 11, name: 'K. Magnussen', carNumber: '20', teamName: 'Iron Lynx', carClass: 'GT3', carClassColor: '#00aa44', carName: 'Lamborghini Huracán GT3', iRating: 5600, baseLapTime: 225, variance: 2.5 },
  { carIdx: 12, name: 'P. Gasly', carNumber: '10', teamName: 'AF Corse', carClass: 'GT3', carClassColor: '#00aa44', carName: 'Ferrari 296 GT3', iRating: 5400, baseLapTime: 225.5, variance: 2.2 },
  { carIdx: 13, name: 'Y. Tsunoda', carNumber: '22', teamName: 'JOTA', carClass: 'GT3', carClassColor: '#00aa44', carName: 'McLaren 720S GT3', iRating: 5200, baseLapTime: 226, variance: 3.0 },
  { carIdx: 14, name: 'A. Albon', carNumber: '23', teamName: 'Manthey', carClass: 'GT3', carClassColor: '#00aa44', carName: 'Porsche 911 GT3 R', iRating: 5000, baseLapTime: 226.5, variance: 2.8 },
  { carIdx: 15, name: 'G. Zhou', carNumber: '24', teamName: 'Proton Racing', carClass: 'GT3', carClassColor: '#00aa44', carName: 'Ford Mustang GT3', iRating: 4800, baseLapTime: 227, variance: 3.2 },
  { carIdx: 20, name: 'N. de Vries', carNumber: '31', teamName: 'Cool Racing', carClass: 'LMP2', carClassColor: '#0066cc', carName: 'Oreca 07 LMP2', iRating: 6200, baseLapTime: 218, variance: 1.8 },
  { carIdx: 21, name: 'M. Schumacher', carNumber: '47', teamName: 'Prema Racing', carClass: 'LMP2', carClassColor: '#0066cc', carName: 'Oreca 07 LMP2', iRating: 6000, baseLapTime: 219, variance: 2.0 },
  { carIdx: 22, name: 'R. Kubica', carNumber: '88', teamName: 'TDS Racing', carClass: 'LMP2', carClassColor: '#0066cc', carName: 'Oreca 07 LMP2', iRating: 5800, baseLapTime: 219.5, variance: 2.2 },
  { carIdx: 23, name: 'S. Vandoorne', carNumber: '5', teamName: 'Vector Sport', carClass: 'LMP2', carClassColor: '#0066cc', carName: 'Oreca 07 LMP2', iRating: 5600, baseLapTime: 220, variance: 2.4 },
];

const FLAG_SEQUENCE = [
  { atSecond: 8, flags: 0x0004, duration: 3 },   // green
  { atSecond: 30, flags: 0x4000, duration: 12 },  // caution
  { atSecond: 42, flags: 0x0004, duration: 3 },   // green restart
  { atSecond: 70, flags: 0x0020, duration: 5 },   // blue
  { atSecond: 90, flags: 0x4000, duration: 15 },  // caution
  { atSecond: 105, flags: 0x0004, duration: 3 },  // green restart
  { atSecond: 130, flags: 0x0010, duration: 8 },   // red
  { atSecond: 138, flags: 0x0004, duration: 3 },  // green restart
  { atSecond: 170, flags: 0x0020, duration: 5 },  // blue
  { atSecond: 200, flags: 0x0001, duration: 10 }, // checkered
];

type DataCallback = (data: LiveRaceData) => void;
type DriversCallback = (drivers: SessionDriver[]) => void;
type StatusCallback = (connected: boolean) => void;

export class DemoGenerator {
  private interval: ReturnType<typeof setInterval> | null = null;
  private driversInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private driverStates: Map<number, DriverState> = new Map();
  private onData: DataCallback | null = null;
  private onDrivers: DriversCallback | null = null;
  private onStatus: StatusCallback | null = null;

  start(onData: DataCallback, onStatus: StatusCallback, onDrivers: DriversCallback): void {
    this.onData = onData;
    this.onDrivers = onDrivers;
    this.onStatus = onStatus;
    this.startTime = Date.now();

    for (const d of DEMO_DRIVERS) {
      this.driverStates.set(d.carIdx, {
        lap: 0,
        elapsed: 0,
        lastLapTime: d.baseLapTime + (Math.random() - 0.5) * d.variance,
        bestLapTime: d.baseLapTime - d.variance * 0.3,
        fuel: 100 + Math.random() * 10,
        onPit: false,
      });
    }

    onStatus(true);

    this.interval = setInterval(() => this.tick(), 250);
    this.driversInterval = setInterval(() => this.emitDrivers(), 2500);

    setTimeout(() => this.emitDrivers(), 500);
  }

  stop(): void {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    if (this.driversInterval) { clearInterval(this.driversInterval); this.driversInterval = null; }
    this.driverStates.clear();
    this.onStatus?.(false);
    this.onData = null;
    this.onDrivers = null;
    this.onStatus = null;
  }

  get running(): boolean {
    return this.interval !== null;
  }

  private tick(): void {
    if (!this.onData) return;

    const elapsedSec = (Date.now() - this.startTime) / 1000;
    const simulatedTime = elapsedSec * 10;

    for (const d of DEMO_DRIVERS) {
      const state = this.driverStates.get(d.carIdx)!;
      state.elapsed += 2.5;

      if (state.elapsed >= d.baseLapTime + (Math.random() - 0.5) * d.variance) {
        state.lap++;
        state.lastLapTime = state.elapsed;
        if (state.lastLapTime < state.bestLapTime) state.bestLapTime = state.lastLapTime;
        state.elapsed = 0;
        state.fuel = Math.max(0, state.fuel - (1.5 + Math.random() * 0.5));

        if (state.fuel < 5 && !state.onPit) {
          state.onPit = true;
          setTimeout(() => {
            state.onPit = false;
            state.fuel = 100 + Math.random() * 10;
          }, 8000);
        }
      }
    }

    const playerState = this.driverStates.get(0)!;
    let flags = 0;
    const cycleTime = elapsedSec % 210;
    for (const f of FLAG_SEQUENCE) {
      if (cycleTime >= f.atSecond && cycleTime < f.atSecond + f.duration) {
        flags = f.flags;
        break;
      }
    }

    this.onData({
      sessionTime: simulatedTime,
      sessionTimeOfDay: 50400 + simulatedTime,
      currentLap: playerState.lap,
      totalLaps: 300,
      position: 1,
      fuelRemaining: playerState.fuel,
      lastLapTime: playerState.lastLapTime,
      bestLapTime: playerState.bestLapTime,
      trackTemp: 26 + Math.sin(simulatedTime / 600) * 4,
      isOnTrack: !playerState.onPit,
      isOnPitRoad: playerState.onPit,
      currentDriverIndex: 0,
      sessionFlags: flags,
    });
  }

  private emitDrivers(): void {
    if (!this.onDrivers) return;

    const entries: { driver: DemoDriver; state: DriverState }[] = [];

    for (const d of DEMO_DRIVERS) {
      const state = this.driverStates.get(d.carIdx)!;
      entries.push({ driver: d, state });
    }

    entries.sort((a, b) => {
      if (b.state.lap !== a.state.lap) return b.state.lap - a.state.lap;
      return a.state.elapsed - b.state.elapsed;
    });

    const playerEstTime = entries.find(e => e.driver.carIdx === 0)?.state.elapsed ?? 0;

    const drivers: SessionDriver[] = entries.map((e, i) => ({
      carIdx: e.driver.carIdx,
      name: e.driver.name,
      carNumber: e.driver.carNumber,
      teamName: e.driver.teamName,
      carClass: e.driver.carClass,
      carClassColor: e.driver.carClassColor,
      carName: e.driver.carName,
      iRating: e.driver.iRating,
      position: i + 1,
      classPosition: 0,
      lap: e.state.lap,
      lastLapTime: e.state.lastLapTime,
      bestLapTime: e.state.bestLapTime,
      gapToLeader: e.state.elapsed - playerEstTime,
      isOnPitRoad: e.state.onPit,
      isPlayer: e.driver.carIdx === 0,
    }));

    const classGroups = new Map<string, SessionDriver[]>();
    for (const d of drivers) {
      const arr = classGroups.get(d.carClass) ?? [];
      arr.push(d);
      classGroups.set(d.carClass, arr);
    }
    for (const group of classGroups.values()) {
      group.forEach((d, i) => { d.classPosition = i + 1; });
    }

    this.onDrivers(drivers);
  }
}
