// packages/client/src/canvas/viewport.ts
export class Viewport {
  offsetX: number;
  scale: number;
  canvasWidth: number;

  private static MIN_SCALE = 0.1;
  private static MAX_SCALE = 60;

  constructor(offsetX: number, scale: number, canvasWidth: number) {
    this.offsetX = offsetX;
    this.scale = scale;
    this.canvasWidth = canvasWidth;
  }

  worldToScreenX(minutes: number): number {
    return (minutes - this.offsetX) * this.scale;
  }

  screenToWorldX(px: number): number {
    return px / this.scale + this.offsetX;
  }

  zoom(delta: number, centerPx: number): void {
    const worldCenter = this.screenToWorldX(centerPx);
    this.scale = Math.max(Viewport.MIN_SCALE, Math.min(Viewport.MAX_SCALE, this.scale * delta));
    this.offsetX = worldCenter - centerPx / this.scale;
  }

  scroll(deltaPx: number): void {
    this.offsetX += deltaPx / this.scale;
  }

  get visibleStartMinutes(): number {
    return this.offsetX;
  }

  get visibleEndMinutes(): number {
    return this.offsetX + this.canvasWidth / this.scale;
  }
}
