import { Viewport } from './viewport';
import { drawBackground } from './layers/background';
import { drawTimeAxis } from './layers/timeAxis';
import { drawSunMarkers } from './layers/sunMarkers';
import { drawStintBlocks } from './layers/stintBlocks';
import { drawPitStops } from './layers/pitStops';
import { drawLiveCursor } from './layers/cursor';
import { useRaceStore } from '../store/useRaceStore';
import { useLiveStore } from '../store/useLiveStore';
import type { RaceConfig, Driver, Stint, PitStop } from '@race-planner/shared';

const BLOCK_Y = 100;
const BLOCK_H = 60;
const PITSTOP_Y = 170;
const TIME_AXIS_Y = 80;
const SUN_Y = 55;

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
    this.start();
  }

  start(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      const state = this.getStateHash();
      if (state !== this.lastState) {
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
      sel: rs.selectedStintId,
      vp: this.viewport.offsetX + '|' + this.viewport.scale,
      live: ls.elapsedMinutes,
    });
  }

  private draw(): void {
    const { ctx, viewport: vp } = this;
    const rs = useRaceStore.getState();
    const ls = useLiveStore.getState();
    const h = this.canvas.height;

    ctx.clearRect(0, 0, this.canvas.width, h);

    drawBackground(ctx, vp, rs.raceConfig, h);
    drawTimeAxis(ctx, vp, rs.raceConfig, TIME_AXIS_Y);
    drawSunMarkers(ctx, vp, rs.raceConfig, SUN_Y);
    drawStintBlocks(ctx, vp, rs.stints, rs.drivers, rs.selectedStintId, BLOCK_Y, BLOCK_H, rs.raceConfig.startTime);
    drawPitStops(ctx, vp, rs.pitStops, PITSTOP_Y, rs.raceConfig.startTime);

    if (ls.active) {
      drawLiveCursor(ctx, vp, ls.elapsedMinutes, h);
    }
  }
}
