# Phase 4 — Export + Live (Tasks 16-20)

---

### Task 16: Export System

**Files:**
- Create: `packages/server/src/export/csv.ts`
- Create: `packages/server/src/export/pdf.ts`
- Create: `packages/server/src/__tests__/export.test.ts`
- Modify: `packages/server/src/websocket.ts` (wire export handlers)

**Interfaces:**
- Consumes: `RacePlan`, `Stint`, `Driver` from shared, `handleMessage` from Task 4
- Produces: `planToCSV(plan): string`, `planToPDF(plan): Promise<Buffer>`

- [ ] **Step 1: Install pdfkit**

Run: `cd packages/server && npm install pdfkit`
Run: `cd packages/server && npm install -D @types/pdfkit`

- [ ] **Step 2: Write failing test**

```typescript
// packages/server/src/__tests__/export.test.ts
import { describe, it, expect } from 'vitest';
import { planToCSV } from '../export/csv';
import type { RacePlan } from '@race-planner/shared';

const plan: RacePlan = {
  id: 'p-1',
  config: { id: 'c-1', name: 'Test', simulator: 'S', circuit: 'C', car: 'V', durationMinutes: 180, startTime: '14:00', sunsetTime: '20:00', sunriseTime: '06:00', mode: 'duration', pitStopDurationSeconds: 60, fuelCapacity: 100, fuelPerLap: 3, avgLapTimeSeconds: 120 },
  drivers: [{ id: 'drv-1', name: 'Alice', color: '#f00' }],
  stints: [{ id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:30', durationMinutes: 90, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: 'push', order: 0 }],
  pitStops: [],
  createdAt: '', updatedAt: '',
};

describe('planToCSV', () => {
  it('produces valid CSV with headers', () => {
    const csv = planToCSV(plan);
    const lines = csv.split('\n');
    expect(lines[0]).toContain('Pilote');
    expect(lines[0]).toContain('Début');
    expect(lines[1]).toContain('Alice');
    expect(lines[1]).toContain('14:00');
  });
});
```

- [ ] **Step 3: Implement csv.ts**

```typescript
// packages/server/src/export/csv.ts
import type { RacePlan } from '@race-planner/shared';

export function planToCSV(plan: RacePlan): string {
  const headers = ['#', 'Pilote', 'Début', 'Fin', 'Durée (min)', 'Pneus', 'État pneus', 'Pleins', 'Chrono cible', 'Notes'];
  const rows = plan.stints
    .sort((a, b) => a.order - b.order)
    .map((s, i) => {
      const driver = plan.drivers.find((d) => d.id === s.driverId);
      return [i + 1, driver?.name ?? '?', s.startTime, s.endTime, s.durationMinutes, s.tireCompound, s.tireCondition, s.fuelLoads, s.targetLapTimeSeconds ?? '', s.notes.replace(/,/g, ';')].join(',');
    });
  return [headers.join(','), ...rows].join('\n');
}
```

- [ ] **Step 4: Implement pdf.ts**

