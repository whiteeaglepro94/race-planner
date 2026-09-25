# Phase 2 — Canvas (Tasks 6-10)

---

### Task 6: Client WebSocket Hook

**Files:**
- Create: `packages/client/src/hooks/useWebSocket.ts`
- Create: `packages/client/src/hooks/__tests__/useWebSocket.test.ts`

**Interfaces:**
- Consumes: `ClientMessage`, `ServerMessage` from `@race-planner/shared`
- Produces: `useWebSocket()` hook returning `{ send(msg: ClientMessage): void, connected: boolean }`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/hooks/__tests__/useWebSocket.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static instance: MockWebSocket;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1;
  send = vi.fn();
  close = vi.fn();
  constructor() { MockWebSocket.instance = this; }
}
vi.stubGlobal('WebSocket', MockWebSocket);

describe('useWebSocket', () => {
  it('connects and exposes send', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3001'));
    act(() => { MockWebSocket.instance.onopen?.(); });
    expect(result.current.connected).toBe(true);
    act(() => { result.current.send({ type: 'list-plans' }); });
    expect(MockWebSocket.instance.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'list-plans' })
    );
  });
});
```

- [ ] **Step 2: Implement**

```typescript
// packages/client/src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import type { ClientMessage, ServerMessage } from '@race-planner/shared';
import { useRaceStore } from '../store/useRaceStore';
import { useLiveStore } from '../store/useLiveStore';

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onmessage = (e) => {
        const msg: ServerMessage = JSON.parse(e.data);
        switch (msg.type) {
          case 'plan-loaded': {
            const { config, drivers, stints, pitStops } = msg.plan;
            const store = useRaceStore.getState();
            store.setConfig(config);
            store.setStints(stints);
            store.setPitStops(pitStops);
            drivers.forEach((d) => store.addDriver(d));
            break;
          }
          case 'iracing-data':
            useLiveStore.getState().setLiveData(msg.data);
            break;
          case 'iracing-status':
            useLiveStore.getState().setConnected(msg.connected);
            break;
        }
      };
    }
    connect();
    return () => { wsRef.current?.close(); };
  }, [url]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
```

- [ ] **Step 3: Run test, verify pass, commit**

```bash
git add packages/client/src/hooks/
git commit -m "feat: add WebSocket hook with auto-reconnect"
```

---

### Task 7: Canvas Viewport

**Files:**
- Create: `packages/client/src/canvas/viewport.ts`
- Create: `packages/client/src/canvas/__tests__/viewport.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Viewport` class with `worldToScreenX(minutes)`, `screenToWorldX(px)`, `zoom(delta, centerPx)`, `scroll(deltaPx)`, `offsetX`, `scale`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/canvas/__tests__/viewport.test.ts
import { describe, it, expect } from 'vitest';
import { Viewport } from '../viewport';

describe('Viewport', () => {
  it('converts world to screen coords', () => {
    const vp = new Viewport(0, 3, 1200);
    // minute 60 at scale 3 = pixel 180
    expect(vp.worldToScreenX(60)).toBe(180);
  });

  it('converts screen to world coords', () => {
    const vp = new Viewport(0, 3, 1200);
    expect(vp.screenToWorldX(180)).toBe(60);
  });

  it('handles scroll offset', () => {
    const vp = new Viewport(30, 3, 1200);
    // minute 60, offset 30 => (60-30)*3 = 90
    expect(vp.worldToScreenX(60)).toBe(90);
  });

  it('zooms centered on cursor', () => {
    const vp = new Viewport(0, 3, 1200);
    const worldBefore = vp.screenToWorldX(600);
    vp.zoom(1.5, 600);
    const worldAfter = vp.screenToWorldX(600);
    expect(Math.abs(worldBefore - worldAfter)).toBeLessThan(0.01);
    expect(vp.scale).toBe(4.5);
  });

  it('clamps scale to min/max', () => {
    const vp = new Viewport(0, 0.5, 1200);
    vp.zoom(0.1, 600);
    expect(vp.scale).toBeGreaterThanOrEqual(0.1);
    const vp2 = new Viewport(0, 50, 1200);
    vp2.zoom(100, 600);
    expect(vp2.scale).toBeLessThanOrEqual(60);
  });
});
```

