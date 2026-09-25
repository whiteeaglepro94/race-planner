import { Viewport } from './viewport';
import { findStintAt, isOnRightEdge } from './hitTest';
import { useRaceStore } from '../store/useRaceStore';
import type { Stint } from '@race-planner/shared';

const BLOCK_Y = 100;
const BLOCK_H = 60;

interface DragState {
  active: boolean;
  stintId: string | null;
  mode: 'move' | 'resize' | 'scroll';
  startX: number;
  startMinutes: number;
}

let drag: DragState = { active: false, stintId: null, mode: 'scroll', startX: 0, startMinutes: 0 };

export function handleMouseDown(e: MouseEvent, vp: Viewport): void {
  const store = useRaceStore.getState();
  const stints = store.stints;
  const startTime = store.raceConfig.startTime;
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  if (e.button === 1) {
    drag = { active: true, stintId: null, mode: 'scroll', startX: e.clientX, startMinutes: vp.offsetX };
    return;
  }

  const hit = findStintAt(px, py, vp, stints, startTime, BLOCK_Y, BLOCK_H);
  if (hit) {
    store.selectStint(hit.id);
    if (isOnRightEdge(px, py, vp, hit, startTime, BLOCK_Y, BLOCK_H)) {
      drag = { active: true, stintId: hit.id, mode: 'resize', startX: px, startMinutes: hit.durationMinutes };
    } else {
      const offsetMin = vp.screenToWorldX(px);
      drag = { active: true, stintId: hit.id, mode: 'move', startX: px, startMinutes: offsetMin };
    }
  } else {
    store.selectStint(null);
  }
}

export function handleMouseMove(e: MouseEvent, vp: Viewport): void {
  if (!drag.active) return;
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;

  if (drag.mode === 'scroll') {
    const delta = e.clientX - drag.startX;
    vp.offsetX = drag.startMinutes - delta / vp.scale;
    return;
  }

  if (drag.mode === 'resize' && drag.stintId) {
    const deltaPx = px - drag.startX;
    const deltaMin = deltaPx / vp.scale;
    const newDuration = Math.max(10, Math.round(drag.startMinutes + deltaMin));
    useRaceStore.getState().updateStint(drag.stintId, { durationMinutes: newDuration });
  }
}

export function handleMouseUp(): void {
  drag = { active: false, stintId: null, mode: 'scroll', startX: 0, startMinutes: 0 };
}

export function handleWheel(e: WheelEvent, vp: Viewport): void {
  e.preventDefault();
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  vp.zoom(vp.scale * factor, px);
}

export function handleDblClick(e: MouseEvent, vp: Viewport): void {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const store = useRaceStore.getState();
  const hit = findStintAt(px, py, vp, store.stints, store.raceConfig.startTime, BLOCK_Y, BLOCK_H);

  if (!hit) {
    const worldMin = vp.screenToWorldX(px);
    const startMin = Math.round(worldMin);
    const raceStartTotalMin = parseInt(store.raceConfig.startTime.split(':')[0]) * 60
      + parseInt(store.raceConfig.startTime.split(':')[1]);
    const absMin = (raceStartTotalMin + startMin) % 1440;
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
