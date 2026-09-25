# Phase 3 — UI + Automation (Tasks 11-15)

---

### Task 11: TopBar Component

**Files:**
- Create: `packages/client/src/components/TopBar.tsx`

**Interfaces:**
- Consumes: `useRaceStore` (Task 3), `RaceConfig` from shared
- Produces: `<TopBar />` — editable race config fields

- [ ] **Step 1: Implement TopBar**

```tsx
// packages/client/src/components/TopBar.tsx
import { useRaceStore } from '../store/useRaceStore';

const PRESETS = [
  { label: '3 h', minutes: 180 },
  { label: '6 h', minutes: 360 },
  { label: '24 h', minutes: 1440 },
];

export function TopBar() {
  const config = useRaceStore((s) => s.raceConfig);
  const setConfig = useRaceStore((s) => s.setConfig);
  const driverCount = useRaceStore((s) => s.drivers.length);

  return (
    <div style={{ display: 'flex', gap: 16, padding: '8px 16px', background: '#12121f', borderBottom: '1px solid #333', alignItems: 'center', flexWrap: 'wrap' }}>
      <Field label="SIMULATEUR">
        <input value={config.simulator} onChange={(e) => setConfig({ simulator: e.target.value })} />
      </Field>
      <Field label="CIRCUIT">
        <input value={config.circuit} onChange={(e) => setConfig({ circuit: e.target.value })} />
      </Field>
      <Field label="VOITURE">
        <input value={config.car} onChange={(e) => setConfig({ car: e.target.value })} />
      </Field>
      <Field label="DURÉE">
        <div style={{ display: 'flex', gap: 4 }}>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setConfig({ durationMinutes: p.minutes })}
              style={{ background: config.durationMinutes === p.minutes ? '#f5a623' : '#2a2a3e', color: '#e0e0e0', border: 'none', padding: '2px 8px', cursor: 'pointer', borderRadius: 3 }}>
              {p.label}
            </button>
          ))}
          <input type="number" value={config.durationMinutes} onChange={(e) => setConfig({ durationMinutes: Number(e.target.value) })}
            style={{ width: 60 }} />
        </div>
      </Field>
      <Field label="DÉPART EN JEU (HORLOGE SIM)">
        <input type="time" value={config.startTime} onChange={(e) => setConfig({ startTime: e.target.value })}
          style={{ fontSize: 18, fontWeight: 'bold' }} />
      </Field>
      <Field label="ÉQUIPAGE">
        <span style={{ fontSize: 16 }}>{driverCount} pilotes</span>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/TopBar.tsx
git commit -m "feat: add TopBar component with race config editing"
```

---

### Task 12: DriverBar Component

**Files:**
- Create: `packages/client/src/components/DriverBar.tsx`
- Create: `packages/client/src/components/DriverChip.tsx`

**Interfaces:**
- Consumes: `useRaceStore` (Task 3), `Driver` from shared
- Produces: `<DriverBar />` — driver list with add/remove/color

- [ ] **Step 1: Implement DriverChip**

```tsx
// packages/client/src/components/DriverChip.tsx
import { useState } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import type { Driver } from '@race-planner/shared';

export function DriverChip({ driver }: { driver: Driver }) {
  const updateDriver = useRaceStore((s) => s.updateDriver);
  const removeDriver = useRaceStore((s) => s.removeDriver);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(driver.name);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: driver.color + '33', border: `2px solid ${driver.color}`, borderRadius: 4 }}>
      <input type="color" value={driver.color} onChange={(e) => updateDriver(driver.id, { color: e.target.value })}
        style={{ width: 16, height: 16, border: 'none', cursor: 'pointer', padding: 0 }} />
      {editing ? (
        <input value={name} onChange={(e) => setName(e.target.value)}
          onBlur={() => { updateDriver(driver.id, { name }); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { updateDriver(driver.id, { name }); setEditing(false); } }}
          autoFocus style={{ width: 80, background: 'transparent', color: '#e0e0e0', border: 'none', outline: 'none' }} />
      ) : (
        <span onDoubleClick={() => setEditing(true)} style={{ color: '#e0e0e0', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
          ≡ {driver.name}
        </span>
      )}
      <button onClick={() => removeDriver(driver.id)}
        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>×</button>
    </div>
  );
}
```

