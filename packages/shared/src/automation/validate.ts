import type { RacePlan, PlanAlert } from '../models.js';

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function validatePlan(plan: RacePlan): PlanAlert[] {
  const alerts: PlanAlert[] = [];
  const { config, drivers, stints } = plan;
  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const startMin = timeToMin(config.startTime);

  // Per-driver time check
  const driverTime = new Map<string, number>();
  for (const s of sorted) {
    driverTime.set(s.driverId, (driverTime.get(s.driverId) ?? 0) + s.durationMinutes);
  }
  for (const d of drivers) {
    const total = driverTime.get(d.id) ?? 0;
    if (d.maxDriveTimeMinutes && total > d.maxDriveTimeMinutes) {
      alerts.push({ severity: 'error', driverId: d.id, message: `${d.name} dépasse la durée max (${total} > ${d.maxDriveTimeMinutes} min)` });
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];

    // Stint too short
    if (s.durationMinutes < 20) {
      alerts.push({ severity: 'warning', stintId: s.id, message: `Relais trop court (${s.durationMinutes} min)` });
    }
    // Stint too long
    if (s.durationMinutes > 180) {
      alerts.push({ severity: 'warning', stintId: s.id, message: `Relais trop long (${s.durationMinutes} min)` });
    }

    // Stint exceeds race end
    let stintEndMin = timeToMin(s.endTime);
    if (stintEndMin < startMin) stintEndMin += 1440;
    const raceEndMin = startMin + config.durationMinutes;
    if (stintEndMin > raceEndMin) {
      alerts.push({ severity: 'error', stintId: s.id, message: `Relais dépasse la fin de course` });
    }

    // Gap detection
    if (i > 0) {
      const prev = sorted[i - 1];
      let prevEndMin = timeToMin(prev.endTime);
      let curStartMin = timeToMin(s.startTime);
      if (prevEndMin < startMin) prevEndMin += 1440;
      if (curStartMin < startMin) curStartMin += 1440;
      const gap = curStartMin - prevEndMin;
      if (gap > 2) {
        alerts.push({ severity: 'warning', message: `Trou de ${gap} min entre ${prev.endTime} et ${s.startTime}` });
      }
    }
  }

  // Total duration check
  const totalStintMin = sorted.reduce((s, st) => s + st.durationMinutes, 0);
  if (Math.abs(totalStintMin - config.durationMinutes) > 10) {
    alerts.push({ severity: 'warning', message: `Durée totale relais (${totalStintMin} min) ≠ durée course (${config.durationMinutes} min)` });
  }

  return alerts;
}
