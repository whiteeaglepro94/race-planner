import type { Viewport } from '../viewport';
import type { PitStop } from '@race-planner/shared';
import { timeToMinutes } from './background';

const MARKER_W = 32;
const MARKER_H = 40;

export interface PitStopRect { id: string; x: number; y: number; w: number; h: number; }

export function getPitStopScreenRect(
  ps: PitStop, vp: Viewport, pitY: number, raceStartTime: string
): PitStopRect {
  const startMin = timeToMinutes(raceStartTime);
  let psMin = timeToMinutes(ps.time);
  if (psMin < startMin) psMin += 1440;
  const offsetMin = psMin - startMin;
  const x = vp.worldToScreenX(offsetMin) - MARKER_W / 2;
  return { id: ps.id, x, y: pitY, w: MARKER_W, h: MARKER_H };
}

let tireCanvas: HTMLCanvasElement | null = null;
let fuelImg: HTMLImageElement | null = null;
let iconsLoaded = false;
let loadStarted = false;

function loadIcons(onReady: () => void): void {
  if (loadStarted) return;
  loadStarted = true;
  let count = 0;
  const check = () => { count++; if (count === 2) { iconsLoaded = true; onReady(); } };

  const rawTire = new Image();
  rawTire.onload = () => {
    const c = document.createElement('canvas');
    c.width = 20; c.height = 20;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(rawTire, 0, 0, rawTire.naturalWidth, rawTire.naturalHeight, 0, 0, 20, 20);
    const d = ctx.getImageData(0, 0, 20, 20);
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i] = 255 - d.data[i];
      d.data[i+1] = 255 - d.data[i+1];
      d.data[i+2] = 255 - d.data[i+2];
    }
    ctx.putImageData(d, 0, 0);
    tireCanvas = c;
    check();
  };
  rawTire.onerror = check;
  rawTire.src = '/icons/tire.png';

  fuelImg = new Image();
  fuelImg.onload = check;
  fuelImg.onerror = check;
  fuelImg.src = '/icons/fuel.png';
}

let dirtyCallback: (() => void) | null = null;
export function setPitStopsDirtyCallback(cb: () => void): void { dirtyCallback = cb; }

export function drawPitStops(
  ctx: CanvasRenderingContext2D, vp: Viewport,
  pitStops: PitStop[], pitY: number, raceStartTime: string,
  selectedId: string | null,
): void {
  if (!loadStarted) loadIcons(() => { dirtyCallback?.(); });
  if (pitStops.length === 0) return;

  for (const ps of pitStops) {
    const r = getPitStopScreenRect(ps, vp, pitY, raceStartTime);
    if (r.x + r.w < 0 || r.x > vp.canvasWidth) continue;

    const cx = r.x + r.w / 2;
    const isSelected = ps.id === selectedId;

    ctx.beginPath();
    ctx.moveTo(cx, r.y - 4);
    ctx.lineTo(cx, r.y + r.h + 4);
    ctx.strokeStyle = isSelected ? '#f5a623' : '#484f5880';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash(isSelected ? [] : [3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    const bgColor = isSelected ? '#2a1a0d' : '#161b22';
    const borderColor = isSelected ? '#f5a623' : '#30363d';
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 4);
    ctx.fill();
    ctx.stroke();

    const iconSize = 14;
    let oy = r.y + 4;

    if (ps.tireChange && tireCanvas) {
      ctx.drawImage(tireCanvas, cx - iconSize / 2, oy, iconSize, iconSize);
      oy += iconSize + 2;
    }

    if (ps.refuel && fuelImg?.complete && fuelImg.naturalWidth > 0) {
      ctx.drawImage(fuelImg, cx - iconSize / 2, oy, iconSize, iconSize);
      oy += iconSize + 2;
    }

    if (!ps.tireChange && !ps.refuel) {
      ctx.fillStyle = '#7d8590';
      ctx.font = '9px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PIT', cx, r.y + r.h / 2 + 3);
    }

    ctx.fillStyle = '#7d8590';
    ctx.font = '8px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ps.time, cx, r.y + r.h + 14);
  }

  ctx.textAlign = 'left';
}
