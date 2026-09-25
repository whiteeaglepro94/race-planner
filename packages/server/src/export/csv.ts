import type { RacePlan } from '@race-planner/shared';

export function planToCSV(plan: RacePlan): string {
  const headers = ['#', 'Pilote', 'Début', 'Fin', 'Durée (min)', 'Pneus', 'État pneus', 'Pleins', 'Chrono cible', 'Notes'];
  const rows = plan.stints
    .sort((a, b) => a.order - b.order)
    .map((s, i) => {
      const driver = plan.drivers.find((d) => d.id === s.driverId);
      return [i + 1, driver?.name ?? '?', s.startTime, s.endTime, s.durationMinutes, s.tireCompound, s.tireCondition, s.fuelLoads, s.targetLapTimeSeconds ?? '', s.notes.replace(/,/g, ';')].join(',');
    });
  return [headers.join(','), ...rows].join('\n');
}
