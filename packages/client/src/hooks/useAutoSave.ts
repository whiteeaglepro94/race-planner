import { useEffect, useRef } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import type { ClientMessage } from '@race-planner/shared';

export function useAutoSave(send: (msg: ClientMessage) => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const unsub = useRaceStore.subscribe(() => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const s = useRaceStore.getState();
        send({
          type: 'save-plan',
          plan: {
            id: s.raceConfig.id,
            config: s.raceConfig,
            drivers: s.drivers,
            stints: s.stints,
            pitStops: s.pitStops,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }, 3000);
    });
    return () => { unsub(); clearTimeout(timeoutRef.current); };
  }, [send]);
}