- [ ] **Step 2: Implement DriverBar**

```tsx
// packages/client/src/components/DriverBar.tsx
import { useRaceStore } from '../store/useRaceStore';
import { DriverChip } from './DriverChip';

const DEFAULT_COLORS = ['#4CAF50', '#9C27B0', '#FFC107', '#E91E63', '#00BCD4', '#FF5722'];

export function DriverBar() {
  const drivers = useRaceStore((s) => s.drivers);
  const addDriver = useRaceStore((s) => s.addDriver);

  const handleAdd = () => {
    const color = DEFAULT_COLORS[drivers.length % DEFAULT_COLORS.length];
    addDriver({ id: crypto.randomUUID(), name: `Pilote ${drivers.length + 1}`, color });
  };

  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Pilotes</span>
      {drivers.map((d) => <DriverChip key={d.id} driver={d} />)}
      <button onClick={handleAdd}
        style={{ background: '#2a2a3e', color: '#e0e0e0', border: '1px dashed #555', padding: '4px 12px', cursor: 'pointer', borderRadius: 4 }}>
        + Ajouter
      </button>
      <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>
        glisse un pilote sur un relais pour l'y affecter
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/DriverBar.tsx packages/client/src/components/DriverChip.tsx
git commit -m "feat: add DriverBar with color picker, rename, add/remove"
```

---

### Task 13: StintDetailPanel Component

**Files:**
- Create: `packages/client/src/components/StintDetailPanel.tsx`

**Interfaces:**
- Consumes: `useRaceStore` (Task 3), `Stint`, `Driver` from shared
- Produces: `<StintDetailPanel />` — detail editor for selected stint

- [ ] **Step 1: Implement**

```tsx
// packages/client/src/components/StintDetailPanel.tsx
import { useRaceStore } from '../store/useRaceStore';

export function StintDetailPanel() {
  const selectedId = useRaceStore((s) => s.selectedStintId);
  const stint = useRaceStore((s) => s.stints.find((st) => st.id === s.selectedStintId));
  const drivers = useRaceStore((s) => s.drivers);
  const updateStint = useRaceStore((s) => s.updateStint);
  const driver = drivers.find((d) => d.id === stint?.driverId);

  if (!stint || !selectedId) {
    return (
      <div style={{ padding: 16, color: '#666', background: '#12121f', borderTop: '1px solid #333' }}>
        Sélectionnez un relais sur la frise
      </div>
    );
  }

  const update = (partial: Record<string, unknown>) => updateStint(selectedId, partial);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, padding: 16, background: '#12121f', borderTop: '1px solid #333' }}>
      <Section title="RELAIS SÉLECTIONNÉ" accent={driver?.color}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>{driver?.name} · {stint.startTime} → {stint.endTime}</div>
        <div style={{ fontSize: 11, color: '#888' }}>relais {stint.locked ? 'verrouillé' : 'simple'}</div>
      </Section>

      <Section title="PILOTE">
        <select value={stint.driverId} onChange={(e) => update({ driverId: e.target.value })}>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Section>

      <Section title="PNEUS PRÉVUS">
        <select value={stint.tireCompound} onChange={(e) => update({ tireCompound: e.target.value })}>
          <option value="dry">Secs</option>
          <option value="wet">Pluie</option>
          <option value="intermediate">Intermédiaires</option>
        </select>
        <select value={stint.tireCondition} onChange={(e) => update({ tireCondition: e.target.value })}>
          <option value="new">Train neuf</option>
          <option value="used">Usagés</option>
        </select>
      </Section>

      <Section title="CARBURANT">
        <label>
          Pleins: <input type="number" value={stint.fuelLoads} min={0}
            onChange={(e) => update({ fuelLoads: Number(e.target.value) })} style={{ width: 40 }} />
        </label>
      </Section>

      <Section title="CHRONO CIBLE">
        <input type="number" step={0.1} value={stint.targetLapTimeSeconds ?? ''}
          placeholder="sec" onChange={(e) => update({ targetLapTimeSeconds: e.target.value ? Number(e.target.value) : undefined })}
          style={{ width: 70 }} />
      </Section>

      <Section title="BRIEF DE PASSATION">
        <textarea value={stint.notes} onChange={(e) => update({ notes: e.target.value })}
          rows={2} style={{ width: '100%', background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #333', resize: 'vertical' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <input type="checkbox" checked={stint.locked} onChange={(e) => update({ locked: e.target.checked })} />
          Verrouillé
        </label>
      </Section>
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: accent ? `3px solid ${accent}` : undefined, paddingLeft: accent ? 8 : 0 }}>
      <div style={{ fontSize: 9, color: '#f5a623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/client/src/components/StintDetailPanel.tsx
git commit -m "feat: add stint detail panel with tire, fuel, notes, lock editing"
```

