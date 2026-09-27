import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';
import { calcRealSunTimes } from '../utils/solar';

function timeToSeconds(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + m * 60;
}

function isNightNow(sunsetSec: number, sunriseSec: number, todSec: number): boolean {
  if (sunsetSec > sunriseSec) {
    return todSec >= sunsetSec || todSec < sunriseSec;
  }
  return todSec >= sunsetSec && todSec < sunriseSec;
}

type NightOverride = 'auto' | 'on' | 'off';

interface NightModeStore {
  override: NightOverride;
  setOverride: (v: NightOverride) => void;
}

export const useNightModeStore = create<NightModeStore>()((set) => ({
  override: 'auto',
  setOverride: (v) => set({ override: v }),
}));

export function useNightMode(): boolean {
  const active = useLiveStore((s) => s.active);
  const data = useLiveStore((s) => s.data);
  const sunset = useRaceStore((s) => s.raceConfig.sunsetTime);
  const sunrise = useRaceStore((s) => s.raceConfig.sunriseTime);
  const override = useNightModeStore((s) => s.override);

  const [realNight, setRealNight] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const realSun = calcRealSunTimes(now, 48.86, 2.35);
      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      setRealNight(isNightNow(timeToSeconds(realSun.sunset), timeToSeconds(realSun.sunrise), nowSec));
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  if (override === 'on') return true;
  if (override === 'off') return false;

  if (active && data) {
    const tod = data.sessionTimeOfDay;
    if (tod > 0) {
      return isNightNow(timeToSeconds(sunset), timeToSeconds(sunrise), tod);
    }
  }

  return realNight;
}
