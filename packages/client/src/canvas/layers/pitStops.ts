import type { Viewport } from '../viewport';
import type { PitStop } from '@race-planner/shared';
import { timeToMinutes } from './background';

export function drawPitStops(
  ctx: CanvasRenderingContext2D, vp: Viewport,
  pitStops: PitStop[], y: number, raceStartTime: string
): void {
  const startMin = timeToMinutes(raceStartTime);

  for (const pit of pitStops) {
    let pitMin = timeToMinutes(pit.time);
    if (pitMin < startMin) pitMin += 1440;
    const x = vp.worldToScreenX(pitMin - startMin);
    if (x < -20 || x > vp.canvasWidth + 20) continue;

    // Tire icon
    if (pit.tireChange) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x - 6, y, 12, 12);
    }
    // Fuel icon
    if (pit.refuel) {
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(x - 6, y + 14, 12, 12);
    }

    ctx.fillStyle = '#888';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pit.time, x, y + 38);
  }
  ctx.textAlign = 'left';
}
