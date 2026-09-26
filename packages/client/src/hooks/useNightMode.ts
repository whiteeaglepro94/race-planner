import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';

function timeToSeconds(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + m * 60;
}

export function useNightMode(): boolean {
  const active = useLiveStore((s) => s.active);
  const data = useLiveStore((s) => s.data);
  const sunset = useRaceStore((s) => s.raceConfig.sunsetTime);
  const sunrise = useRaceStore((s) => s.raceConfig.sunriseTime);

  if (!active || !data) return false;

  const tod = data.sessionTimeOfDay;
  if (tod <= 0) return false;

  const sunsetSec = timeToSeconds(sunset);
  const sunriseSec = timeToSeconds(sunrise);

  if (sunsetSec > sunriseSec) {
    return tod >= sunsetSec || tod < sunriseSec;
  }
  return tod >= sunsetSec && tod < sunriseSec;
}