---

### Task 14: Automation Engine

**Files:**
- Create: `packages/shared/src/automation/distribute.ts`
- Create: `packages/shared/src/automation/autofill.ts`
- Create: `packages/shared/src/automation/recalculate.ts`
- Create: `packages/shared/src/automation/validate.ts`
- Create: `packages/shared/src/automation/pitEstimate.ts`
- Create: `packages/shared/src/__tests__/automation.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: `RaceConfig`, `Driver`, `Stint`, `PitStop`, `PlanAlert`, `RacePlan` from shared (Task 2)
- Produces: `distributeStints(drivers, config, lockedStints): Stint[]`, `autofillGaps(stints, drivers, config): Stint[]`, `recalculateAfter(index, stints, config): Stint[]`, `validatePlan(plan): PlanAlert[]`, `estimatePitStops(config): number`

- [ ] **Step 1: Write failing tests**

```typescript
// packages/shared/src/__tests__/automation.test.ts
import { describe, it, expect } from 'vitest';
import { distributeStints } from '../automation/distribute';
import { autofillGaps } from '../automation/autofill';
import { recalculateAfter } from '../automation/recalculate';
import { validatePlan } from '../automation/validate';
import { estimatePitStops } from '../automation/pitEstimate';
import type { RaceConfig, Driver, Stint, RacePlan } from '../models';

const config: RaceConfig = {
  id: 'cfg-1', name: 'Test', simulator: 'Test', circuit: 'Test', car: 'Test',
  durationMinutes: 360, startTime: '14:00', sunsetTime: '20:00', sunriseTime: '06:00',
  mode: 'duration', pitStopDurationSeconds: 60, fuelCapacity: 100,
  fuelPerLap: 3.5, avgLapTimeSeconds: 120,
};

const drivers: Driver[] = [
  { id: 'drv-1', name: 'A', color: '#f00' },
  { id: 'drv-2', name: 'B', color: '#0f0' },
];

describe('distributeStints', () => {
  it('fills race duration equally between drivers', () => {
    const stints = distributeStints(drivers, config, []);
    const totalMin = stints.reduce((sum, s) => sum + s.durationMinutes, 0);
    expect(totalMin).toBeGreaterThanOrEqual(config.durationMinutes - 10);
    expect(totalMin).toBeLessThanOrEqual(config.durationMinutes + 10);
    const drvA = stints.filter((s) => s.driverId === 'drv-1');
    const drvB = stints.filter((s) => s.driverId === 'drv-2');
    expect(Math.abs(drvA.length - drvB.length)).toBeLessThanOrEqual(1);
  });

  it('respects locked stints', () => {
    const locked: Stint[] = [{
      id: 'locked-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:30',
      durationMinutes: 90, locked: true, tireCompound: 'dry', tireCondition: 'new',
      fuelLoads: 1, notes: '', order: 0,
    }];
    const stints = distributeStints(drivers, config, locked);
    expect(stints.find((s) => s.id === 'locked-1')).toBeDefined();
  });
});