- [ ] **Step 2: Implement**

```typescript
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

  zoom(newScale: number, centerPx: number): void {
    const worldCenter = this.screenToWorldX(centerPx);
    this.scale = Math.max(Viewport.MIN_SCALE, Math.min(Viewport.MAX_SCALE, newScale));
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
```

- [ ] **Step 3: Run test, verify pass, commit**

```bash
git add packages/client/src/canvas/
git commit -m "feat: add canvas viewport with zoom and coordinate transforms"
```

---

### Task 8: Canvas Background + Time Axis Layers

**Files:**
- Create: `packages/client/src/canvas/layers/background.ts`
- Create: `packages/client/src/canvas/layers/timeAxis.ts`
- Create: `packages/client/src/canvas/layers/sunMarkers.ts`
- Create: `packages/client/src/canvas/__tests__/layers.test.ts`

**Interfaces:**
- Consumes: `Viewport` from Task 7, `RaceConfig` from `@race-planner/shared`
- Produces: `drawBackground(ctx, viewport, config)`, `drawTimeAxis(ctx, viewport, config)`, `drawSunMarkers(ctx, viewport, config)`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/canvas/__tests__/layers.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Viewport } from '../viewport';
import { timeToMinutes } from '../layers/background';

describe('timeToMinutes', () => {
  it('converts HH:mm to minutes since midnight', () => {
    expect(timeToMinutes('16:00')).toBe(960);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('20:05')).toBe(1205);
  });

  it('handles cross-midnight offset', () => {
    // 02:00 next day relative to 16:00 start = 600 minutes
    const start = timeToMinutes('16:00');
    let target = timeToMinutes('02:00');
    if (target < start) target += 1440;
    expect(target - start).toBe(600);
  });
});
```

- [ ] **Step 2: Implement background.ts**

```typescript
// packages/client/src/canvas/layers/background.ts
import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  canvasHeight: number
): void {
  const startMin = timeToMinutes(config.startTime);
  let sunsetMin = timeToMinutes(config.sunsetTime);
  let sunriseMin = timeToMinutes(config.sunriseTime);

  if (sunsetMin < startMin) sunsetMin += 1440;
  if (sunriseMin < startMin) sunriseMin += 1440;
  if (sunriseMin < sunsetMin) sunriseMin += 1440;

  const sunsetOffset = sunsetMin - startMin;
  const sunriseOffset = sunriseMin - startMin;

  // Day
  const dayStartX = vp.worldToScreenX(0);
  const dayEndX = vp.worldToScreenX(sunsetOffset);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(dayStartX, 0, dayEndX - dayStartX, canvasHeight);

  // Night
  const nightEndX = vp.worldToScreenX(sunriseOffset);
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(dayEndX, 0, nightEndX - dayEndX, canvasHeight);

  // Day after sunrise
  const raceEndX = vp.worldToScreenX(config.durationMinutes);
  if (raceEndX > nightEndX) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(nightEndX, 0, raceEndX - nightEndX, canvasHeight);
  }

  // Night label
  const nightCenterX = (dayEndX + nightEndX) / 2;
  ctx.fillStyle = '#666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NUIT', nightCenterX, 20);
}
```

- [ ] **Step 3: Implement timeAxis.ts**

```typescript
// packages/client/src/canvas/layers/timeAxis.ts
import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';
import { timeToMinutes } from './background';

