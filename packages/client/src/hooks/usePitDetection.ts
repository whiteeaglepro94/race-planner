import { useEffect, useRef } from 'react';
import type { Stint } from '@race-planner/shared';
import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';

interface PitState {
  wasOnPitRoad: boolean;
  pitEntryMinutes: number | null;
  fuelAtPitEntry: number | null;
  lapAtPitEntry: number | null;
}

function elapsedToHHMM(startTime: string, elapsedMinutes: number): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const total = (sh * 60 + sm + Math.round(elapsedMinutes)) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function findCurrentStint(stints: Stint[], startTime: string, elapsedMinutes: number): Stint | null {
  const [sh, sm] = startTime.split(':').map(Number);
  const raceStartTotal = sh * 60 + sm;
  const nowTotal = (raceStartTotal + elapsedMinutes) % 1440;

  const sorted = [...stints].sort((a, b) => a.order - b.order);
  for (const stint of sorted) {
    const [startH, startM] = stint.startTime.split(':').map(Number);
    const [endH, endM] = stint.endTime.split(':').map(Number);
    let stintStart = startH * 60 + startM;
    let stintEnd = endH * 60 + endM;
    if (stintEnd < stintStart) stintEnd += 1440;
    let now = nowTotal;
    if (now < stintStart - 720) now += 1440;
    if (now >= stintStart && now <= stintEnd) return stint;
  }
  return sorted[sorted.length - 1] ?? null;
}

export function usePitDetection() {
  const pitState = useRef<PitState>({
    wasOnPitRoad: false,
    pitEntryMinutes: null,
    fuelAtPitEntry: null,
    lapAtPitEntry: null,
  });

  useEffect(() => {
    const unsubscribe = useLiveStore.subscribe((state) => {
      if (!state.active || !state.data) return;

      const { isOnPitRoad, fuelRemaining, currentLap } = state.data;
      const elapsed = state.elapsedMinutes;
      const prev = pitState.current;

      if (isOnPitRoad && !prev.wasOnPitRoad) {
        prev.pitEntryMinutes = elapsed;
        prev.fuelAtPitEntry = fuelRemaining;
        prev.lapAtPitEntry = currentLap;

        const raceStore = useRaceStore.getState();
        const { stints, raceConfig } = raceStore;
        const current = findCurrentStint(stints, raceConfig.startTime, elapsed);

        if (current) {
          const pitTimeHHMM = elapsedToHHMM(raceConfig.startTime, elapsed);
          const [sh, sm] = current.startTime.split(':').map(Number);
          const [ph, pm] = pitTimeHHMM.split(':').map(Number);
          let stintStartTotal = sh * 60 + sm;
          let pitTotal = ph * 60 + pm;
          if (pitTotal < stintStartTotal) pitTotal += 1440;
          const actualDuration = pitTotal - stintStartTotal;

          if (actualDuration > 0) {
            raceStore.updateStint(current.id, {
              endTime: pitTimeHHMM,
              durationMinutes: actualDuration,
            });
          }
        }
      }

      if (!isOnPitRoad && prev.wasOnPitRoad && prev.pitEntryMinutes !== null) {
        const raceStore = useRaceStore.getState();
        const { stints, pitStops, raceConfig, drivers } = raceStore;
        const sorted = [...stints].sort((a, b) => a.order - b.order);

        const pitEntryHHMM = elapsedToHHMM(raceConfig.startTime, prev.pitEntryMinutes);
        const endedStint = sorted.find((s) => s.endTime === pitEntryHHMM);

        if (endedStint) {
          const pitDurationMinutes = elapsed - prev.pitEntryMinutes;
          const pitExitHHMM = elapsedToHHMM(raceConfig.startTime, elapsed);

          const didRefuel = prev.fuelAtPitEntry !== null && fuelRemaining > prev.fuelAtPitEntry + 0.5;

          const pitId = `pit-live-${Date.now()}`;
          raceStore.addPitStop({
            id: pitId,
            afterStintId: endedStint.id,
            time: pitEntryHHMM,
            durationSeconds: Math.round(pitDurationMinutes * 60),
            tireChange: true,
            refuel: didRefuel,
          });

          const nextOrder = endedStint.order + 1;
          const remainingStints = sorted.filter((s) => s.order >= nextOrder);

          const [rsh, rsm] = raceConfig.startTime.split(':').map(Number);
          const raceEndTotal = rsh * 60 + rsm + raceConfig.durationMinutes;
          const [peh, pem] = pitExitHHMM.split(':').map(Number);
          let pitExitTotal = peh * 60 + pem;
          if (pitExitTotal < rsh * 60 + rsm) pitExitTotal += 1440;
          const remainingMinutes = raceEndTotal - pitExitTotal;

          if (remainingMinutes > 0) {
            if (remainingStints.length > 0) {
              const nextStint = remainingStints[0];
              raceStore.updateStint(nextStint.id, {
                startTime: pitExitHHMM,
                durationMinutes: Math.min(
                  nextStint.durationMinutes,
                  remainingMinutes
                ),
                endTime: elapsedToHHMM(
                  '00:00',
                  pitExitTotal + Math.min(nextStint.durationMinutes, remainingMinutes)
                ),
                tireCondition: 'new',
                fuelLoads: didRefuel ? 1 : 0,
              });
            } else {
              const driverId = endedStint.driverId;
              const stintDuration = Math.min(90, remainingMinutes);
              const newStintEnd = elapsedToHHMM(raceConfig.startTime, elapsed + stintDuration);

              raceStore.addStint({
                id: `st-live-${Date.now()}`,
                driverId,
                startTime: pitExitHHMM,
                endTime: newStintEnd,
                durationMinutes: stintDuration,
                locked: false,
                tireCompound: endedStint.tireCompound,
                tireCondition: 'new',
                fuelLoads: didRefuel ? 1 : 0,
                notes: '[Auto - iRacing]',
                order: nextOrder,
              });
            }
          }
        }

        prev.pitEntryMinutes = null;
        prev.fuelAtPitEntry = null;
        prev.lapAtPitEntry = null;
      }

      prev.wasOnPitRoad = isOnPitRoad;
    });

    return unsubscribe;
  }, []);
}
