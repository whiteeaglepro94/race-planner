import { Viewport } from './viewport';
import { drawBackground } from './layers/background';
import { drawTimeAxis } from './layers/timeAxis';
import { drawSunMarkers } from './layers/sunMarkers';
import { drawStintBlocks } from './layers/stintBlocks';
import { drawPitStops, setPitStopsDirtyCallback } from './layers/pitStops';
import { drawPitTransitions, setPitTransitionsDirtyCallback } from './layers/pitTransitions';
import { drawLiveCursor } from './layers/cursor';
import { useRaceStore } from '../store/useRaceStore';
import { useLiveStore } from '../store/useLiveStore';
import { calcRealSunTimes } from '../utils/solar';
import { timeToMinutes, getNightIntervals } from './layers/background';
import type { RaceConfig } from '@race-planner/shared';

function addMinToTime(hhmm: string, delta: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = ((h * 60 + m + delta) % 1440 + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// SIM section layout
const SIM_BLOCK_Y = 110;
const SIM_BLOCK_H = 90;
const SIM_PITSTOP_Y = 210;
const SIM_TIME_AXIS_Y = 85;
const SIM_SUN_Y = 60;
const SIM_SECTION_H = 270;

// REAL section layout
const SEPARATOR_Y = SIM_SECTION_H;
const REAL_OFFSET = SEPARATOR_Y + 10;
const REAL_SUN_Y = REAL_OFFSET + 25;
const REAL_TIME_AXIS_Y = REAL_OFFSET + 45;
const REAL_BLOCK_Y = REAL_OFFSET + 65;
const REAL_BLOCK_H = 55;
const REAL_SECTION_H = 140;

export const TOTAL_CANVAS_H = SIM_SECTION_H + REAL_SECTION_H;

// Default: Paris area
const DEFAULT_LAT = 48.86;
const DEFAULT_LON = 2.35;

export class RaceTimelineRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  viewport: Viewport;
  private animId: number = 0;
  private lastState: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.viewport = new Viewport(0, 3, canvas.width);
    setPitTransitionsDirtyCallback(() => { this.lastState = ''; });
    setPitStopsDirtyCallback(() => { this.lastState = ''; });
    this.start();
  }

  start(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      const state = this.getStateHash();
      if (state !== this.lastState || this.nightVisible() || useLiveStore.getState().active) {
        this.lastState = state;
        this.draw();
      }
    };
    loop();
  }

  stop(): void {
    cancelAnimationFrame(this.animId);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.viewport.canvasWidth = width;
  }

  private getStateHash(): string {
    const rs = useRaceStore.getState();
    const ls = useLiveStore.getState();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return JSON.stringify({
      cfg: rs.raceConfig.startTime + rs.raceConfig.durationMinutes,
      pre: rs.raceConfig.practiceDurationMinutes + '|' + rs.raceConfig.qualifyingDurationMinutes,
      sc: rs.stints.map(s => s.id + s.startTime + s.durationMinutes + s.driverId).join(),
      pc: rs.pitStops.map(p => p.id + p.time).join(),
      sel: rs.selectedStintId + '|' + rs.selectedPitStopId,
      vp: this.viewport.offsetX + '|' + this.viewport.scale,
      live: ls.elapsedMinutes,
      ti: rs.showTireIcons,
      fi: rs.showFuelIcons,
      rst: rs.realStartTime,
      nowM: nowMin,
    });
  }

  private nightVisible(): boolean {
    const rs = useRaceStore.getState();
    const { config: ext } = this.buildExtendedSimConfig(rs.raceConfig);
    const startMin = timeToMinutes(ext.startTime);
    const rawSunset = timeToMinutes(ext.sunsetTime);
    const rawSunrise = timeToMinutes(ext.sunriseTime);
    const nights = getNightIntervals(startMin, ext.durationMinutes, rawSunset, rawSunrise);
    for (const ni of nights) {
      const x1 = this.viewport.worldToScreenX(ni.start);
      const x2 = this.viewport.worldToScreenX(ni.end);
      if (x2 > 0 && x1 < this.viewport.canvasWidth) return true;
    }
    return false;
  }

  private buildRealConfig(rs: ReturnType<typeof useRaceStore.getState>): RaceConfig {
    const realSun = calcRealSunTimes(new Date(), DEFAULT_LAT, DEFAULT_LON);
    return {
      ...rs.raceConfig,
      startTime: rs.realStartTime,
      sunsetTime: realSun.sunset,
      sunriseTime: realSun.sunrise,
    };
  }

  private buildExtendedSimConfig(cfg: RaceConfig): { config: RaceConfig; preRaceMinutes: number } {
    const pracMin = cfg.practiceDurationMinutes || 0;
    const qualMin = cfg.qualifyingDurationMinutes || 0;
    const preRaceMinutes = pracMin + qualMin;
    if (preRaceMinutes <= 0) return { config: cfg, preRaceMinutes: 0 };
    return {
      config: {
        ...cfg,
        durationMinutes: preRaceMinutes + cfg.durationMinutes,
      },
      preRaceMinutes,
    };
  }

  private drawPreRaceZones(
    ctx: CanvasRenderingContext2D, vp: Viewport,
    pracMin: number, qualMin: number, preRaceMinutes: number,
    sectionH: number, raceStartTime: string,
  ): void {
    if (preRaceMinutes <= 0) return;

    const qualEnd = preRaceMinutes;
    const qualStart = qualEnd - qualMin;
    const pracStart = 0;

    // Practice zone
    if (pracMin > 0) {
      const x1 = vp.worldToScreenX(pracStart);
      const x2 = vp.worldToScreenX(qualStart);
      if (x2 > 0 && x1 < vp.canvasWidth) {
        ctx.fillStyle = '#0d1a12';
        ctx.fillRect(x1, 0, x2 - x1, sectionH);

        // Diagonal stripes
        ctx.save();
        ctx.beginPath();
        ctx.rect(x1, 0, x2 - x1, sectionH);
        ctx.clip();
        ctx.strokeStyle = '#1a3022';
        ctx.lineWidth = 1;
        const step = 20;
        for (let i = -sectionH; i < (x2 - x1) + sectionH; i += step) {
          ctx.beginPath();
          ctx.moveTo(x1 + i, 0);
          ctx.lineTo(x1 + i + sectionH, sectionH);
          ctx.stroke();
        }
        ctx.restore();

        const cx = (Math.max(x1, 0) + Math.min(x2, vp.canvasWidth)) / 2;
        if (x2 - x1 > 80) {
          ctx.fillStyle = '#2ea04380';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PRACTICE', cx, sectionH / 2 - 4);
          const pStart = raceStartTime;
          const pEnd = addMinToTime(raceStartTime, pracMin);
          ctx.font = '10px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = '#2ea04360';
          ctx.fillText(`${pStart} — ${pEnd}`, cx, sectionH / 2 + 12);
        }
      }
    }

    // Qualifying zone
    if (qualMin > 0) {
      const x1 = vp.worldToScreenX(qualStart);
      const x2 = vp.worldToScreenX(qualEnd);
      if (x2 > 0 && x1 < vp.canvasWidth) {
        ctx.fillStyle = '#1a0d1a';
        ctx.fillRect(x1, 0, x2 - x1, sectionH);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x1, 0, x2 - x1, sectionH);
        ctx.clip();
        ctx.strokeStyle = '#30182e';
        ctx.lineWidth = 1;
        const step = 20;
        for (let i = -sectionH; i < (x2 - x1) + sectionH; i += step) {
          ctx.beginPath();
          ctx.moveTo(x1 + i, 0);
          ctx.lineTo(x1 + i + sectionH, sectionH);
          ctx.stroke();
        }
        ctx.restore();

        const cx = (Math.max(x1, 0) + Math.min(x2, vp.canvasWidth)) / 2;
        if (x2 - x1 > 60) {
          ctx.fillStyle = '#a855f780';
          ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('QUALIF', cx, sectionH / 2 - 4);
          const qStart = addMinToTime(raceStartTime, pracMin);
          const qEnd = addMinToTime(raceStartTime, pracMin + qualMin);
          ctx.font = '10px "Segoe UI", system-ui, sans-serif';
          ctx.fillStyle = '#a855f760';
          ctx.fillText(`${qStart} — ${qEnd}`, cx, sectionH / 2 + 12);
        }
      }
    }

    // Race start marker
    const raceX = vp.worldToScreenX(preRaceMinutes);
    if (raceX > 0 && raceX < vp.canvasWidth) {
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(raceX, 0);
      ctx.lineTo(raceX, sectionH);
      ctx.stroke();

      ctx.fillStyle = '#f5a623';
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DÉPART', raceX, 16);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#f5a62390';
      ctx.fillText(addMinToTime(raceStartTime, preRaceMinutes), raceX, 28);
    }
  }

  private draw(): void {
    const { ctx, viewport: vp } = this;
    const rs = useRaceStore.getState();
    const ls = useLiveStore.getState();
    const h = this.canvas.height;

    if (ls.active && ls.elapsedMinutes > 0) {
      const cursorScreenX = vp.worldToScreenX(ls.elapsedMinutes);
      const targetX = vp.canvasWidth * 0.3;
      if (cursorScreenX < 0 || cursorScreenX > vp.canvasWidth * 0.85) {
        vp.offsetX = ls.elapsedMinutes - targetX / vp.scale;
      }
    }

    ctx.clearRect(0, 0, this.canvas.width, h);

    // ── TOP: HEURE RÉEL (PC time, real sun) ──
    const realConfig = this.buildRealConfig(rs);
    const { config: extRealConfig, preRaceMinutes: realPreRace } = this.buildExtendedSimConfig(realConfig);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.canvas.width, SIM_SECTION_H);
    ctx.clip();

    drawBackground(ctx, vp, extRealConfig, SIM_SECTION_H);
    this.drawPreRaceZones(
      ctx, vp,
      rs.raceConfig.practiceDurationMinutes || 0,
      rs.raceConfig.qualifyingDurationMinutes || 0,
      realPreRace, SIM_SECTION_H, rs.realStartTime,
    );
    drawTimeAxis(ctx, vp, extRealConfig, SIM_TIME_AXIS_Y);
    drawSunMarkers(ctx, vp, extRealConfig, SIM_SUN_Y);
    const realStintOrigin = addMinToTime(rs.realStartTime, -realPreRace);
    drawStintBlocks(ctx, vp, rs.stints, rs.drivers, rs.selectedStintId, SIM_BLOCK_Y, SIM_BLOCK_H, realStintOrigin);
    drawPitStops(ctx, vp, rs.pitStops, SIM_PITSTOP_Y, realStintOrigin, rs.selectedPitStopId);
    drawPitTransitions(ctx, vp, rs.stints, rs.drivers, SIM_PITSTOP_Y, realStintOrigin);

    if (ls.active) {
      drawLiveCursor(ctx, vp, ls.elapsedMinutes + realPreRace, SIM_SECTION_H);
    }


    ctx.restore();

    // ── SEPARATOR ──
    ctx.fillStyle = '#21262d';
    ctx.fillRect(0, SEPARATOR_Y, this.canvas.width, 1);
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, SEPARATOR_Y + 1, this.canvas.width, 9);

    // ── BOTTOM: HEURE SIM (in-game time, game sun) — pas de practice/qualif ──
    const simConfig = rs.raceConfig;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, REAL_OFFSET, this.canvas.width, REAL_SECTION_H);
    ctx.clip();
    ctx.translate(0, REAL_OFFSET);

    drawBackground(ctx, vp, simConfig, REAL_SECTION_H - 10);
    drawTimeAxis(ctx, vp, simConfig, REAL_TIME_AXIS_Y - REAL_OFFSET);
    drawSunMarkers(ctx, vp, simConfig, REAL_SUN_Y - REAL_OFFSET);
    const simStintOrigin = rs.raceConfig.startTime;
    drawStintBlocks(ctx, vp, rs.stints, rs.drivers, rs.selectedStintId, REAL_BLOCK_Y - REAL_OFFSET, REAL_BLOCK_H, simStintOrigin);

    // HEURE SIM label
    ctx.fillStyle = '#58a6ff80';
    ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HEURE SIM', 8, 16);

    ctx.restore();
  }

}
