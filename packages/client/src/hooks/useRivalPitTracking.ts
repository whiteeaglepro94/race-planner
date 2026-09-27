import { useEffect, useRef } from 'react';
import { useLiveStore } from '../store/useLiveStore';

export function useRivalPitTracking() {
  const prevPitState = useRef<Map<number, boolean>>(new Map());

  useEffect(() => {
    const unsubscribe = useLiveStore.subscribe((state) => {
      if (!state.active || state.sessionDrivers.length === 0) return;

      const elapsed = state.elapsedMinutes;

      for (const d of state.sessionDrivers) {
        if (d.isPlayer) continue;

        const wasPit = prevPitState.current.get(d.carIdx) ?? false;

        if (d.isOnPitRoad && !wasPit) {
          state.addRivalPitEvent({
            carIdx: d.carIdx,
            carNumber: d.carNumber,
            driverName: d.name,
            teamName: d.teamName,
            carClass: d.carClass,
            carClassColor: d.carClassColor,
            lapIn: d.lap,
            lapOut: null,
            pitInTime: elapsed,
            pitOutTime: null,
            pitDurationSec: null,
            fuelOnly: null,
          });
        }

        if (!d.isOnPitRoad && wasPit) {
          let lastOpen: { pitInTime: number } | undefined;
          for (let i = state.rivalPitHistory.length - 1; i >= 0; i--) {
            const e = state.rivalPitHistory[i];
            if (e.carIdx === d.carIdx && e.pitOutTime === null) { lastOpen = e; break; }
          }
          const durationSec = Math.round((elapsed - (lastOpen?.pitInTime ?? elapsed)) * 60);

          const isFuelOnly = durationSec < 20;

          state.updateRivalPitEvent(d.carIdx, {
            lapOut: d.lap,
            pitOutTime: elapsed,
            pitDurationSec: durationSec,
            fuelOnly: isFuelOnly,
          });
        }

        prevPitState.current.set(d.carIdx, d.isOnPitRoad);
      }
    });

    return unsubscribe;
  }, []);
}