describe('autofillGaps', () => {
  it('fills gap between stints', () => {
    const stints: Stint[] = [
      { id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 0 },
      { id: 'st-2', driverId: 'drv-2', startTime: '16:00', endTime: '17:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 2 },
    ];
    const filled = autofillGaps(stints, drivers, config);
    expect(filled.length).toBe(3);
    expect(filled[1].startTime).toBe('15:00');
    expect(filled[1].endTime).toBe('16:00');
  });
});

describe('recalculateAfter', () => {
  it('cascades time changes', () => {
    const stints: Stint[] = [
      { id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:30', durationMinutes: 90, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 0 },
      { id: 'st-2', driverId: 'drv-2', startTime: '15:30', endTime: '17:00', durationMinutes: 90, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 1 },
    ];
    stints[0].durationMinutes = 120;
    const result = recalculateAfter(0, stints, config);
    expect(result[0].endTime).toBe('16:00');
    expect(result[1].startTime).toBe('16:01'); // +1 min pit
  });
});

describe('validatePlan', () => {
  it('detects gap', () => {
    const plan: RacePlan = {
      id: 'p-1', config, drivers,
      stints: [
        { id: 'st-1', driverId: 'drv-1', startTime: '14:00', endTime: '15:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 0 },
        { id: 'st-2', driverId: 'drv-2', startTime: '16:00', endTime: '17:00', durationMinutes: 60, locked: false, tireCompound: 'dry', tireCondition: 'new', fuelLoads: 1, notes: '', order: 1 },
      ],
      pitStops: [],
      createdAt: '', updatedAt: '',
    };
    const alerts = validatePlan(plan);
    expect(alerts.some((a) => a.severity === 'warning' && a.message.includes('trou'))).toBe(true);
  });
});

describe('estimatePitStops', () => {
  it('calculates from fuel', () => {
    const count = estimatePitStops(config);
    // 360min * 60 / 120s = 180 laps. 100/3.5 = 28.57 laps/tank. 180/28.57 = 6.3 => 6 stops
    expect(count).toBe(6);
  });
});
```

- [ ] **Step 2: Implement all automation modules**

```typescript
// packages/shared/src/automation/pitEstimate.ts
import type { RaceConfig } from '../models.js';

export function estimatePitStops(config: RaceConfig): number {
  const totalLaps = (config.durationMinutes * 60) / config.avgLapTimeSeconds;
  const lapsPerTank = config.fuelCapacity / config.fuelPerLap;
  return Math.ceil(totalLaps / lapsPerTank) - 1;
}
```

```typescript
// packages/shared/src/automation/distribute.ts
import type { RaceConfig, Driver, Stint } from '../models.js';
import { addMinutesToTime } from './recalculate.js';

export function distributeStints(drivers: Driver[], config: RaceConfig, lockedStints: Stint[]): Stint[] {
  const lockedTime = lockedStints.reduce((s, st) => s + st.durationMinutes, 0);
  const remaining = config.durationMinutes - lockedTime;
  const stintTarget = 90;
  const stintCount = Math.max(drivers.length, Math.round(remaining / stintTarget));
  const stintDuration = Math.floor(remaining / stintCount);

  const result: Stint[] = [...lockedStints];
  let currentTime = config.startTime;

  // Skip past locked stints at the start
  const sortedLocked = [...lockedStints].sort((a, b) => a.order - b.order);
  if (sortedLocked.length > 0) {
    const lastLocked = sortedLocked[sortedLocked.length - 1];
    currentTime = addMinutesToTime(lastLocked.endTime, 1);
  }

  for (let i = 0; i < stintCount; i++) {
    const driver = drivers[i % drivers.length];
    const duration = i === stintCount - 1 ? remaining - stintDuration * (stintCount - 1) : stintDuration;
    const endTime = addMinutesToTime(currentTime, duration);
    result.push({
      id: crypto.randomUUID(),
      driverId: driver.id,
      startTime: currentTime,
      endTime,
      durationMinutes: duration,
      locked: false,
      tireCompound: 'dry',
      tireCondition: i % 2 === 0 ? 'new' : 'used',
      fuelLoads: 1,
      notes: '',
      order: lockedStints.length + i,
    });
    currentTime = addMinutesToTime(endTime, 1); // 1 min pit
  }

  return result.sort((a, b) => a.order - b.order);
}
```

```typescript
// packages/shared/src/automation/recalculate.ts
import type { RaceConfig, Stint } from '../models.js';

export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + minutes) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function recalculateAfter(index: number, stints: Stint[], config: RaceConfig): Stint[] {
  const result = [...stints];
  const pitMin = Math.ceil(config.pitStopDurationSeconds / 60);

  // Fix endTime of modified stint
  result[index] = {
    ...result[index],
    endTime: addMinutesToTime(result[index].startTime, result[index].durationMinutes),
  };

  // Cascade
  for (let i = index + 1; i < result.length; i++) {
    if (result[i].locked) continue;
    const prevEnd = result[i - 1].endTime;
    const newStart = addMinutesToTime(prevEnd, pitMin);
    result[i] = {
      ...result[i],
      startTime: newStart,
      endTime: addMinutesToTime(newStart, result[i].durationMinutes),
    };
  }

  return result;
}
```

```typescript
// packages/shared/src/automation/autofill.ts
import type { RaceConfig, Driver, Stint } from '../models.js';
import { addMinutesToTime } from './recalculate.js';

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function autofillGaps(stints: Stint[], drivers: Driver[], config: RaceConfig): Stint[] {
  if (stints.length === 0) return stints;
  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const result: Stint[] = [];

  // Calculate time per driver to find least-used
  const driverTime = new Map<string, number>();
  drivers.forEach((d) => driverTime.set(d.id, 0));
  sorted.forEach((s) => driverTime.set(s.driverId, (driverTime.get(s.driverId) ?? 0) + s.durationMinutes));

  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1) {
      const gapStart = sorted[i].endTime;
      const gapEnd = sorted[i + 1].startTime;
      const gapMin = timeToMin(gapEnd) - timeToMin(gapStart);
      if (gapMin > 1) {
        const leastUsed = [...driverTime.entries()].sort((a, b) => a[1] - b[1])[0][0];
        const fill: Stint = {
          id: crypto.randomUUID(),
          driverId: leastUsed,
          startTime: gapStart,
          endTime: gapEnd,
          durationMinutes: gapMin,
          locked: false,
          tireCompound: 'dry',
          tireCondition: 'new',
          fuelLoads: 1,
          notes: '',
          order: sorted[i].order + 0.5,
        };
        result.push(fill);
        driverTime.set(leastUsed, (driverTime.get(leastUsed) ?? 0) + gapMin);
      }
    }
  }

  // Re-order
  return result.sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }));
}
```

```typescript
// packages/shared/src/automation/validate.ts
import type { RacePlan, PlanAlert } from '../models.js';

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function validatePlan(plan: RacePlan): PlanAlert[] {
  const alerts: PlanAlert[] = [];
  const { config, drivers, stints } = plan;
  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const startMin = timeToMin(config.startTime);

  // Per-driver time check
  const driverTime = new Map<string, number>();
  for (const s of sorted) {
    driverTime.set(s.driverId, (driverTime.get(s.driverId) ?? 0) + s.durationMinutes);
  }
  for (const d of drivers) {
    const total = driverTime.get(d.id) ?? 0;
    if (d.maxDriveTimeMinutes && total > d.maxDriveTimeMinutes) {
      alerts.push({ severity: 'error', driverId: d.id, message: `${d.name} dépasse la durée max (${total} > ${d.maxDriveTimeMinutes} min)` });
    }
  }

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];

    // Stint too short
    if (s.durationMinutes < 20) {
      alerts.push({ severity: 'warning', stintId: s.id, message: `Relais trop court (${s.durationMinutes} min)` });
    }
    // Stint too long
    if (s.durationMinutes > 180) {
      alerts.push({ severity: 'warning', stintId: s.id, message: `Relais trop long (${s.durationMinutes} min)` });
    }

    // Stint exceeds race end
    let stintEndMin = timeToMin(s.endTime);
    if (stintEndMin < startMin) stintEndMin += 1440;
    const raceEndMin = startMin + config.durationMinutes;
    if (stintEndMin > raceEndMin) {
      alerts.push({ severity: 'error', stintId: s.id, message: `Relais dépasse la fin de course` });
    }

    // Gap detection
    if (i > 0) {
      const prev = sorted[i - 1];
      let prevEndMin = timeToMin(prev.endTime);
      let curStartMin = timeToMin(s.startTime);
      if (prevEndMin < startMin) prevEndMin += 1440;
      if (curStartMin < startMin) curStartMin += 1440;
      const gap = curStartMin - prevEndMin;
      if (gap > 2) {
        alerts.push({ severity: 'warning', message: `Trou de ${gap} min entre ${prev.endTime} et ${s.startTime}` });
      }
    }
  }

  // Total duration check
  const totalStintMin = sorted.reduce((s, st) => s + st.durationMinutes, 0);
  if (Math.abs(totalStintMin - config.durationMinutes) > 10) {
    alerts.push({ severity: 'warning', message: `Durée totale relais (${totalStintMin} min) ≠ durée course (${config.durationMinutes} min)` });
  }

  return alerts;
}
```

- [ ] **Step 3: Update barrel export**

Add to `packages/shared/src/index.ts`:
```typescript
export { distributeStints } from './automation/distribute.js';
export { autofillGaps } from './automation/autofill.js';
export { recalculateAfter, addMinutesToTime } from './automation/recalculate.js';
export { validatePlan } from './automation/validate.js';
export { estimatePitStops } from './automation/pitEstimate.js';
```

- [ ] **Step 4: Run tests, verify pass, commit**

```bash
git add packages/shared/src/automation/ packages/shared/src/__tests__/automation.test.ts packages/shared/src/index.ts
git commit -m "feat: add automation engine (distribute, autofill, recalculate, validate, pit estimate)"
```

---

### Task 15: ToolBar + StatusBar + AlertPanel

**Files:**
- Create: `packages/client/src/components/ToolBar.tsx`
- Create: `packages/client/src/components/StatusBar.tsx`
- Create: `packages/client/src/components/AlertPanel.tsx`

**Interfaces:**
- Consumes: `useRaceStore` (Task 3), automation functions from shared (Task 14)
- Produces: `<ToolBar />`, `<StatusBar />`, `<AlertPanel />`

- [ ] **Step 1: Implement ToolBar**

```tsx
// packages/client/src/components/ToolBar.tsx
import { useRaceStore } from '../store/useRaceStore';
import { distributeStints, autofillGaps, validatePlan } from '@race-planner/shared';

