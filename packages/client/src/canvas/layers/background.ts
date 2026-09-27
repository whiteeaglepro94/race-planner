import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export interface NightInterval { start: number; end: number; }

export function getNightIntervals(
  startMin: number, durationMin: number, rawSunset: number, rawSunrise: number
): NightInterval[] {
  const intervals: NightInterval[] = [];
  const nightLen = rawSunrise <= rawSunset
    ? rawSunrise + 1440 - rawSunset
    : rawSunrise - rawSunset;

  for (let k = -2; k <= Math.ceil(durationMin / 1440) + 2; k++) {
    const absStart = rawSunset + k * 1440;
    const absEnd = absStart + nightLen;
    const relStart = absStart - startMin;
    const relEnd = absEnd - startMin;
    if (relEnd > 0 && relStart < durationMin) {
      intervals.push({
        start: Math.max(0, relStart),
        end: Math.min(durationMin, relEnd),
      });
    }
  }
  return intervals;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  canvasHeight: number
): void {
  const startMin = timeToMinutes(config.startTime);
  const rawSunset = timeToMinutes(config.sunsetTime);
  const rawSunrise = timeToMinutes(config.sunriseTime);

  const raceStartX = vp.worldToScreenX(0);
  const raceEndX = vp.worldToScreenX(config.durationMinutes);

  // Fill entire race with day color
  ctx.fillStyle = '#1a1e24';
  ctx.fillRect(raceStartX, 0, raceEndX - raceStartX, canvasHeight);

  const nights = getNightIntervals(startMin, config.durationMinutes, rawSunset, rawSunrise);
  const t = performance.now() * 0.001;

  for (const ni of nights) {
    const nightStartX = vp.worldToScreenX(ni.start);
    const nightEndX = vp.worldToScreenX(ni.end);
    const nightW = nightEndX - nightStartX;

    // Night fill
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(nightStartX, 0, nightW, canvasHeight);

    // Night accent bar
    ctx.fillStyle = '#0e1228';
    ctx.fillRect(nightStartX, 0, nightW, 40);

    // Animated stars
    const visibleLeft = Math.max(nightStartX, 0);
    const visibleRight = Math.min(nightEndX, vp.canvasWidth);
    if (visibleRight > visibleLeft) {
      const starSpacing = 18;
      const cols = Math.ceil(nightW / starSpacing);
      const rows = Math.ceil(canvasHeight / starSpacing);

      for (let i = 0; i < cols; i++) {
        const baseX = nightStartX + i * starSpacing;
        if (baseX + starSpacing < visibleLeft || baseX > visibleRight) continue;

        for (let j = 0; j < rows; j++) {
          const seed = i * 997 + j * 131;
          const r = seededRandom(seed);
          if (r > 0.12) continue;

          const sx = baseX + seededRandom(seed + 1) * starSpacing;
          const sy = j * starSpacing + seededRandom(seed + 2) * starSpacing;
          const size = 0.5 + seededRandom(seed + 3) * 1;
          const baseAlpha = 0.25 + seededRandom(seed + 4) * 0.35;
          const twinkleSpeed = 0.4 + seededRandom(seed + 5) * 1.2;
          const twinklePhase = seededRandom(seed + 6) * Math.PI * 2;
          const alpha = baseAlpha * (0.5 + 0.5 * Math.sin(t * twinkleSpeed + twinklePhase));

          ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Night label
    const nightCenterX = (nightStartX + nightEndX) / 2;
    if (nightCenterX > -100 && nightCenterX < vp.canvasWidth + 100 && nightW > 60) {
      ctx.fillStyle = '#7d8590';
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NUIT', nightCenterX, 25);
    }

    // Night boundary dashed lines
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (ni.start > 0 && nightStartX > 0 && nightStartX < vp.canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(nightStartX, 40);
      ctx.lineTo(nightStartX, canvasHeight);
      ctx.stroke();
    }
    if (ni.end < config.durationMinutes && nightEndX > 0 && nightEndX < vp.canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(nightEndX, 40);
      ctx.lineTo(nightEndX, canvasHeight);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Sunset glow (at night start, only if it's a real sunset boundary, not race start)
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.8 + 1.5);
    const radiusPulse = 0.92 + 0.08 * Math.sin(t * 1.2);
    if (ni.start > 0) {
      const sunsetGlow = 80 * vp.scale;
      if (nightStartX > -sunsetGlow && nightStartX < vp.canvasWidth + sunsetGlow) {
        const a = pulse;
        const grad = ctx.createLinearGradient(nightStartX, 0, nightStartX + sunsetGlow, 0);
        grad.addColorStop(0, `rgba(200, 100, 30, ${0.18 * a})`);
        grad.addColorStop(0.3, `rgba(160, 60, 20, ${0.10 * a})`);
        grad.addColorStop(0.7, `rgba(80, 30, 10, ${0.05 * a})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(nightStartX, 0, sunsetGlow, canvasHeight);

        const horizonY = canvasHeight * 0.75;
        const r = sunsetGlow * 0.5 * radiusPulse;
        const hGrad = ctx.createRadialGradient(nightStartX, horizonY, 0, nightStartX, horizonY, r);
        hGrad.addColorStop(0, `rgba(220, 130, 40, ${0.15 * a})`);
        hGrad.addColorStop(0.4, `rgba(200, 90, 20, ${0.08 * a})`);
        hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(nightStartX - r, horizonY - r, r * 2, r * 2);
      }
    }

    // Sunrise glow (at night end, only if it's a real sunrise boundary, not race end)
    const pulse2 = 0.85 + 0.15 * Math.sin(t * 0.8);
    if (ni.end < config.durationMinutes) {
      const glowWidth = 120 * vp.scale;
      if (nightEndX > 0 && nightEndX < vp.canvasWidth + glowWidth) {
        const a = pulse2;
        const glowStart = nightEndX - glowWidth;
        const grad = ctx.createLinearGradient(glowStart, 0, nightEndX, 0);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.4, `rgba(180, 80, 20, ${0.04 * a})`);
        grad.addColorStop(0.7, `rgba(220, 120, 30, ${0.08 * a})`);
        grad.addColorStop(0.9, `rgba(245, 166, 35, ${0.13 * a})`);
        grad.addColorStop(1, `rgba(255, 200, 60, ${0.16 * a})`);
        ctx.fillStyle = grad;
        ctx.fillRect(glowStart, 0, glowWidth, canvasHeight);

        const horizonY = canvasHeight * 0.75;
        const r = glowWidth * 0.7 * radiusPulse;
        const hGrad = ctx.createRadialGradient(nightEndX, horizonY, 0, nightEndX, horizonY, r);
        hGrad.addColorStop(0, `rgba(255, 180, 50, ${0.12 * a})`);
        hGrad.addColorStop(0.4, `rgba(255, 140, 30, ${0.05 * a})`);
        hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(nightEndX - r, horizonY - r, r * 2, r * 2);
      }
    }
  }

  // Checkered flag line at race end
  if (raceEndX > -10 && raceEndX < vp.canvasWidth + 10) {
    const cellSize = 6;
    const stripW = cellSize * 2;
    const x = raceEndX - stripW / 2;
    const rows = Math.ceil(canvasHeight / cellSize);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        const isWhite = (r + c) % 2 === 0;
        ctx.fillStyle = isWhite ? 'rgba(230, 237, 243, 0.9)' : 'rgba(13, 17, 23, 0.9)';
        ctx.fillRect(x + c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
}
