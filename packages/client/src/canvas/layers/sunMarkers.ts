import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';
import { timeToMinutes, getNightIntervals } from './background';

export function drawSunMarkers(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  y: number
): void {
  const startMin = timeToMinutes(config.startTime);
  const rawSunset = timeToMinutes(config.sunsetTime);
  const rawSunrise = timeToMinutes(config.sunriseTime);

  const nights = getNightIntervals(startMin, config.durationMinutes, rawSunset, rawSunrise);

  ctx.textAlign = 'center';

  for (const ni of nights) {
    // Sunset marker (at night start, only if not at race start)
    if (ni.start > 0) {
      const sunsetX = vp.worldToScreenX(ni.start);
      if (sunsetX > -50 && sunsetX < vp.canvasWidth + 50) {
        const absMin = (startMin + ni.start) % 1440;
        const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
        const mm = String(absMin % 60).padStart(2, '0');

        ctx.fillStyle = '#f5a623';
        ctx.font = '16px sans-serif';
        ctx.fillText('\u{1F319}', sunsetX, y);
        ctx.font = '10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#f5a62390';
        ctx.fillText(`coucher ${hh}:${mm}`, sunsetX, y + 16);
      }
    }

    // Sunrise marker (at night end, only if not at race end)
    if (ni.end < config.durationMinutes) {
      const sunriseX = vp.worldToScreenX(ni.end);
      if (sunriseX > -50 && sunriseX < vp.canvasWidth + 50) {
        const absMin = (startMin + ni.end) % 1440;
        const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
        const mm = String(absMin % 60).padStart(2, '0');

        ctx.fillStyle = '#f5d623';
        ctx.font = '16px sans-serif';
        ctx.fillText('\u{2600}\u{FE0F}', sunriseX, y);
        ctx.font = '10px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#f5d62390';
        ctx.fillText(`lever ${hh}:${mm}`, sunriseX, y + 16);
      }
    }
  }
}
