import type { Viewport } from '../viewport';
import type { Stint, Driver } from '@race-planner/shared';
import { timeToMinutes } from './background';
import { useRaceStore } from '../../store/useRaceStore';

let tireImg: HTMLCanvasElement | null = null;
let fuelImg: HTMLImageElement | null = null;
let loadStarted = false;
let ready = false;

const ICON_RENDER_SIZE = 44;

function invertAndResize(src: HTMLImageElement): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = src.naturalWidth;
  tmp.height = src.naturalHeight;
  const tCtx = tmp.getContext('2d')!;
  tCtx.drawImage(src, 0, 0);
  const imgData = tCtx.getImageData(0, 0, tmp.width, tmp.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }
  tCtx.putImageData(imgData, 0, 0);

  const out = document.createElement('canvas');
  out.width = ICON_RENDER_SIZE;
  out.height = ICON_RENDER_SIZE;
  const oCtx = out.getContext('2d')!;
  oCtx.imageSmoothingEnabled = true;
  oCtx.imageSmoothingQuality = 'high';
  oCtx.drawImage(tmp, 0, 0, ICON_RENDER_SIZE, ICON_RENDER_SIZE);
  return out;
}

function loadImages(onReady: () => void): void {
  if (loadStarted) return;
  loadStarted = true;

  let count = 0;
  const check = () => { count++; if (count === 2) { ready = true; onReady(); } };

  const rawTire = new Image();
  rawTire.onload = () => {
    tireImg = invertAndResize(rawTire);
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

export function setPitTransitionsDirtyCallback(cb: () => void): void {
  dirtyCallback = cb;
}

export function drawPitTransitions(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  stints: Stint[],
  drivers: Driver[],
  y: number,
  raceStartTime: string
): void {
  if (!loadStarted) {
    loadImages(() => { dirtyCallback?.(); });
  }

  if (stints.length < 2) return;

  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const startMin = timeToMinutes(raceStartTime);
  const iconSize = 22;

  const prevSmoothing = ctx.imageSmoothingEnabled;
  const prevQuality = ctx.imageSmoothingQuality;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    let endMin = timeToMinutes(current.endTime);
    if (endMin < startMin) endMin += 1440;
    const offsetMin = endMin - startMin;
    const x = vp.worldToScreenX(offsetMin);

    if (x < -40 || x > vp.canvasWidth + 40) continue;

    const { showTireIcons, showFuelIcons } = useRaceStore.getState();
    const tireChange = showTireIcons && next.tireCondition === 'new';
    const refuel = showFuelIcons && next.fuelLoads > 0;

    let offsetY = 4;

    if (tireChange && tireImg && tireImg.width > 0) {
      ctx.drawImage(tireImg, x - iconSize / 2, y + offsetY, iconSize, iconSize);
      offsetY += iconSize + 4;
    }

    if (refuel && fuelImg?.complete && fuelImg.naturalWidth > 0) {
      ctx.drawImage(fuelImg, x - iconSize / 2, y + offsetY, iconSize, iconSize);
      offsetY += iconSize + 4;
    }

    ctx.fillStyle = '#7d8590';
    ctx.font = '9px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(current.endTime, x, y + offsetY + 10);
  }

  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.imageSmoothingQuality = prevQuality;
  ctx.textAlign = 'left';
}