```typescript
// packages/server/src/export/pdf.ts
import PDFDocument from 'pdfkit';
import type { RacePlan } from '@race-planner/shared';

export async function planToPDF(plan: RacePlan): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(18).text(plan.config.name, { align: 'center' });
    doc.fontSize(10).text(`${plan.config.circuit} — ${plan.config.car} — ${plan.config.durationMinutes / 60}h`, { align: 'center' });
    doc.text(`Départ: ${plan.config.startTime}`, { align: 'center' });
    doc.moveDown();

    // Stint table
    doc.fontSize(8);
    const sorted = [...plan.stints].sort((a, b) => a.order - b.order);
    const colW = [30, 80, 50, 50, 50, 60, 50, 40, 200];
    const headers = ['#', 'Pilote', 'Début', 'Fin', 'Durée', 'Pneus', 'État', 'Pleins', 'Notes'];

    let y = doc.y;
    headers.forEach((h, i) => {
      const x = 40 + colW.slice(0, i).reduce((s, w) => s + w, 0);
      doc.font('Helvetica-Bold').text(h, x, y, { width: colW[i] });
    });
    y += 14;

    for (const [idx, s] of sorted.entries()) {
      const driver = plan.drivers.find((d) => d.id === s.driverId);
      const vals = [String(idx + 1), driver?.name ?? '?', s.startTime, s.endTime, `${s.durationMinutes} min`, s.tireCompound, s.tireCondition, String(s.fuelLoads), s.notes];
      vals.forEach((v, i) => {
        const x = 40 + colW.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.font('Helvetica').text(v, x, y, { width: colW[i] });
      });
      y += 12;
      if (y > 500) { doc.addPage(); y = 40; }
    }

    // Driver summary
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Résumé par pilote');
    doc.fontSize(8).font('Helvetica');
    for (const d of plan.drivers) {
      const dStints = sorted.filter((s) => s.driverId === d.id);
      const totalMin = dStints.reduce((s, st) => s + st.durationMinutes, 0);
      const hh = Math.floor(totalMin / 60);
      const mm = totalMin % 60;
      doc.text(`${d.name}: ${hh}h${String(mm).padStart(2, '0')} (${dStints.length} relais)`);
    }

    doc.end();
  });
}
```

- [ ] **Step 5: Wire into websocket.ts**

Add to the `export` case in `handleMessage`:
```typescript
case 'export': {
  if (message.format === 'csv') {
    const { planToCSV } = await import('./export/csv.js');
    const csv = planToCSV(message.plan);
    const filePath = resolve(process.cwd(), 'data', 'exports', `${message.plan.id}.csv`);
    await mkdir(resolve(process.cwd(), 'data', 'exports'), { recursive: true });
    await writeFile(filePath, csv, 'utf-8');
    send(ws, { type: 'export-ready', url: `/exports/${message.plan.id}.csv` });
  } else if (message.format === 'pdf') {
    const { planToPDF } = await import('./export/pdf.js');
    const buf = await planToPDF(message.plan);
    const filePath = resolve(process.cwd(), 'data', 'exports', `${message.plan.id}.pdf`);
    await mkdir(resolve(process.cwd(), 'data', 'exports'), { recursive: true });
    await writeFile(filePath, buf);
    send(ws, { type: 'export-ready', url: `/exports/${message.plan.id}.pdf` });
  }
  break;
}
```

Also add static file serving in `index.ts` for `/exports/` path.

- [ ] **Step 6: Run tests, verify pass, commit**

```bash
git add packages/server/src/export/ packages/server/src/__tests__/export.test.ts packages/server/src/websocket.ts
git commit -m "feat: add CSV and PDF export system"
```

---

### Task 17: Auto-save + Undo/Redo + Keyboard Shortcuts

**Files:**
- Create: `packages/client/src/hooks/useAutoSave.ts`
- Create: `packages/client/src/hooks/useKeyboardShortcuts.ts`

**Interfaces:**
- Consumes: `useRaceStore` (Task 3), `useWebSocket` (Task 6)
- Produces: `useAutoSave(send)`, `useKeyboardShortcuts()`

- [ ] **Step 1: Implement useAutoSave**

```typescript
// packages/client/src/hooks/useAutoSave.ts
import { useEffect, useRef } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import type { ClientMessage } from '@race-planner/shared';

export function useAutoSave(send: (msg: ClientMessage) => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const unsub = useRaceStore.subscribe(() => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const s = useRaceStore.getState();
        send({
          type: 'save-plan',
          plan: {
            id: s.raceConfig.id,
            config: s.raceConfig,
            drivers: s.drivers,
            stints: s.stints,
            pitStops: s.pitStops,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }, 3000);
    });
    return () => { unsub(); clearTimeout(timeoutRef.current); };
  }, [send]);
}
```

- [ ] **Step 2: Implement useKeyboardShortcuts**

```typescript
// packages/client/src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useRaceStore } from '../store/useRaceStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useRaceStore.temporal.getState().undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        useRaceStore.temporal.getState().redo();
      }
      if (e.key === 'Delete') {
        const selected = useRaceStore.getState().selectedStintId;
        if (selected) useRaceStore.getState().removeStint(selected);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/hooks/
git commit -m "feat: add auto-save, undo/redo, and keyboard shortcuts"
```

