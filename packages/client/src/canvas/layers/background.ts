import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  canvasHeight: number
): void {
  const startMin = timeToMinutes(config.startTime);
  let sunsetMin = timeToMinutes(config.sunsetTime);
  let sunriseMin = timeToMinutes(config.sunriseTime);

  if (sunsetMin < startMin) sunsetMin += 1440;
  if (sunriseMin < startMin) sunriseMin += 1440;
  if (sunriseMin < sunsetMin) sunriseMin += 1440;

  const sunsetOffset = sunsetMin - startMin;
  const sunriseOffset = sunriseMin - startMin;

  // Day
  const dayStartX = vp.worldToScreenX(0);
  const dayEndX = vp.worldToScreenX(sunsetOffset);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(dayStartX, 0, dayEndX - dayStartX, canvasHeight);

  // Night
  const nightEndX = vp.worldToScreenX(sunriseOffset);
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(dayEndX, 0, nightEndX - dayEndX, canvasHeight);

  // Day after sunrise
  const raceEndX = vp.worldToScreenX(config.durationMinutes);
  if (raceEndX > nightEndX) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(nightEndX, 0, raceEndX - nightEndX, canvasHeight);
  }

  // Night label
  const nightCenterX = (dayEndX + nightEndX) / 2;
  ctx.fillStyle = '#666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NUIT', nightCenterX, 20);
}
