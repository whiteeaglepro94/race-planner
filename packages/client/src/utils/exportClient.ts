import { useRaceStore } from '../store/useRaceStore';
import { Viewport } from '../canvas/viewport';
import { drawBackground } from '../canvas/layers/background';
import { drawTimeAxis } from '../canvas/layers/timeAxis';
import { drawSunMarkers } from '../canvas/layers/sunMarkers';
import { drawStintBlocks } from '../canvas/layers/stintBlocks';
import { drawPitStops } from '../canvas/layers/pitStops';
import { drawPitTransitions } from '../canvas/layers/pitTransitions';

const BLOCK_Y = 110;
const BLOCK_H = 90;
const PITSTOP_Y = 210;
const TIME_AXIS_Y = 85;
const SUN_Y = 60;
const CANVAS_H = 300;
const PX_PER_MIN = 5;

function renderFullTimeline(): HTMLCanvasElement {
  const s = useRaceStore.getState();
  const totalMin = s.raceConfig.durationMinutes;
  const w = Math.ceil(totalMin * PX_PER_MIN) + 40;

  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = CANVAS_H;
  const ctx = offscreen.getContext('2d')!;

  const vp = new Viewport(0, PX_PER_MIN, w);

  drawBackground(ctx, vp, s.raceConfig, CANVAS_H);
  drawTimeAxis(ctx, vp, s.raceConfig, TIME_AXIS_Y);
  drawSunMarkers(ctx, vp, s.raceConfig, SUN_Y);
  drawStintBlocks(ctx, vp, s.stints, s.drivers, s.selectedStintId, BLOCK_Y, BLOCK_H, s.raceConfig.startTime);
  drawPitStops(ctx, vp, s.pitStops, PITSTOP_Y, s.raceConfig.startTime);
  drawPitTransitions(ctx, vp, s.stints, s.drivers, PITSTOP_Y, s.raceConfig.startTime);

  return offscreen;
}

const PDF_ROW_MINUTES = 360;
const PDF_MARGIN_PX = 40;
const PDF_ROW_H = 300;

