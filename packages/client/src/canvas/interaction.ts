import { Viewport } from './viewport';
import { findStintAt, isOnRightEdge, isOnLeftEdge } from './hitTest';
import { useRaceStore } from '../store/useRaceStore';
import { getPitStopScreenRect } from './layers/pitStops';
import type { Stint, PitStop } from '@race-planner/shared';

const BLOCK_Y = 110;
const BLOCK_H = 90;
const PITSTOP_Y = 210;

function addMinToTime(hhmm: string, delta: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = ((h * 60 + m + delta) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const MIN_STINT_DURATION = 10;

function raceRelativeMin(hhmm: string, raceOriginMin: number): number {
  let m = timeToMin(hhmm) - raceOriginMin;
  if (m < -720) m += 1440;
  if (m > 720) m -= 1440;
  return m;
}

function resolveOverlaps(movedId: string): void {
  const store = useRaceStore.getState();
  const stints = store.stints;
  if (stints.length < 2) return;

  const cfg = store.raceConfig;
  const raceOriginMin = timeToMin(cfg.startTime);

  const sorted = [...stints].sort((a, b) =>
    raceRelativeMin(a.startTime, raceOriginMin) - raceRelativeMin(b.startTime, raceOriginMin)
  );
  const movedIdx = sorted.findIndex(s => s.id === movedId);
  if (movedIdx === -1) return;

  let changed = false;
  const result = sorted.map(s => ({ ...s }));

  for (let i = movedIdx + 1; i < result.length; i++) {
    const prevRel = raceRelativeMin(result[i - 1].startTime, raceOriginMin);
    const prevEnd = prevRel + result[i - 1].durationMinutes;
    const curRel = raceRelativeMin(result[i].startTime, raceOriginMin);
    if (curRel < prevEnd) {
      const curEnd = curRel + result[i].durationMinutes;
      let newDur = curEnd - prevEnd;
      if (newDur < MIN_STINT_DURATION) newDur = MIN_STINT_DURATION;
      result[i] = { ...result[i], startTime: minToTime(raceOriginMin + prevEnd), endTime: minToTime(raceOriginMin + prevEnd + newDur), durationMinutes: newDur };
      changed = true;
    }
  }

  for (let i = movedIdx - 1; i >= 0; i--) {
    const nextRel = raceRelativeMin(result[i + 1].startTime, raceOriginMin);
    const curRel = raceRelativeMin(result[i].startTime, raceOriginMin);
    const curEnd = curRel + result[i].durationMinutes;
    if (curEnd > nextRel) {
      let newDur = nextRel - curRel;
      if (newDur < MIN_STINT_DURATION) newDur = MIN_STINT_DURATION;
      result[i] = { ...result[i], endTime: minToTime(raceOriginMin + curRel + newDur), durationMinutes: newDur };
      changed = true;
    }
  }

  if (changed) {
    store.setStints(result);
  }
}

function getStintOriginTime(): string {
  const cfg = useRaceStore.getState().raceConfig;
  const pre = (cfg.practiceDurationMinutes || 0) + (cfg.qualifyingDurationMinutes || 0);
  return addMinToTime(cfg.startTime, -pre);
}

interface DragState {
  active: boolean;
  stintId: string | null;
  pitStopId: string | null;
  mode: 'move' | 'resize' | 'resize-left' | 'scroll' | 'pit-move';
  startX: number;
  startMinutes: number;
}

let drag: DragState = { active: false, stintId: null, pitStopId: null, mode: 'scroll', startX: 0, startMinutes: 0 };

function findPitStopAt(px: number, py: number, vp: Viewport, pitStops: PitStop[], raceStartTime: string): PitStop | null {
  for (let i = pitStops.length - 1; i >= 0; i--) {
    const r = getPitStopScreenRect(pitStops[i], vp, PITSTOP_Y, raceStartTime);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h + 16) {
      return pitStops[i];
    }
  }
  return null;
}

function getPreRaceMinutes(): number {
  const cfg = useRaceStore.getState().raceConfig;
  return (cfg.practiceDurationMinutes || 0) + (cfg.qualifyingDurationMinutes || 0);
}

function clampOffset(vp: Viewport): void {
  const cfg = useRaceStore.getState().raceConfig;
  const preRace = getPreRaceMinutes();
  const totalDuration = preRace + cfg.durationMinutes;
  const visibleMin = vp.canvasWidth / vp.scale;
  const minOffset = -preRace - visibleMin * 0.1;
  const maxOffset = totalDuration - preRace - visibleMin * 0.9;
  if (maxOffset > minOffset) {
    vp.offsetX = Math.max(minOffset, Math.min(maxOffset, vp.offsetX));
  } else {
    vp.offsetX = minOffset;
  }
}

export function handleMouseDown(e: MouseEvent, vp: Viewport): void {
  const store = useRaceStore.getState();
  const stints = store.stints;
  const extStart = getStintOriginTime();
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  if (e.button === 1) {
    drag = { active: true, stintId: null, pitStopId: null, mode: 'scroll', startX: e.clientX, startMinutes: vp.offsetX };
    return;
  }

  const pitHit = findPitStopAt(px, py, vp, store.pitStops, extStart);
  if (pitHit) {
    store.selectPitStop(pitHit.id);
    const offsetMin = vp.screenToWorldX(px);
    drag = { active: true, stintId: null, pitStopId: pitHit.id, mode: 'pit-move', startX: px, startMinutes: offsetMin };
    return;
  }

  const hit = findStintAt(px, py, vp, stints, extStart, BLOCK_Y, BLOCK_H);
  if (hit) {
    store.selectStint(hit.id);
    if (isOnLeftEdge(px, py, vp, hit, extStart, BLOCK_Y, BLOCK_H)) {
      drag = { active: true, stintId: hit.id, pitStopId: null, mode: 'resize-left', startX: px, startMinutes: hit.durationMinutes };
    } else if (isOnRightEdge(px, py, vp, hit, extStart, BLOCK_Y, BLOCK_H)) {
      drag = { active: true, stintId: hit.id, pitStopId: null, mode: 'resize', startX: px, startMinutes: hit.durationMinutes };
    } else {
      const offsetMin = vp.screenToWorldX(px);
      drag = { active: true, stintId: hit.id, pitStopId: null, mode: 'move', startX: px, startMinutes: offsetMin };
    }
  } else {
    store.selectStint(null);
    store.selectPitStop(null);
    drag = { active: true, stintId: null, pitStopId: null, mode: 'scroll', startX: e.clientX, startMinutes: vp.offsetX };
  }
}

export function handleMouseMove(e: MouseEvent, vp: Viewport): void {
  const canvas = e.target as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  if (!drag.active) {
    const store = useRaceStore.getState();
    const extStart = getStintOriginTime();
    const hit = findStintAt(px, py, vp, store.stints, extStart, BLOCK_Y, BLOCK_H);
    if (hit && (isOnRightEdge(px, py, vp, hit, extStart, BLOCK_Y, BLOCK_H) || isOnLeftEdge(px, py, vp, hit, extStart, BLOCK_Y, BLOCK_H))) {
      canvas.style.cursor = 'col-resize';
    } else if (hit) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
    return;
  }

  if (drag.mode === 'scroll') {
    const delta = e.clientX - drag.startX;
    vp.offsetX = drag.startMinutes - delta / vp.scale;
    clampOffset(vp);
    return;
  }

  if (drag.mode === 'move' && drag.stintId) {
    const worldMin = vp.screenToWorldX(px);
    const deltaMin = worldMin - drag.startMinutes;
    if (Math.abs(deltaMin) < 1) return;
    const store = useRaceStore.getState();
    const stint = store.stints.find((s) => s.id === drag.stintId);
    if (!stint) return;
    const [sh, sm] = stint.startTime.split(':').map(Number);
    const curStart = sh * 60 + sm;
    const newStart = ((curStart + Math.round(deltaMin)) % 1440 + 1440) % 1440;
    const hh = String(Math.floor(newStart / 60)).padStart(2, '0');
    const mm = String(newStart % 60).padStart(2, '0');
    const endMin = newStart + stint.durationMinutes;
    const ehh = String(Math.floor(endMin / 60) % 24).padStart(2, '0');
    const emm = String(endMin % 60).padStart(2, '0');
    store.updateStint(drag.stintId, { startTime: `${hh}:${mm}`, endTime: `${ehh}:${emm}` });
    resolveOverlaps(drag.stintId);
    drag.startMinutes = worldMin;
    return;
  }

  if (drag.mode === 'resize' && drag.stintId) {
    const deltaPx = px - drag.startX;
    const deltaMin = deltaPx / vp.scale;
    const newDuration = Math.max(10, Math.round(drag.startMinutes + deltaMin));
    const store = useRaceStore.getState();
    const stint = store.stints.find((s) => s.id === drag.stintId);
    if (stint) {
      const [sh, sm] = stint.startTime.split(':').map(Number);
      const endMin = (sh * 60 + sm + newDuration) % 1440;
      const ehh = String(Math.floor(endMin / 60)).padStart(2, '0');
      const emm = String(endMin % 60).padStart(2, '0');
      store.updateStint(drag.stintId, { durationMinutes: newDuration, endTime: `${ehh}:${emm}` });
      resolveOverlaps(drag.stintId);
    }
  }

  if (drag.mode === 'resize-left' && drag.stintId) {
    const deltaPx = px - drag.startX;
    const deltaMin = deltaPx / vp.scale;
    const newDuration = Math.max(10, Math.round(drag.startMinutes - deltaMin));
    const store = useRaceStore.getState();
    const stint = store.stints.find((s) => s.id === drag.stintId);
    if (stint) {
      const [sh, sm] = stint.startTime.split(':').map(Number);
      const origEnd = sh * 60 + sm + stint.durationMinutes;
      const newStart = ((origEnd - newDuration) % 1440 + 1440) % 1440;
      const hh = String(Math.floor(newStart / 60)).padStart(2, '0');
      const mm = String(newStart % 60).padStart(2, '0');
      const ehh = String(Math.floor(origEnd % 1440 / 60)).padStart(2, '0');
      const emm = String(origEnd % 1440 % 60).padStart(2, '0');
      store.updateStint(drag.stintId, { startTime: `${hh}:${mm}`, endTime: `${ehh}:${emm}`, durationMinutes: newDuration });
      resolveOverlaps(drag.stintId);
    }
  }

  if (drag.mode === 'pit-move' && drag.pitStopId) {
    const worldMin = vp.screenToWorldX(px);
    const store = useRaceStore.getState();
    const extStart = getStintOriginTime();
    const [sh, sm] = extStart.split(':').map(Number);
    const startTotalMin = sh * 60 + sm;
    const absMin = Math.round(worldMin) + startTotalMin;
    const clamped = ((absMin % 1440) + 1440) % 1440;
    const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
    const mm = String(clamped % 60).padStart(2, '0');
    store.updatePitStop(drag.pitStopId, { time: `${hh}:${mm}` });
  }
}

export function handleMouseUp(): void {
  drag = { active: false, stintId: null, pitStopId: null, mode: 'scroll', startX: 0, startMinutes: 0 };
}

export function handleWheel(e: WheelEvent, vp: Viewport): void {
  e.preventDefault();
  if (e.ctrlKey) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    vp.zoom(vp.scale * factor, px);
  } else {
    const scrollAmount = e.deltaY / vp.scale;
    vp.offsetX += scrollAmount;
  }
  clampOffset(vp);
}