---

### Task 18: iRacing Bridge

**Files:**
- Create: `packages/server/src/iracing/bridge.ts`
- Create: `packages/server/src/iracing/session.ts`
- Create: `packages/server/src/__tests__/bridge.test.ts`
- Modify: `packages/server/src/websocket.ts` (wire iracing handlers)

**Interfaces:**
- Consumes: `LiveRaceData` from shared, WebSocket `broadcast` from Task 4
- Produces: `IracingBridge` class with `start()`, `stop()`, `onData(callback)`

- [ ] **Step 1: Install node-irsdk**

Run: `cd packages/server && npm install node-irsdk`

- [ ] **Step 2: Write failing test**

```typescript
// packages/server/src/__tests__/bridge.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeTelemetry } from '../iracing/bridge';

describe('normalizeTelemetry', () => {
  it('maps raw iRacing data to LiveRaceData', () => {
    const raw = {
      SessionTime: 3600.5,
      Lap: 42,
      SessionLapsTotal: 382,
      PlayerCarPosition: 3,
      FuelLevel: 45.2,
      LapLastLapTime: 218.4,
      LapBestLapTime: 216.9,
      TrackTempCrew: 28.0,
      IsOnTrack: true,
      PlayerCarDriverIncidentCount: 0,
      DriverInfo: { DriverCarIdx: 0 },
    };
    const result = normalizeTelemetry(raw);
    expect(result.sessionTime).toBe(3600.5);
    expect(result.position).toBe(3);
    expect(result.fuelRemaining).toBeCloseTo(45.2);
    expect(result.isOnTrack).toBe(true);
  });
});
```

- [ ] **Step 3: Implement bridge.ts**

```typescript
// packages/server/src/iracing/bridge.ts
import type { LiveRaceData } from '@race-planner/shared';

export function normalizeTelemetry(raw: Record<string, unknown>): LiveRaceData {
  const driverInfo = raw.DriverInfo as Record<string, unknown> | undefined;
  return {
    sessionTime: (raw.SessionTime as number) ?? 0,
    currentLap: (raw.Lap as number) ?? 0,
    totalLaps: (raw.SessionLapsTotal as number) ?? 0,
    position: (raw.PlayerCarPosition as number) ?? 0,
    fuelRemaining: (raw.FuelLevel as number) ?? 0,
    lastLapTime: (raw.LapLastLapTime as number) ?? 0,
    bestLapTime: (raw.LapBestLapTime as number) ?? 0,
    trackTemp: (raw.TrackTempCrew as number) ?? 0,
    isOnTrack: (raw.IsOnTrack as boolean) ?? false,
    currentDriverIndex: (driverInfo?.DriverCarIdx as number) ?? 0,
  };
}

type DataCallback = (data: LiveRaceData) => void;

export class IracingBridge {
  private interval: ReturnType<typeof setInterval> | null = null;
  private callback: DataCallback | null = null;
  private iracing: unknown = null;

  async start(): Promise<boolean> {
    try {
      const irsdk = await import('node-irsdk');
      this.iracing = irsdk.init({ telemetryUpdateInterval: 100 });
      const sdk = this.iracing as { on: (event: string, cb: (data: unknown) => void) => void };

      sdk.on('Telemetry', (data: unknown) => {
        const values = (data as { values: Record<string, unknown> }).values;
        if (this.callback && values) {
          this.callback(normalizeTelemetry(values));
        }
      });

      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.iracing = null;
  }

  onData(cb: DataCallback): void {
    this.callback = cb;
  }
}
```

- [ ] **Step 4: Implement session.ts**