export function ToolBar({ onSave, onExport }: { onSave: () => void; onExport: (format: 'pdf' | 'png' | 'csv') => void }) {
  const store = useRaceStore.getState;
  const setStints = useRaceStore((s) => s.setStints);
  const setAlerts = useRaceStore((s) => s.setAlerts);

  const handleDistribute = () => {
    const { drivers, raceConfig, stints } = store();
    const locked = stints.filter((s) => s.locked);
    const result = distributeStints(drivers, raceConfig, locked);
    setStints(result);
  };

  const handleAutofill = () => {
    const { stints, drivers, raceConfig } = store();
    setStints(autofillGaps(stints, drivers, raceConfig));
  };

  const handleValidate = () => {
    const s = store();
    const alerts = validatePlan({ id: s.raceConfig.id, config: s.raceConfig, drivers: s.drivers, stints: s.stints, pitStops: s.pitStops, createdAt: '', updatedAt: '' });
    setAlerts(alerts);
  };

  const handleClear = () => {
    const { stints } = store();
    const locked = stints.filter((s) => s.locked);
    setStints(locked);
  };

  const btn = { background: '#2a2a3e', color: '#e0e0e0', border: '1px solid #444', padding: '6px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 12 };

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 16px', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
      <span style={{ color: '#888', fontSize: 11, alignSelf: 'center' }}>Plan de course</span>
      <button style={{ ...btn, background: '#2d4a2d' }} onClick={handleDistribute}>⟳ Volant équilibré</button>
      <button style={{ ...btn, background: '#4a2d2d' }} onClick={handleAutofill}>↯ Remplissage auto</button>
      <button style={btn} onClick={handleValidate}>✓ Vérifier</button>
      <button style={btn} onClick={handleClear}>✕ Tout effacer</button>
      <div style={{ flex: 1 }} />
      <button style={btn} onClick={() => onExport('pdf')}>Export PDF</button>
      <button style={btn} onClick={() => onExport('csv')}>Export CSV</button>
      <button style={btn} onClick={onSave}>Sauvegarder</button>
    </div>
  );
}
```

- [ ] **Step 2: Implement StatusBar**

```tsx
// packages/client/src/components/StatusBar.tsx
import { useRaceStore } from '../store/useRaceStore';