export function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  y: number
): void {
  const startMin = timeToMinutes(config.startTime);
  ctx.fillStyle = '#999';
  ctx.strokeStyle = '#333';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  const step = vp.scale < 1 ? 120 : vp.scale < 3 ? 60 : 30;

  for (let m = 0; m <= config.durationMinutes; m += step) {
    const x = vp.worldToScreenX(m);
    if (x < -50 || x > vp.canvasWidth + 50) continue;

    const absMin = (startMin + m) % 1440;
    const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mm = String(absMin % 60).padStart(2, '0');

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
    ctx.fillText(`${hh}:${mm}`, x, y - 4);
  }
}
```

- [ ] **Step 4: Implement sunMarkers.ts**

```typescript
// packages/client/src/canvas/layers/sunMarkers.ts
import type { Viewport } from '../viewport';
import type { RaceConfig } from '@race-planner/shared';
import { timeToMinutes } from './background';

export function drawSunMarkers(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  config: RaceConfig,
  y: number
): void {
  const startMin = timeToMinutes(config.startTime);
  let sunsetMin = timeToMinutes(config.sunsetTime);
  let sunriseMin = timeToMinutes(config.sunriseTime);
  if (sunsetMin < startMin) sunsetMin += 1440;
  if (sunriseMin < startMin) sunriseMin += 1440;
  if (sunriseMin < sunsetMin) sunriseMin += 1440;

  const sunsetX = vp.worldToScreenX(sunsetMin - startMin);
  const sunriseX = vp.worldToScreenX(sunriseMin - startMin);

  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';

  // Sunset
  ctx.fillStyle = '#f5a623';
  ctx.fillText('☾', sunsetX, y);
  ctx.font = '9px sans-serif';
  ctx.fillText(`coucher ${config.sunsetTime}`, sunsetX, y + 14);

  // Sunrise
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#f5d623';
  ctx.fillText('☀', sunriseX, y);
  ctx.font = '9px sans-serif';
  ctx.fillText(`lever ${config.sunriseTime}`, sunriseX, y + 14);
}
```

- [ ] **Step 5: Run test, verify pass, commit**

```bash
git add packages/client/src/canvas/layers/ packages/client/src/canvas/__tests__/
git commit -m "feat: add canvas background, time axis, and sun marker layers"
```

---

### Task 9: Canvas Stint Blocks + Pit Stops

**Files:**
- Create: `packages/client/src/canvas/layers/stintBlocks.ts`
- Create: `packages/client/src/canvas/layers/pitStops.ts`
- Create: `packages/client/src/canvas/__tests__/stintBlocks.test.ts`

**Interfaces:**
- Consumes: `Viewport` (Task 7), `Stint`, `Driver`, `PitStop` from shared
- Produces: `drawStintBlocks(ctx, vp, stints, drivers, selectedId, blockY, blockHeight)`, `drawPitStops(ctx, vp, pitStops, y)`, `getStintScreenRect(stint, vp, blockY, blockHeight): {x,y,w,h}`

- [ ] **Step 1: Write failing test**

```typescript
// packages/client/src/canvas/__tests__/stintBlocks.test.ts
import { describe, it, expect } from 'vitest';
import { getStintScreenRect } from '../layers/stintBlocks';
import { Viewport } from '../viewport';
import type { Stint } from '@race-planner/shared';

describe('getStintScreenRect', () => {
  const stint: Stint = {
    id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
    durationMinutes: 84, locked: false, tireCompound: 'dry',
    tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
  };

  it('calculates screen rectangle', () => {
    const vp = new Viewport(0, 3, 1200);
    const rect = getStintScreenRect(stint, vp, 100, 60, '16:00');
    expect(rect.x).toBe(0); // starts at minute 0
    expect(rect.w).toBe(84 * 3); // 252px
    expect(rect.y).toBe(100);
    expect(rect.h).toBe(60);
  });

  it('offsets correctly with viewport scroll', () => {
    const vp = new Viewport(30, 3, 1200);
    const rect = getStintScreenRect(stint, vp, 100, 60, '16:00');
    expect(rect.x).toBe(-90); // (0-30)*3
  });
});
```

- [ ] **Step 2: Implement stintBlocks.ts**

```typescript
// packages/client/src/canvas/layers/stintBlocks.ts
import type { Viewport } from '../viewport';
import type { Stint, Driver } from '@race-planner/shared';
import { timeToMinutes } from './background';