```typescript
// packages/server/src/iracing/session.ts
import { IracingBridge } from './bridge.js';

export class IracingSession {
  private bridge: IracingBridge;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  connected = false;

  constructor() {
    this.bridge = new IracingBridge();
  }

  async connect(onData: (data: unknown) => void, onStatus: (connected: boolean) => void): Promise<void> {
    this.bridge.onData(onData as Parameters<IracingBridge['onData']>[0]);
    const ok = await this.bridge.start();
    this.connected = ok;
    onStatus(ok);

    if (!ok) {
      this.reconnectTimer = setInterval(async () => {
        const retry = await this.bridge.start();
        if (retry) {
          this.connected = true;
          onStatus(true);
          if (this.reconnectTimer) clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      }, 5000);
    }
  }

  disconnect(): void {
    this.bridge.stop();
    this.connected = false;
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
```

- [ ] **Step 5: Wire into websocket.ts**

Update `iracing-connect` and `iracing-disconnect` cases to use `IracingSession`:

```typescript
// Add to websocket.ts
import { IracingSession } from './iracing/session.js';

let iracingSession: IracingSession | null = null;

// In handleMessage:
case 'iracing-connect': {
  if (!iracingSession) iracingSession = new IracingSession();
  iracingSession.connect(
    (data) => broadcast(wss, { type: 'iracing-data', data: data as LiveRaceData }),
    (connected) => broadcast(wss, { type: 'iracing-status', connected }),
  );
  break;
}
case 'iracing-disconnect': {
  iracingSession?.disconnect();
  broadcast(wss, { type: 'iracing-status', connected: false });
  break;
}
```

- [ ] **Step 6: Run tests, verify pass, commit**

```bash
git add packages/server/src/iracing/ packages/server/src/__tests__/bridge.test.ts packages/server/src/websocket.ts
git commit -m "feat: add iRacing bridge with auto-reconnect and telemetry normalization"
```

---

### Task 19: Live Race Mode UI

**Files:**
- Create: `packages/client/src/components/LivePanel.tsx`

**Interfaces:**
- Consumes: `useLiveStore` (Task 3), `useRaceStore` (Task 3), `useWebSocket` (Task 6)
- Produces: `<LivePanel />`

- [ ] **Step 1: Implement LivePanel**

```tsx
// packages/client/src/components/LivePanel.tsx
import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';

function formatLapTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toFixed(1);
  return `${min}:${sec.padStart(4, '0')}`;
}

export function LivePanel({ onConnect, onDisconnect }: { onConnect: () => void; onDisconnect: () => void }) {
  const { active, connected, data, deviations } = useLiveStore();
  const startFollowing = useLiveStore((s) => s.startFollowing);
  const stopFollowing = useLiveStore((s) => s.stopFollowing);
  const drivers = useRaceStore((s) => s.drivers);
  const stints = useRaceStore((s) => s.stints);
  const currentStintIdx = useLiveStore((s) => s.currentStintIndex);

  const currentStint = stints[currentStintIdx];
  const currentDriver = drivers.find((d) => d.id === currentStint?.driverId);
  const lastDev = deviations[deviations.length - 1];
  const deltaText = lastDev
    ? lastDev.deltaMinutes > 0
      ? `Retard ${lastDev.deltaMinutes} min`
      : `Avance ${Math.abs(lastDev.deltaMinutes)} min`
    : '';

  const handleToggle = () => {
    if (active) {
      stopFollowing();
      onDisconnect();
    } else {
      startFollowing();
      onConnect();
    }
  };

  return (
    <div style={{ background: '#0a0a18', padding: '8px 16px', borderTop: '1px solid #333', display: 'flex', gap: 24, alignItems: 'center', fontSize: 12 }}>
      <button onClick={handleToggle}
        style={{ background: active ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: 4, fontWeight: 'bold' }}>
        {active ? 'ARRÊTER SUIVI' : 'SUIVIE EN COURSE'}
      </button>

      {!active && <span style={{ color: '#666' }}>Cliquez pour démarrer le suivi en temps réel</span>}

      {active && (
        <>
          <span style={{ color: connected ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
            {connected ? '● CONNECTÉ' : '● DÉCONNECTÉ'}
          </span>

          {data && (
            <>
              <span style={{ color: '#e0e0e0' }}>Position: <b>P{data.position}</b></span>
              <span style={{ color: '#e0e0e0' }}>Tour: <b>{data.currentLap}/{data.totalLaps}</b></span>
              <span style={{ color: '#e0e0e0' }}>Essence: <b>{data.fuelRemaining.toFixed(1)}L</b></span>
              <span style={{ color: '#e0e0e0' }}>Dernier: <b>{formatLapTime(data.lastLapTime)}</b></span>
              <span style={{ color: '#e0e0e0' }}>Meilleur: <b>{formatLapTime(data.bestLapTime)}</b></span>
              <span style={{ color: '#e0e0e0' }}>Piste: <b>{data.trackTemp}°C</b></span>
            </>
          )}

          {currentDriver && (
            <span style={{ color: currentDriver.color, fontWeight: 'bold' }}>
              Stint: {currentDriver.name}
            </span>
          )}

          {deltaText && (
            <span style={{ color: lastDev!.deltaMinutes > 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
              {deltaText}
            </span>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/LivePanel.tsx
git commit -m "feat: add live race panel with iRacing telemetry display"
```

