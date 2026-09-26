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
  let sunsetMin = timeToMinutes(config.sunsetTime);
  let sunriseMin = timeToMinutes(config.sunriseTime);
  if (sunsetMin < startMin) sunsetMin += 1440;
  if (sunriseMin < startMin) sunriseMin += 1440;
  if (sunriseMin < sunsetMin) sunriseMin += 1440;
  const sunsetOffset = sunsetMin - startMin;
  const sunriseOffset = sunriseMin - startMin;

  ctx.textAlign = 'center';

  const step = vp.scale < 1 ? 120 : vp.scale < 3 ? 60 : 30;
  const proximityThreshold = 40 / vp.scale;

  for (let m = 0; m <= config.durationMinutes; m += step) {
    const x = vp.worldToScreenX(m);
    if (x < -50 || x > vp.canvasWidth + 50) continue;

    const absMin = (startMin + m) % 1440;
    const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mm = String(absMin % 60).padStart(2, '0');

    const isMajor = m % 120 === 0;
    const nearSun = Math.abs(m - sunsetOffset) < proximityThreshold
      || Math.abs(m - sunriseOffset) < proximityThreshold;

    // Tick mark
    ctx.strokeStyle = isMajor ? '#484f58' : '#21262d';
    ctx.lineWidth = isMajor ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (isMajor ? 10 : 6));
    ctx.stroke();

    // Time label — skip if too close to sunset/sunrise marker
    if (!nearSun) {
      const isFinish = m === config.durationMinutes;
      if (isFinish) {
        ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0d1117';
        ctx.strokeText(`${hh}:${mm}`, x, y - 5);
        ctx.fillStyle = '#f5a623';
        ctx.fillText(`${hh}:${mm}`, x, y - 5);
      } else {
        ctx.fillStyle = isMajor ? '#c9d1d9' : '#484f58';
        ctx.font = isMajor
          ? 'bold 12px "Segoe UI", system-ui, sans-serif'
          : '10px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(`${hh}:${mm}`, x, y - 5);
      }
    }

    // Subtle vertical grid line
    if (isMajor) {
      ctx.strokeStyle = '#ffffff14';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x, y + 200);
      ctx.stroke();
    }
  }
}