interface Rect { x: number; y: number; w: number; h: number; }

export function getStintScreenRect(
  stint: Stint, vp: Viewport, blockY: number, blockH: number, raceStartTime: string
): Rect {
  const startMin = timeToMinutes(raceStartTime);
  let stintStartMin = timeToMinutes(stint.startTime);
  if (stintStartMin < startMin) stintStartMin += 1440;
  const offsetMin = stintStartMin - startMin;
  const x = vp.worldToScreenX(offsetMin);
  const w = stint.durationMinutes * vp.scale;
  return { x, y: blockY, w, h: blockH };
}

export function drawStintBlocks(
  ctx: CanvasRenderingContext2D, vp: Viewport, stints: Stint[],
  drivers: Driver[], selectedId: string | null,
  blockY: number, blockH: number, raceStartTime: string
): void {
  for (const stint of stints) {
    const rect = getStintScreenRect(stint, vp, blockY, blockH, raceStartTime);
    if (rect.x + rect.w < 0 || rect.x > vp.canvasWidth) continue;

    const driver = drivers.find((d) => d.id === stint.driverId);
    const color = driver?.color ?? '#666';

    // Block fill
    ctx.fillStyle = color + 'CC';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    // Selection outline
    if (stint.id === selectedId) {
      ctx.strokeStyle = '#f5a623';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    // Lock icon
    if (stint.locked) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('🔒', rect.x + 4, rect.y + 14);
    }

    // Driver name + times
    if (rect.w > 40) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const cx = rect.x + rect.w / 2;
      ctx.fillText(driver?.name ?? '?', cx, rect.y + rect.h / 2 - 4);
      ctx.font = '9px sans-serif';
      ctx.fillText(`${stint.startTime}-${stint.endTime}`, cx, rect.y + rect.h / 2 + 10);
    }
  }
  ctx.textAlign = 'left';
}
```

- [ ] **Step 3: Implement pitStops.ts**

```typescript
// packages/client/src/canvas/layers/pitStops.ts
import type { Viewport } from '../viewport';
import type { PitStop } from '@race-planner/shared';
import { timeToMinutes } from './background';

export function drawPitStops(
  ctx: CanvasRenderingContext2D, vp: Viewport,
  pitStops: PitStop[], y: number, raceStartTime: string
): void {
  const startMin = timeToMinutes(raceStartTime);

  for (const pit of pitStops) {
    let pitMin = timeToMinutes(pit.time);
    if (pitMin < startMin) pitMin += 1440;
    const x = vp.worldToScreenX(pitMin - startMin);
    if (x < -20 || x > vp.canvasWidth + 20) continue;

    // Tire icon
    if (pit.tireChange) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(x - 6, y, 12, 12);
    }
    // Fuel icon
    if (pit.refuel) {
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(x - 6, y + 14, 12, 12);
    }

    ctx.fillStyle = '#888';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pit.time, x, y + 38);
  }
  ctx.textAlign = 'left';
}
```

- [ ] **Step 4: Run test, verify pass, commit**

```bash
git add packages/client/src/canvas/layers/ packages/client/src/canvas/__tests__/
git commit -m "feat: add canvas stint blocks and pit stop rendering layers"
```

---

### Task 10: Canvas Hit Test, Interactions + Renderer

**Files:**
- Create: `packages/client/src/canvas/hitTest.ts`
- Create: `packages/client/src/canvas/interaction.ts`
- Create: `packages/client/src/canvas/renderer.ts`
- Create: `packages/client/src/canvas/layers/cursor.ts`
- Create: `packages/client/src/canvas/TimelineCanvas.tsx`
- Create: `packages/client/src/canvas/__tests__/hitTest.test.ts`

**Interfaces:**
- Consumes: `Viewport` (Task 7), all layers (Tasks 8-9), `useRaceStore` (Task 3)
- Produces: `<TimelineCanvas />` React component, `findStintAt(x, y, vp, stints, raceStartTime, blockY, blockH): Stint|null`

- [ ] **Step 1: Write failing test for hitTest**

```typescript
// packages/client/src/canvas/__tests__/hitTest.test.ts
import { describe, it, expect } from 'vitest';
import { findStintAt } from '../hitTest';
import { Viewport } from '../viewport';
import type { Stint } from '@race-planner/shared';

