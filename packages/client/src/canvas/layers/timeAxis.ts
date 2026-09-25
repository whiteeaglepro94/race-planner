import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';
import { timeToMinutes } from './background';

export function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  y: number
): void {
  const startMin = timeToMinutes(config.startTime);
  ctx.fillStyle = '#999';
  ctx.strokeStyle = '#333';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  const step = vp.scale < 1 ? 120 : vp.scale < 3 ? 60 : 30;

  for (let m = 0; m <= config.durationMinutes; m += step) {
    const x = vp.worldToScreenX(m);
    if (x < -50 || x > vp.canvasWidth + 50) continue;

    const absMin = (startMin + m) % 1440;
    const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mm = String(absMin % 60).padStart(2, '0');

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillText(`${hh}:${mm}`, x, y - 4);
  }
}