---

### Task 20: App Shell + Integration

**Files:**
- Modify: `packages/client/src/App.tsx`
- Create: `packages/client/src/App.css`
- Create: `packages/client/src/components/global.css`

**Interfaces:**
- Consumes: all components (Tasks 10-19), all hooks (Tasks 6, 17)
- Produces: complete working application

- [ ] **Step 1: Create global styles**

```css
/* packages/client/src/components/global.css */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}

input, select, textarea, button {
  font-family: inherit;
  font-size: 12px;
  background: #1a1a2e;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 3px;
  padding: 3px 6px;
}

input:focus, select:focus, textarea:focus {
  outline: 1px solid #f5a623;
  border-color: #f5a623;
}

button:hover { opacity: 0.85; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0d0d1a; }
::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
```

- [ ] **Step 2: Create App.css**

```css
/* packages/client/src/App.css */
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app__timeline {
  flex: 1;
  min-height: 200px;
  position: relative;
}
```

- [ ] **Step 3: Wire up App.tsx**

```tsx
// packages/client/src/App.tsx
import './components/global.css';
import './App.css';
import { TopBar } from './components/TopBar';
import { ToolBar } from './components/ToolBar';
import { DriverBar } from './components/DriverBar';
import { TimelineCanvas } from './canvas/TimelineCanvas';
import { StintDetailPanel } from './components/StintDetailPanel';
import { StatusBar } from './components/StatusBar';
import { AlertPanel } from './components/AlertPanel';
import { LivePanel } from './components/LivePanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRaceStore } from './store/useRaceStore';

export function App() {
  const { send, connected } = useWebSocket('ws://localhost:3001');
  useAutoSave(send);
  useKeyboardShortcuts();

  const handleSave = () => {
    const s = useRaceStore.getState();
    send({
      type: 'save-plan',
      plan: { id: s.raceConfig.id, config: s.raceConfig, drivers: s.drivers, stints: s.stints, pitStops: s.pitStops, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
  };

  const handleExport = (format: 'pdf' | 'png' | 'csv') => {
    const s = useRaceStore.getState();
    send({
      type: 'export',
      format,
      plan: { id: s.raceConfig.id, config: s.raceConfig, drivers: s.drivers, stints: s.stints, pitStops: s.pitStops, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="app">
      <TopBar />
      <ToolBar onSave={handleSave} onExport={handleExport} />
      <DriverBar />
      <div className="app__timeline">
        <TimelineCanvas />
      </div>
      <LivePanel
        onConnect={() => send({ type: 'iracing-connect' })}
        onDisconnect={() => send({ type: 'iracing-disconnect' })}
      />
      <AlertPanel />
      <StintDetailPanel />
      <StatusBar />
    </div>
  );
}
```

- [ ] **Step 4: Verify everything runs**

Run: `npm run dev`
Expected: server starts on 3001, client on 3000, app displays dark theme with all panels.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/
git commit -m "feat: wire up complete app shell with all components"
```