export function handleDblClick(e: MouseEvent, vp: Viewport): void {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const store = useRaceStore.getState();
  const extStart = getStintOriginTime();
  const preRace = getPreRaceMinutes();

  const worldMin = vp.screenToWorldX(px);
  if (worldMin < preRace) return;

  if (py >= PITSTOP_Y - 10) {
    const [sh, sm] = extStart.split(':').map(Number);
    const startTotalMin = sh * 60 + sm;
    const absMin = Math.round(worldMin) + startTotalMin;
    const clamped = ((absMin % 1440) + 1440) % 1440;
    const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
    const mm = String(clamped % 60).padStart(2, '0');

    const newPitStop: PitStop = {
      id: crypto.randomUUID(),
      time: `${hh}:${mm}`,
      durationSeconds: store.raceConfig.pitStopDurationSeconds,
      tireChange: true,
      refuel: true,
    };
    store.addPitStop(newPitStop);
    store.selectPitStop(newPitStop.id);
    return;
  }

  const hit = findStintAt(px, py, vp, store.stints, extStart, BLOCK_Y, BLOCK_H);

  if (!hit) {
    const startMin = Math.round(worldMin);
    const [sh, sm] = extStart.split(':').map(Number);
    const extStartTotalMin = sh * 60 + sm;
    const absMin = (extStartTotalMin + startMin) % 1440;
    const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mm = String(absMin % 60).padStart(2, '0');
    const endAbsMin = absMin + 60;
    const ehh = String(Math.floor(endAbsMin / 60) % 24).padStart(2, '0');
    const emm = String(endAbsMin % 60).padStart(2, '0');

    const newStint: Stint = {
      id: crypto.randomUUID(),
      driverId: store.drivers[0]?.id ?? '',
      startTime: `${hh}:${mm}`,
      endTime: `${ehh}:${emm}`,
      durationMinutes: 60,
      locked: false,
      tireCompound: 'dry',
      tireCondition: 'new',
      fuelLoads: 1,
      notes: '',
      order: store.stints.length,
    };
    store.addStint(newStint);
    store.selectStint(newStint.id);
  }
}

