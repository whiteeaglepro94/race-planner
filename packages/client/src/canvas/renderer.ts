import { Viewport } from './viewport';
import { drawBackground } from './layers/background';
import { drawTimeAxis } from './layers/timeAxis';
import { drawSunMarkers } from './layers/sunMarkers';
import { drawStintBlocks } from './layers/stintBlocks';
import { drawPitStops } from './layers/pitStops';
import { drawLiveCursor } from './layers/cursor';
import { useRaceStore } from '../store/useRaceStore';
import { useLiveStore } from '../store/useLiveStore';
import { drawPitTransitions, setPitTransitionsDirtyCallback } from './layers/pitTransitions';

const BLOCK_Y = 110;
const BLOCK_H = 90;
const PITSTOP_Y = 210;
const TIME_AXIS_Y = 85;
const SUN_Y = 60;

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
    return JSON.stringify({
      cfg: rs.raceConfig.startTime + rs.raceConfig.durationMinutes,
      sc: rs.stints.length,
      pc: rs.pitStops.length,
      sel: rs.selectedStintId,
      vp: this.viewport.offsetX + '|' + this.viewport.scale,
      live: ls.elapsedMinutes,
      ti: rs.showTireIcons,
      fi: rs.showFuelIcons,
    });
  }

  private nightVisible(): boolean {
    const rs = useRaceStore.getState();
    const startMin = parseInt(rs.raceConfig.startTime.split(':')[0]) * 60 + parseInt(rs.raceConfig.startTime.split(':')[1]);
    let sunsetMin = parseInt(rs.raceConfig.sunsetTime.split(':')[0]) * 60 + parseInt(rs.raceConfig.sunsetTime.split(':')[1]);
    let sunriseMin = parseInt(rs.raceConfig.sunriseTime.split(':')[0]) * 60 + parseInt(rs.raceConfig.sunriseTime.split(':')[1]);
    if (sunsetMin < startMin) sunsetMin += 1440;
    if (sunriseMin < startMin) sunriseMin += 1440;
    if (sunriseMin < sunsetMin) sunriseMin += 1440;
    const nightStartX = this.viewport.worldToScreenX(sunsetMin - startMin);
    const nightEndX = this.viewport.worldToScreenX(sunriseMin - startMin);
    return nightEndX > 0 && nightStartX < this.viewport.canvasWidth;
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

    drawBackground(ctx, vp, rs.raceConfig, h);
    drawTimeAxis(ctx, vp, rs.raceConfig, TIME_AXIS_Y);
    drawSunMarkers(ctx, vp, rs.raceConfig, SUN_Y);
    drawStintBlocks(ctx, vp, rs.stints, rs.drivers, rs.selectedStintId, BLOCK_Y, BLOCK_H, rs.raceConfig.startTime);
    drawPitStops(ctx, vp, rs.pitStops, PITSTOP_Y, rs.raceConfig.startTime);
    drawPitTransitions(ctx, vp, rs.stints, rs.drivers, PITSTOP_Y, rs.raceConfig.startTime);

    if (ls.active) {
      drawLiveCursor(ctx, vp, ls.elapsedMinutes, h);
    }
  }
}