describe('findStintAt', () => {
  const stints: Stint[] = [{
    id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
    durationMinutes: 84, locked: false, tireCompound: 'dry',
    tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
  }];

  it('finds stint under cursor', () => {
    const vp = new Viewport(0, 3, 1200);
    const hit = findStintAt(100, 130, vp, stints, '16:00', 100, 60);
    expect(hit?.id).toBe('st-1');
  });

  it('returns null when clicking empty area', () => {
    const vp = new Viewport(0, 3, 1200);
    const hit = findStintAt(800, 130, vp, stints, '16:00', 100, 60);
    expect(hit).toBeNull();
  });
});
```

- [ ] **Step 2: Implement hitTest.ts**

```typescript
// packages/client/src/canvas/hitTest.ts
import type { Viewport } from './viewport';
import type { Stint } from '@race-planner/shared';
import { getStintScreenRect } from './layers/stintBlocks';

export function findStintAt(
  px: number, py: number, vp: Viewport, stints: Stint[],
  raceStartTime: string, blockY: number, blockH: number
): Stint | null {
  for (let i = stints.length - 1; i >= 0; i--) {
    const rect = getStintScreenRect(stints[i], vp, blockY, blockH, raceStartTime);
    if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) {
      return stints[i];
    }
  }
  return null;
}

export function isOnRightEdge(
  px: number, py: number, vp: Viewport, stint: Stint,
  raceStartTime: string, blockY: number, blockH: number
): boolean {
  const rect = getStintScreenRect(stint, vp, blockY, blockH, raceStartTime);
  return px >= rect.x + rect.w - 6 && px <= rect.x + rect.w + 6
    && py >= rect.y && py <= rect.y + rect.h;
}
```

- [ ] **Step 3: Implement interaction.ts**

```typescript
// packages/client/src/canvas/interaction.ts
import { Viewport } from './viewport';
import { findStintAt, isOnRightEdge } from './hitTest';
import { useRaceStore } from '../store/useRaceStore';
import type { Stint } from '@race-planner/shared';

const BLOCK_Y = 100;
const BLOCK_H = 60;

interface DragState {
  active: boolean;
  stintId: string | null;
  mode: 'move' | 'resize' | 'scroll';
  startX: number;
  startMinutes: number;
}

let drag: DragState = { active: false, stintId: null, mode: 'scroll', startX: 0, startMinutes: 0 };

export function handleMouseDown(e: MouseEvent, vp: Viewport): void {
  const store = useRaceStore.getState();
  const stints = store.stints;
  const startTime = store.raceConfig.startTime;
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  if (e.button === 1) {
    drag = { active: true, stintId: null, mode: 'scroll', startX: e.clientX, startMinutes: vp.offsetX };
    return;
  }

  const hit = findStintAt(px, py, vp, stints, startTime, BLOCK_Y, BLOCK_H);
  if (hit) {
    store.selectStint(hit.id);
    if (isOnRightEdge(px, py, vp, hit, startTime, BLOCK_Y, BLOCK_H)) {
      drag = { active: true, stintId: hit.id, mode: 'resize', startX: px, startMinutes: hit.durationMinutes };
    } else {
      const offsetMin = vp.screenToWorldX(px);
      drag = { active: true, stintId: hit.id, mode: 'move', startX: px, startMinutes: offsetMin };
    }
  } else {
    store.selectStint(null);
  }
}