function renderTimelineForPdf(): HTMLCanvasElement {
  const s = useRaceStore.getState();
  const totalMin = s.raceConfig.durationMinutes;
  const rows = Math.ceil(totalMin / PDF_ROW_MINUTES);

  const fullW = Math.ceil(totalMin * PX_PER_MIN) + PDF_MARGIN_PX * 2;
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = fullW;
  fullCanvas.height = PDF_ROW_H;
  const fullCtx = fullCanvas.getContext('2d')!;

  const vp = new Viewport(-PDF_MARGIN_PX / PX_PER_MIN, PX_PER_MIN, fullW);

  drawBackground(fullCtx, vp, s.raceConfig, PDF_ROW_H);
  drawTimeAxis(fullCtx, vp, s.raceConfig, TIME_AXIS_Y);
  drawSunMarkers(fullCtx, vp, s.raceConfig, SUN_Y);
  drawStintBlocks(fullCtx, vp, s.stints, s.drivers, s.selectedStintId, BLOCK_Y, BLOCK_H, s.raceConfig.startTime);
  drawPitStops(fullCtx, vp, s.pitStops, PITSTOP_Y, s.raceConfig.startTime);
  drawPitTransitions(fullCtx, vp, s.stints, s.drivers, PITSTOP_Y, s.raceConfig.startTime);

  const rowW = Math.ceil(PDF_ROW_MINUTES * PX_PER_MIN) + PDF_MARGIN_PX * 2;

  const output = document.createElement('canvas');
  output.width = rowW;
  output.height = rows * PDF_ROW_H;
  const outCtx = output.getContext('2d')!;

  for (let r = 0; r < rows; r++) {
    const srcX = r * PDF_ROW_MINUTES * PX_PER_MIN;
    const srcW = Math.min(rowW, fullW - srcX);
    outCtx.drawImage(fullCanvas, srcX, 0, srcW, PDF_ROW_H, 0, r * PDF_ROW_H, srcW, PDF_ROW_H);
  }

  return output;
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(): string {
  const s = useRaceStore.getState();
  return s.raceConfig.name.replace(/[^a-zA-Z0-9àéèêëïîôùûç ]/g, '').replace(/ /g, '_');
}

export function exportCSV(): void {
  const s = useRaceStore.getState();
  const sorted = [...s.stints].sort((a, b) => a.order - b.order);
  const lines: string[] = [];

  lines.push('=== RÉSUMÉ PAR PILOTE ===');
  lines.push('Pilote,Relais,Temps total,Pourcentage,Chgt pneus,Ravitaillements');
  for (const d of s.drivers) {
    const dStints = sorted.filter((st) => st.driverId === d.id);
    const totalMin = dStints.reduce((sum, st) => sum + st.durationMinutes, 0);
    const hh = Math.floor(totalMin / 60);
    const mm = totalMin % 60;
    const pct = s.raceConfig.durationMinutes > 0 ? Math.round((totalMin / s.raceConfig.durationMinutes) * 100) : 0;
    const tireChanges = dStints.filter((st) => st.tireCondition === 'new').length;
    const fuelLoads = dStints.reduce((sum, st) => sum + st.fuelLoads, 0);
    lines.push(`${d.name},${dStints.length},${hh}h${String(mm).padStart(2, '0')},${pct}%,${tireChanges},${fuelLoads}`);
  }

  lines.push('');
  lines.push('=== DÉTAIL DES RELAIS ===');
  lines.push('#,Pilote,Début,Fin,Durée (min),Pneus,État pneus,Pleins,Chrono cible,Notes');
  for (const [i, st] of sorted.entries()) {
    const driver = s.drivers.find((d) => d.id === st.driverId);
    lines.push([
      i + 1, driver?.name ?? '?', st.startTime, st.endTime, st.durationMinutes,
      st.tireCompound, st.tireCondition, st.fuelLoads,
      st.targetLapTimeSeconds ?? '', st.notes.replace(/,/g, ';'),
    ].join(','));
  }

  if (s.pitStops.length > 0) {
    lines.push('');
    lines.push('=== ARRÊTS AUX STANDS ===');
    lines.push('#,Après pilote,Heure,Durée (s),Changement pneus,Ravitaillement');
    for (const [i, pit] of s.pitStops.entries()) {
      const afterStint = sorted.find((st) => st.id === pit.afterStintId);
      const afterDriver = afterStint ? s.drivers.find((d) => d.id === afterStint.driverId) : null;
      lines.push([
        i + 1, afterDriver?.name ?? '?', pit.time, pit.durationSeconds,
        pit.tireChange ? 'Oui' : 'Non', pit.refuel ? 'Oui' : 'Non',
      ].join(','));
    }
  }

  lines.push('');
  lines.push('=== STATISTIQUES ===');
  const totalDrive = sorted.reduce((sum, st) => sum + st.durationMinutes, 0);
  const totalPit = s.pitStops.reduce((sum, p) => sum + p.durationSeconds, 0);
  lines.push(`Relais total,${sorted.length}`);
  lines.push(`Arrêts aux stands,${s.pitStops.length}`);
  lines.push(`Temps de conduite,${Math.floor(totalDrive / 60)}h${String(totalDrive % 60).padStart(2, '0')}`);
  lines.push(`Temps aux stands,${Math.floor(totalPit / 60)}min ${totalPit % 60}s`);
  lines.push(`Changements pneus,${s.pitStops.filter((p) => p.tireChange).length}`);
  lines.push(`Ravitaillements,${s.pitStops.filter((p) => p.refuel).length}`);
  lines.push(`Pilotes,${s.drivers.length}`);

  download(`${safeName()}_plan.csv`, lines.join('\n'), 'text/csv;charset=utf-8');
}

export function exportPNG(): void {
  const canvas = renderTimelineForPdf();
  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(`${safeName()}_timeline.png`, blob);
  }, 'image/png');
}

export function exportPDF(): void {
  const s = useRaceStore.getState();
  const plan = {
    id: s.raceConfig.id,
    config: s.raceConfig,
    drivers: s.drivers,
    stints: s.stints,
    pitStops: s.pitStops,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const canvas = renderTimelineForPdf();
  const timelineImage = canvas.toDataURL('image/png').split(',')[1];
  const timelineWidth = canvas.width;
  const timelineHeight = canvas.height;

  const ws = new WebSocket('ws://localhost:3001');
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'export', format: 'pdf', plan, timelineImage, timelineWidth, timelineHeight }));
  };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'export-pdf' && msg.data) {
        const bytes = atob(msg.data);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: 'application/pdf' });
        downloadBlob(`${safeName()}_plan.pdf`, blob);
      }
    } finally {
      ws.close();
    }
  };
  ws.onerror = () => ws.close();
}

export function saveAsJSON(): void {
  const s = useRaceStore.getState();
  const plan = {
    id: s.raceConfig.id,
    config: s.raceConfig,
    drivers: s.drivers,
    stints: s.stints,
    pitStops: s.pitStops,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(plan, null, 2);
  download(`${safeName()}_plan.json`, json, 'application/json');
}
