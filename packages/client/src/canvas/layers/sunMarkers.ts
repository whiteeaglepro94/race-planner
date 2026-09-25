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

  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';

  // Sunset
  ctx.fillStyle = '#f5a623';
  ctx.fillText('☾', sunsetX, y);
  ctx.font = '9px sans-serif';
  ctx.fillText(`coucher ${config.sunsetTime}`, sunsetX, y + 14);

  // Sunrise
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#f5d623';
  ctx.fillText('☀', sunriseX, y);
  ctx.font = '9px sans-serif';
  ctx.fillText(`lever ${config.sunriseTime}`, sunriseX, y + 14);
}
