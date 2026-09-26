import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';
import { timeToMinutes } from './background';

export function drawSunMarkers(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  y: number
): void {
  const startMin = timeToMinutes(config.startTime);
  let sunsetMin = timeToMinutes(config.sunsetTime);
  let sunriseMin = timeToMinutes(config.sunriseTime);
  if (sunsetMin < startMin) sunsetMin += 1440;
  if (sunriseMin < startMin) sunriseMin += 1440;
  if (sunriseMin < sunsetMin) sunriseMin += 1440;

  const sunsetX = vp.worldToScreenX(sunsetMin - startMin);
  const sunriseX = vp.worldToScreenX(sunriseMin - startMin);

  // Sunset marker
  if (sunsetX > -50 && sunsetX < vp.canvasWidth + 50) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5a623';
    ctx.font = '16px sans-serif';
    ctx.fillText('🌙', sunsetX, y);
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f5a62390';
    ctx.fillText(`coucher ${config.sunsetTime}`, sunsetX, y + 16);
  }

  // Sunrise marker
  if (sunriseX > -50 && sunriseX < vp.canvasWidth + 50) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d623';
    ctx.font = '16px sans-serif';
    ctx.fillText('☀️', sunriseX, y);
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f5d62390';
    ctx.fillText(`lever ${config.sunriseTime}`, sunriseX, y + 16);
  }
}