export function StatusBar() {
  const drivers = useRaceStore((s) => s.drivers);
  const stints = useRaceStore((s) => s.stints);
  const config = useRaceStore((s) => s.raceConfig);

  return (
    <div style={{ display: 'flex', gap: 16, padding: '6px 16px', background: '#0d0d1a', borderTop: '1px solid #333', fontSize: 11, color: '#aaa', overflowX: 'auto' }}>
      {drivers.map((d) => {
        const driverStints = stints.filter((s) => s.driverId === d.id);
        const totalMin = driverStints.reduce((sum, s) => sum + s.durationMinutes, 0);
        const hh = Math.floor(totalMin / 60);
        const mm = totalMin % 60;
        const maxMin = config.durationMinutes / drivers.length;
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: `3px solid ${d.color}`, paddingLeft: 6 }}>
            <span style={{ fontWeight: 'bold', color: d.color }}>{d.name}</span>
            <span>{hh} h {String(mm).padStart(2, '0')}</span>
            <span>/ max {Math.floor(maxMin / 60)} h</span>
            <span>{driverStints.length} relais</span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Implement AlertPanel**

```tsx
// packages/client/src/components/AlertPanel.tsx
import { useState } from 'react';
import { useRaceStore } from '../store/useRaceStore';

const SEVERITY_COLORS = { error: '#e74c3c', warning: '#f5a623', info: '#3498db' };

export function AlertPanel() {
  const alerts = useRaceStore((s) => s.alerts);
  const [open, setOpen] = useState(false);

  if (alerts.length === 0) return null;

  return (
    <div style={{ background: '#1a1a2e', borderTop: '1px solid #333' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', color: '#f5a623', padding: '4px 16px', cursor: 'pointer', textAlign: 'left', fontSize: 11 }}>
        {alerts.length} alerte{alerts.length > 1 ? 's' : ''} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{ padding: '0 16px 8px', maxHeight: 150, overflowY: 'auto' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 11, padding: '2px 0', color: SEVERITY_COLORS[a.severity] }}>
              [{a.severity.toUpperCase()}] {a.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/components/ToolBar.tsx packages/client/src/components/StatusBar.tsx packages/client/src/components/AlertPanel.tsx
git commit -m "feat: add toolbar, status bar, and alert panel components"
```