export function handleMouseMove(e: MouseEvent, vp: Viewport): void {
  if (!drag.active) return;
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;

  if (drag.mode === 'scroll') {
    const delta = e.clientX - drag.startX;
    vp.offsetX = drag.startMinutes - delta / vp.scale;
    return;
  }

  if (drag.mode === 'resize' && drag.stintId) {
    const deltaPx = px - drag.startX;
    const deltaMin = deltaPx / vp.scale;
    const newDuration = Math.max(10, Math.round(drag.startMinutes + deltaMin));
    useRaceStore.getState().updateStint(drag.stintId, { durationMinutes: newDuration });
  }
}

export function handleMouseUp(): void {
  drag = { active: false, stintId: null, mode: 'scroll', startX: 0, startMinutes: 0 };
}

export function handleWheel(e: WheelEvent, vp: Viewport): void {
  e.preventDefault();
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  vp.zoom(vp.scale * factor, px);
}

export function handleDblClick(e: MouseEvent, vp: Viewport): void {
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const store = useRaceStore.getState();
  const hit = findStintAt(px, py, vp, store.stints, store.raceConfig.startTime, BLOCK_Y, BLOCK_H);

  if (!hit) {
    const worldMin = vp.screenToWorldX(px);
    const startMin = Math.round(worldMin);
    const raceStartTotalMin = parseInt(store.raceConfig.startTime.split(':')[0]) * 60
      + parseInt(store.raceConfig.startTime.split(':')[1]);
    const absMin = (raceStartTotalMin + startMin) % 1440;
    const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mm = String(absMin % 60).padStart(2, '0');
    const endAbsMin = absMin + 60;
    const ehh = String(Math.floor(endAbsMin / 60) % 24).padStart(2, '0');
    const emm = String(endAbsMin % 60).padStart(2, '0');

    const newStint: Stint = {
      id: crypto.randomUUID(),
      driverId: store.drivers[0]?.id ?? '',
      startTime: `${hh}:${mm}`,
      endTime: `${ehh}:${emm}`,
      durationMinutes: 60,
      locked: false,
      tireCompound: 'dry',
      tireCondition: 'new',
      fuelLoads: 1,
      notes: '',
      order: store.stints.length,
    };
    store.addStint(newStint);
    store.selectStint(newStint.id);
  }
}
```

- [ ] **Step 4: Implement cursor.ts**

```typescript
// packages/client/src/canvas/layers/cursor.ts
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
```

- [ ] **Step 5: Implement renderer.ts**

```typescript
// packages/client/src/canvas/renderer.ts
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
```

- [ ] **Step 6: Implement TimelineCanvas.tsx**

```typescript
// packages/client/src/canvas/TimelineCanvas.tsx
import { useRef, useEffect } from 'react';
import { RaceTimelineRenderer } from './renderer';
import { handleMouseDown, handleMouseUp, handleMouseMove, handleWheel, handleDblClick } from './interaction';

export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RaceTimelineRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new RaceTimelineRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const parent = canvas.parentElement!;
      renderer.resize(parent.clientWidth, 220);
    };
    resize();
    window.addEventListener('resize', resize);

    const onDown = (e: MouseEvent) => handleMouseDown(e, renderer.viewport);
    const onMove = (e: MouseEvent) => handleMouseMove(e, renderer.viewport);
    const onUp = () => handleMouseUp();
    const onWheel = (e: WheelEvent) => handleWheel(e, renderer.viewport);
    const onDbl = (e: MouseEvent) => handleDblClick(e, renderer.viewport);

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDbl);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDbl);
    };
  }, []);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'default' }} />
    </div>
  );
}
```

- [ ] **Step 7: Run tests, verify pass, commit**

```bash
git add packages/client/src/canvas/
git commit -m "feat: add canvas renderer with hit testing, interactions, and timeline component"
```
