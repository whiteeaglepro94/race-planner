import type { Viewport } from '../viewport';
import type { Stint, Driver } from '@race-planner/shared';
import { timeToMinutes } from './background';

interface Rect { x: number; y: number; w: number; h: number; }

export function getStintScreenRect(
  stint: Stint, vp: Viewport, blockY: number, blockH: number, raceStartTime: string
): Rect {
  const startMin = timeToMinutes(raceStartTime);
  let stintStartMin = timeToMinutes(stint.startTime);
  if (stintStartMin < startMin) stintStartMin += 1440;
  const offsetMin = stintStartMin - startMin;
  const x = vp.worldToScreenX(offsetMin);
  const w = stint.durationMinutes * vp.scale;
  return { x, y: blockY, w, h: blockH };
}

export function drawStintBlocks(
  ctx: CanvasRenderingContext2D, vp: Viewport, stints: Stint[],
  drivers: Driver[], selectedId: string | null,
  blockY: number, blockH: number, raceStartTime: string
): void {
  for (const stint of stints) {
    const rect = getStintScreenRect(stint, vp, blockY, blockH, raceStartTime);
    if (rect.x + rect.w < 0 || rect.x > vp.canvasWidth) continue;

    const driver = drivers.find((d) => d.id === stint.driverId);
    const color = driver?.color ?? '#666';

    // Block fill
    ctx.fillStyle = color + 'CC';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // Selection outline
    if (stint.id === selectedId) {
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Lock icon
    if (stint.locked) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('🔒', rect.x + 4, rect.y + 14);
    }

    // Driver name + times
    if (rect.w > 40) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const cx = rect.x + rect.w / 2;
      ctx.fillText(driver?.name ?? '?', cx, rect.y + rect.h / 2 - 4);
      ctx.font = '9px sans-serif';
      ctx.fillText(`${stint.startTime}-${stint.endTime}`, cx, rect.y + rect.h / 2 + 10);
    }
  }
  ctx.textAlign = 'left';
}
