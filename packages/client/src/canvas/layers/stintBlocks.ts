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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

export function drawStintBlocks(
  ctx: CanvasRenderingContext2D, vp: Viewport, stints: Stint[],
  drivers: Driver[], selectedId: string | null,
  blockY: number, blockH: number, raceStartTime: string
): void {
  const radius = 4;
  const gap = 0;

  for (const stint of stints) {
    const rect = getStintScreenRect(stint, vp, blockY, blockH, raceStartTime);
    if (rect.x + rect.w < 0 || rect.x > vp.canvasWidth) continue;

    const driver = drivers.find((d) => d.id === stint.driverId);
    const color = driver?.color ?? '#484f58';
    const rgb = hexToRgb(color);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rect.x + gap, rect.y, rect.w - gap * 2, rect.h, radius);
    ctx.closePath();

    // Gradient fill — semi-transparent
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
    grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
    ctx.fillStyle = grad;
    ctx.fill();

    // Uniform border in driver color
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Selection outline
    if (stint.id === selectedId) {
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(rect.x + gap, rect.y, rect.w - gap * 2, rect.h, radius);
      ctx.stroke();
    }

    // Lock icon
    if (stint.locked) {
      ctx.fillStyle = '#ffffffcc';
      ctx.font = '11px sans-serif';
      ctx.fillText('🔒', rect.x + 8, rect.y + 16);
    }

    // Driver name + time range — colored with driver color
    if (rect.w > 30) {
      const cx = rect.x + rect.w / 2;

      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText((driver?.name ?? '?').toUpperCase(), cx, rect.y + rect.h / 2 - 8);

      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`;
      ctx.fillText(`${stint.startTime}-${stint.endTime}`, cx, rect.y + rect.h / 2 + 10);
    }

    ctx.restore();
  }
  ctx.textAlign = 'left';
}