export function handleDragOver(e: DragEvent, vp: Viewport): void {
  const driverId = e.dataTransfer?.types.includes('application/driver-id');
  if (driverId) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  }
}

export function handleDrop(e: DragEvent, vp: Viewport): void {
  const driverId = e.dataTransfer?.getData('application/driver-id');
  if (!driverId) return;
  e.preventDefault();

  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const store = useRaceStore.getState();
  const stintOrigin = getStintOriginTime();

  const hit = findStintAt(px, py, vp, store.stints, stintOrigin, BLOCK_Y, BLOCK_H);
  if (hit) {
    store.updateStint(hit.id, { driverId });
    store.selectStint(hit.id);
    return;
  }

  const worldMin = vp.screenToWorldX(px);
  const preRace = getPreRaceMinutes();
  if (worldMin < preRace || py < BLOCK_Y - 20 || py > BLOCK_Y + BLOCK_H + 40) return;

  const stintDuration = 60;
  const [sh, sm] = stintOrigin.split(':').map(Number);
  const originTotalMin = sh * 60 + sm;
  const startMin = Math.round(worldMin - stintDuration / 2);
  const absMin = ((originTotalMin + startMin) % 1440 + 1440) % 1440;
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mm = String(absMin % 60).padStart(2, '0');
  const endAbsMin = absMin + 60;
  const ehh = String(Math.floor(endAbsMin / 60) % 24).padStart(2, '0');
  const emm = String(endAbsMin % 60).padStart(2, '0');

  const newStint: Stint = {
    id: crypto.randomUUID(),
    driverId,
    startTime: `${hh}:${mm}`,
    endTime: `${ehh}:${emm}`,
    durationMinutes: 60,
    locked: false,
    tireCompound: 'dry',
    tireCondition: 'new',
    fuelLoads: 1,
    notes: '',
    order: store.stints.length,
  };
  store.addStint(newStint);
  store.selectStint(newStint.id);
}
