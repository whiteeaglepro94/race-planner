import type { Viewport } from '../viewport';

export function drawLiveCursor(
  ctx: CanvasRenderingContext2D, vp: Viewport,
  elapsedMinutes: number, canvasHeight: number
): void {
  const x = vp.worldToScreenX(elapsedMinutes);
  if (x < 0 || x > vp.canvasWidth) return;

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvasHeight);
  ctx.stroke();
  ctx.setLineDash([]);
}
