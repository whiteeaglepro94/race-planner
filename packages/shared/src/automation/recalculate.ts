import type { RaceConfig, Stint } from '../models.js';

export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function recalculateAfter(index: number, stints: Stint[], config: RaceConfig): Stint[] {
  const result = [...stints];
  const pitMin = Math.ceil(config.pitStopDurationSeconds / 60);

  // Fix endTime of modified stint
  result[index] = {
    ...result[index],
    endTime: addMinutesToTime(result[index].startTime, result[index].durationMinutes),
  };

  // Cascade
  for (let i = index + 1; i < result.length; i++) {
    if (result[i].locked) continue;
    const prevEnd = result[i - 1].endTime;
    const newStart = addMinutesToTime(prevEnd, pitMin);
    result[i] = {
      ...result[i],
      startTime: newStart,
      endTime: addMinutesToTime(newStart, result[i].durationMinutes),
    };
  }

  return result;
}
