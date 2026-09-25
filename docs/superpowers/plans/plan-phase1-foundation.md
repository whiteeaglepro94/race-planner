# Phase 1 — Foundation (Tasks 1-5)

---

### Task 1: Monorepo Scaffolding

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/src/index.ts`
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/index.html`
- Create: `packages/client/src/main.tsx`
- Create: `packages/client/src/App.tsx`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: working monorepo where `npm install` and `npm run build` succeed across all packages

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "race-planner",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Create packages/shared**

`packages/shared/package.json`:
```json
{
  "name": "@race-planner/shared",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "dependencies": {
    "zod": "^3.24.0"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

`packages/shared/src/index.ts`:
```typescript
export {};
```

- [ ] **Step 5: Create packages/server**

`packages/server/package.json`:
```json
{
  "name": "@race-planner/server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@race-planner/shared": "workspace:*",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "@types/ws": "^8.5.0",
    "vitest": "^3.0.0"
  }
}
```

`packages/server/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

`packages/server/src/index.ts`:
```typescript
console.log('Race Planner Server starting...');
```

- [ ] **Step 6: Create packages/client**

`packages/client/package.json`:
```json
{
  "name": "@race-planner/client",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "preview": "vite preview"
  },
  "dependencies": {
    "@race-planner/shared": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0",
    "jsdom": "^25.0.0"
  }
}
```

`packages/client/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

`packages/client/vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
```

`packages/client/index.html`:
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Race Planner</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

`packages/client/src/main.tsx`:
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`packages/client/src/App.tsx`:
```typescript
export function App() {
  return <div style={{ background: '#1a1a2e', color: '#e0e0e0', minHeight: '100vh' }}>Race Planner</div>;
}
```

- [ ] **Step 7: Install and verify**

Run: `npm install`
Run: `npm run build`
Expected: all three packages build without errors.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold monorepo with shared, server, and client packages"
```

---

### Task 2: Shared Data Models + Zod Schemas

**Files:**
- Create: `packages/shared/src/models.ts`
- Create: `packages/shared/src/schema.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `packages/shared/src/__tests__/schema.test.ts`

**Interfaces:**
- Consumes: monorepo structure from Task 1
- Produces: all TypeScript interfaces and Zod schemas — `RaceConfig`, `Driver`, `Stint`, `PitStop`, `RacePlan`, `LiveRaceData`, `LiveState`, `StintDeviation`, `PlanAlert`, `AlertSeverity`, `ClientMessage`, `ServerMessage`, `PlanSummary`

- [ ] **Step 1: Write failing test for schemas**

`packages/shared/src/__tests__/schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { RaceConfigSchema, DriverSchema, StintSchema, PitStopSchema, RacePlanSchema } from '../schema';

describe('RaceConfigSchema', () => {
  it('validates a correct race config', () => {
    const config = {
      id: crypto.randomUUID(),
      name: '24 Heures du Mans',
      simulator: 'Le Mans Ultimate',
      circuit: 'Circuit de la Sarthe',
      car: 'Toyota TR010 Hybrid',
      durationMinutes: 1440,
      startTime: '16:00',
      sunsetTime: '20:05',
      sunriseTime: '07:41',
      mode: 'duration' as const,
      pitStopDurationSeconds: 60,
      fuelCapacity: 110,
      fuelPerLap: 4.16,
      avgLapTimeSeconds: 218.6,
    };
    expect(RaceConfigSchema.safeParse(config).success).toBe(true);
  });

  it('rejects invalid mode', () => {
    const config = {
      id: crypto.randomUUID(),
      name: 'Test',
      simulator: 'Test',
      circuit: 'Test',
      car: 'Test',
      durationMinutes: 180,
      startTime: '14:00',
      sunsetTime: '20:00',
      sunriseTime: '06:00',
      mode: 'invalid',
      pitStopDurationSeconds: 60,
      fuelCapacity: 100,
      fuelPerLap: 3,
      avgLapTimeSeconds: 120,
    };
    expect(RaceConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe('DriverSchema', () => {
  it('validates a correct driver', () => {
    const driver = {
      id: crypto.randomUUID(),
      name: 'Sacha',
      color: '#4CAF50',
    };
    expect(DriverSchema.safeParse(driver).success).toBe(true);
  });

  it('accepts optional maxDriveTimeMinutes', () => {
    const driver = {
      id: crypto.randomUUID(),
      name: 'Marc',
      color: '#FFC107',
      maxDriveTimeMinutes: 240,
    };
    expect(DriverSchema.safeParse(driver).success).toBe(true);
  });
});

describe('StintSchema', () => {
  it('validates a correct stint', () => {
    const stint = {
      id: crypto.randomUUID(),
      driverId: crypto.randomUUID(),
      startTime: '16:00',
      endTime: '17:24',
      durationMinutes: 84,
      locked: false,
      tireCompound: 'dry' as const,
      tireCondition: 'new' as const,
      fuelLoads: 1,
      notes: '',
      order: 0,
    };
    expect(StintSchema.safeParse(stint).success).toBe(true);
  });
});

describe('RacePlanSchema', () => {
  it('validates a complete race plan', () => {
    const driverId = crypto.randomUUID();
    const stintId = crypto.randomUUID();
    const plan = {
      id: crypto.randomUUID(),
      config: {
        id: crypto.randomUUID(),
        name: 'Test Race',
        simulator: 'Test',
        circuit: 'Test',
        car: 'Test',
        durationMinutes: 180,
        startTime: '14:00',
        sunsetTime: '20:00',
        sunriseTime: '06:00',
        mode: 'duration' as const,
        pitStopDurationSeconds: 60,
        fuelCapacity: 100,
        fuelPerLap: 3,
        avgLapTimeSeconds: 120,
      },
      drivers: [{ id: driverId, name: 'Pilote 1', color: '#FF0000' }],
      stints: [{
        id: stintId,
        driverId,
        startTime: '14:00',
        endTime: '15:30',
        durationMinutes: 90,
        locked: false,
        tireCompound: 'dry' as const,
        tireCondition: 'new' as const,
        fuelLoads: 1,
        notes: '',
        order: 0,
      }],
      pitStops: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(RacePlanSchema.safeParse(plan).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && npx vitest run`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write models.ts**

`packages/shared/src/models.ts`:
```typescript
export type AlertSeverity = 'error' | 'warning' | 'info';

export interface RaceConfig {
  id: string;
  name: string;
  simulator: string;
  circuit: string;
  car: string;
  durationMinutes: number;
  startTime: string;
  sunsetTime: string;
  sunriseTime: string;
  mode: 'duration' | 'laps';
  totalLaps?: number;
  pitStopDurationSeconds: number;
  fuelCapacity: number;
  fuelPerLap: number;
  avgLapTimeSeconds: number;
}

export interface Driver {
  id: string;
  name: string;
  color: string;
  maxDriveTimeMinutes?: number;
}

export interface Stint {
  id: string;
  driverId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  locked: boolean;
  tireCompound: 'dry' | 'wet' | 'intermediate';
  tireCondition: 'new' | 'used';
  fuelLoads: number;
  targetLapTimeSeconds?: number;
  notes: string;
  order: number;
}

export interface PitStop {
  id: string;
  afterStintId: string;
  time: string;
  durationSeconds: number;
  tireChange: boolean;
  refuel: boolean;
}

export interface RacePlan {
  id: string;
  config: RaceConfig;
  drivers: Driver[];
  stints: Stint[];
  pitStops: PitStop[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanSummary {
  id: string;
  name: string;
  circuit: string;
  durationMinutes: number;
  driverCount: number;
  updatedAt: string;
}

export interface LiveRaceData {
  sessionTime: number;
  currentLap: number;
  totalLaps: number;
  position: number;
  fuelRemaining: number;
  lastLapTime: number;
  bestLapTime: number;
  trackTemp: number;
  isOnTrack: boolean;
  currentDriverIndex: number;
}

export interface StintDeviation {
  stintId: string;
  plannedStart: string;
  actualStart: string;
  deltaMinutes: number;
}

export interface LiveState {
  active: boolean;
  connected: boolean;
  data: LiveRaceData | null;
  currentStintIndex: number;
  elapsedMinutes: number;
  deviations: StintDeviation[];
}

export interface PlanAlert {
  severity: AlertSeverity;
  stintId?: string;
  driverId?: string;
  message: string;
}

export type ClientMessage =
  | { type: 'save-plan'; plan: RacePlan }
  | { type: 'load-plan'; id: string }
  | { type: 'list-plans' }
  | { type: 'delete-plan'; id: string }
  | { type: 'export'; format: 'pdf' | 'png' | 'csv'; plan: RacePlan }
  | { type: 'iracing-connect' }
  | { type: 'iracing-disconnect' };

export type ServerMessage =
  | { type: 'plan-saved'; id: string }
  | { type: 'plan-loaded'; plan: RacePlan }
  | { type: 'plan-list'; plans: PlanSummary[] }
  | { type: 'export-ready'; url: string }
  | { type: 'iracing-status'; connected: boolean }
  | { type: 'iracing-data'; data: LiveRaceData }
  | { type: 'error'; message: string };
```

- [ ] **Step 4: Write schema.ts**

`packages/shared/src/schema.ts`:
```typescript
import { z } from 'zod';

export const RaceConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  simulator: z.string().min(1),
  circuit: z.string().min(1),
  car: z.string().min(1),
  durationMinutes: z.number().positive(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  sunsetTime: z.string().regex(/^\d{2}:\d{2}$/),
  sunriseTime: z.string().regex(/^\d{2}:\d{2}$/),
  mode: z.enum(['duration', 'laps']),
  totalLaps: z.number().positive().optional(),
  pitStopDurationSeconds: z.number().nonnegative(),
  fuelCapacity: z.number().positive(),
  fuelPerLap: z.number().positive(),
  avgLapTimeSeconds: z.number().positive(),
});

export const DriverSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  maxDriveTimeMinutes: z.number().positive().optional(),
});

export const StintSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().positive(),
  locked: z.boolean(),
  tireCompound: z.enum(['dry', 'wet', 'intermediate']),
  tireCondition: z.enum(['new', 'used']),
  fuelLoads: z.number().nonnegative(),
  targetLapTimeSeconds: z.number().positive().optional(),
  notes: z.string(),
  order: z.number().nonnegative(),
});

export const PitStopSchema = z.object({
  id: z.string().uuid(),
  afterStintId: z.string().uuid(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationSeconds: z.number().nonnegative(),
  tireChange: z.boolean(),
  refuel: z.boolean(),
});

export const RacePlanSchema = z.object({
  id: z.string().uuid(),
  config: RaceConfigSchema,
  drivers: z.array(DriverSchema),
  stints: z.array(StintSchema),
  pitStops: z.array(PitStopSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const LiveRaceDataSchema = z.object({
  sessionTime: z.number(),
  currentLap: z.number(),
  totalLaps: z.number(),
  position: z.number(),
  fuelRemaining: z.number(),
  lastLapTime: z.number(),
  bestLapTime: z.number(),
  trackTemp: z.number(),
  isOnTrack: z.boolean(),
  currentDriverIndex: z.number(),
});
```

- [ ] **Step 5: Update barrel export**

`packages/shared/src/index.ts`:
```typescript
export type {
  RaceConfig, Driver, Stint, PitStop, RacePlan, PlanSummary,
  LiveRaceData, LiveState, StintDeviation, PlanAlert, AlertSeverity,
  ClientMessage, ServerMessage,
} from './models.js';

export {
  RaceConfigSchema, DriverSchema, StintSchema, PitStopSchema,
  RacePlanSchema, LiveRaceDataSchema,
} from './schema.js';
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd packages/shared && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared data models and Zod validation schemas"
```

---

### Task 3: Zustand Store

**Files:**
- Create: `packages/client/src/store/useRaceStore.ts`
- Create: `packages/client/src/store/useLiveStore.ts`
- Create: `packages/client/src/store/__tests__/useRaceStore.test.ts`
- Create: `packages/client/src/store/__tests__/useLiveStore.test.ts`

**Interfaces:**
- Consumes: all types from `@race-planner/shared` (Task 2)
- Produces: `useRaceStore` (raceConfig, drivers, stints, pitStops, selectedStintId, viewport, alerts, all mutation actions, undo/redo), `useLiveStore` (liveState, setLiveData, startFollowing, stopFollowing, recordDeviation)

- [ ] **Step 1: Install zustand temporal**

Run: `cd packages/client && npm install zundo`

Note: `zundo` is the temporal middleware for zustand 5.

- [ ] **Step 2: Write failing tests for useRaceStore**

`packages/client/src/store/__tests__/useRaceStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useRaceStore } from '../useRaceStore';
import type { Driver, Stint } from '@race-planner/shared';

describe('useRaceStore', () => {
  beforeEach(() => {
    useRaceStore.getState().reset();
  });

  it('has default race config', () => {
    const state = useRaceStore.getState();
    expect(state.raceConfig.durationMinutes).toBe(1440);
    expect(state.raceConfig.startTime).toBe('16:00');
  });

  it('adds a driver', () => {
    const { addDriver } = useRaceStore.getState();
    addDriver({ id: 'drv-1', name: 'Sacha', color: '#4CAF50' });
    expect(useRaceStore.getState().drivers).toHaveLength(1);
    expect(useRaceStore.getState().drivers[0].name).toBe('Sacha');
  });

  it('removes a driver', () => {
    const { addDriver, removeDriver } = useRaceStore.getState();
    addDriver({ id: 'drv-1', name: 'Sacha', color: '#4CAF50' });
    removeDriver('drv-1');
    expect(useRaceStore.getState().drivers).toHaveLength(0);
  });

  it('updates a driver', () => {
    const { addDriver, updateDriver } = useRaceStore.getState();
    addDriver({ id: 'drv-1', name: 'Sacha', color: '#4CAF50' });
    updateDriver('drv-1', { name: 'Sacha P.' });
    expect(useRaceStore.getState().drivers[0].name).toBe('Sacha P.');
  });

  it('adds a stint', () => {
    const stint: Stint = {
      id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
    };
    useRaceStore.getState().addStint(stint);
    expect(useRaceStore.getState().stints).toHaveLength(1);
  });

  it('removes a stint', () => {
    const stint: Stint = {
      id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
    };
    useRaceStore.getState().addStint(stint);
    useRaceStore.getState().removeStint('st-1');
    expect(useRaceStore.getState().stints).toHaveLength(0);
  });

  it('updates a stint', () => {
    const stint: Stint = {
      id: 'st-1', driverId: 'drv-1', startTime: '16:00', endTime: '17:24',
      durationMinutes: 84, locked: false, tireCompound: 'dry',
      tireCondition: 'new', fuelLoads: 1, notes: '', order: 0,
    };
    useRaceStore.getState().addStint(stint);
    useRaceStore.getState().updateStint('st-1', { locked: true });
    expect(useRaceStore.getState().stints[0].locked).toBe(true);
  });

  it('selects a stint', () => {
    useRaceStore.getState().selectStint('st-1');
    expect(useRaceStore.getState().selectedStintId).toBe('st-1');
  });

  it('updates viewport', () => {
    useRaceStore.getState().setViewport({ scale: 2.5 });
    expect(useRaceStore.getState().viewport.scale).toBe(2.5);
  });

  it('updates race config', () => {
    useRaceStore.getState().setConfig({ name: '6h Spa' });
    expect(useRaceStore.getState().raceConfig.name).toBe('6h Spa');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/client && npx vitest run`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement useRaceStore**

`packages/client/src/store/useRaceStore.ts`:
```typescript
import { create } from 'zustand';
import { temporal } from 'zundo';
import type { RaceConfig, Driver, Stint, PitStop, PlanAlert } from '@race-planner/shared';

interface Viewport {
  offsetX: number;
  scale: number;
}

interface RaceState {
  raceConfig: RaceConfig;
  drivers: Driver[];
  stints: Stint[];
  pitStops: PitStop[];
  selectedStintId: string | null;
  viewport: Viewport;
  alerts: PlanAlert[];
}

interface RaceActions {
  setConfig: (partial: Partial<RaceConfig>) => void;
  addDriver: (driver: Driver) => void;
  removeDriver: (id: string) => void;
  updateDriver: (id: string, partial: Partial<Driver>) => void;
  addStint: (stint: Stint) => void;
  removeStint: (id: string) => void;
  updateStint: (id: string, partial: Partial<Stint>) => void;
  addPitStop: (pitStop: PitStop) => void;
  removePitStop: (id: string) => void;
  selectStint: (id: string | null) => void;
  setViewport: (partial: Partial<Viewport>) => void;
  setAlerts: (alerts: PlanAlert[]) => void;
  setStints: (stints: Stint[]) => void;
  setPitStops: (pitStops: PitStop[]) => void;
  reset: () => void;
}

const defaultConfig: RaceConfig = {
  id: crypto.randomUUID(),
  name: '24 Heures du Mans',
  simulator: 'Le Mans Ultimate',
  circuit: 'Circuit de la Sarthe',
  car: 'Toyota TR010 Hybrid',
  durationMinutes: 1440,
  startTime: '16:00',
  sunsetTime: '20:05',
  sunriseTime: '07:41',
  mode: 'duration',
  pitStopDurationSeconds: 60,
  fuelCapacity: 110,
  fuelPerLap: 4.16,
  avgLapTimeSeconds: 218.6,
};

const initialState: RaceState = {
  raceConfig: defaultConfig,
  drivers: [],
  stints: [],
  pitStops: [],
  selectedStintId: null,
  viewport: { offsetX: 0, scale: 3 },
  alerts: [],
};

export const useRaceStore = create<RaceState & RaceActions>()(
  temporal(
    (set) => ({
      ...initialState,

      setConfig: (partial) =>
        set((s) => ({ raceConfig: { ...s.raceConfig, ...partial } })),

      addDriver: (driver) =>
        set((s) => ({ drivers: [...s.drivers, driver] })),

      removeDriver: (id) =>
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      updateDriver: (id, partial) =>
        set((s) => ({
          drivers: s.drivers.map((d) => (d.id === id ? { ...d, ...partial } : d)),
        })),

      addStint: (stint) =>
        set((s) => ({ stints: [...s.stints, stint] })),

      removeStint: (id) =>
        set((s) => ({
          stints: s.stints.filter((st) => st.id !== id),
          selectedStintId: s.selectedStintId === id ? null : s.selectedStintId,
        })),

      updateStint: (id, partial) =>
        set((s) => ({
          stints: s.stints.map((st) => (st.id === id ? { ...st, ...partial } : st)),
        })),

      addPitStop: (pitStop) =>
        set((s) => ({ pitStops: [...s.pitStops, pitStop] })),

      removePitStop: (id) =>
        set((s) => ({ pitStops: s.pitStops.filter((p) => p.id !== id) })),

      selectStint: (id) => set({ selectedStintId: id }),

      setViewport: (partial) =>
        set((s) => ({ viewport: { ...s.viewport, ...partial } })),

      setAlerts: (alerts) => set({ alerts }),

      setStints: (stints) => set({ stints }),

      setPitStops: (pitStops) => set({ pitStops }),

      reset: () => set(initialState),
    }),
    {
      partialize: (state) => {
        const { selectedStintId, viewport, alerts, ...tracked } = state;
        return tracked;
      },
    }
  )
);
```

- [ ] **Step 5: Implement useLiveStore**

`packages/client/src/store/useLiveStore.ts`:
```typescript
import { create } from 'zustand';
import type { LiveRaceData, LiveState, StintDeviation } from '@race-planner/shared';

interface LiveActions {
  setLiveData: (data: LiveRaceData) => void;
  startFollowing: () => void;
  stopFollowing: () => void;
  setConnected: (connected: boolean) => void;
  recordDeviation: (deviation: StintDeviation) => void;
  setCurrentStintIndex: (index: number) => void;
  setElapsedMinutes: (minutes: number) => void;
  reset: () => void;
}

const initialState: LiveState = {
  active: false,
  connected: false,
  data: null,
  currentStintIndex: 0,
  elapsedMinutes: 0,
  deviations: [],
};

export const useLiveStore = create<LiveState & LiveActions>()((set) => ({
  ...initialState,

  setLiveData: (data) => set({ data }),

  startFollowing: () => set({ active: true }),

  stopFollowing: () => set({ active: false, data: null }),

  setConnected: (connected) => set({ connected }),

  recordDeviation: (deviation) =>
    set((s) => ({ deviations: [...s.deviations, deviation] })),

  setCurrentStintIndex: (index) => set({ currentStintIndex: index }),

  setElapsedMinutes: (minutes) => set({ elapsedMinutes: minutes }),

  reset: () => set(initialState),
}));
```

- [ ] **Step 6: Write failing test for useLiveStore**

`packages/client/src/store/__tests__/useLiveStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useLiveStore } from '../useLiveStore';
import type { LiveRaceData } from '@race-planner/shared';

describe('useLiveStore', () => {
  beforeEach(() => {
    useLiveStore.getState().reset();
  });

  it('starts inactive', () => {
    expect(useLiveStore.getState().active).toBe(false);
    expect(useLiveStore.getState().connected).toBe(false);
  });

  it('starts and stops following', () => {
    useLiveStore.getState().startFollowing();
    expect(useLiveStore.getState().active).toBe(true);
    useLiveStore.getState().stopFollowing();
    expect(useLiveStore.getState().active).toBe(false);
    expect(useLiveStore.getState().data).toBeNull();
  });

  it('receives live data', () => {
    const data: LiveRaceData = {
      sessionTime: 3600, currentLap: 42, totalLaps: 382,
      position: 3, fuelRemaining: 45.2, lastLapTime: 218.4,
      bestLapTime: 216.9, trackTemp: 28, isOnTrack: true,
      currentDriverIndex: 0,
    };
    useLiveStore.getState().setLiveData(data);
    expect(useLiveStore.getState().data?.position).toBe(3);
  });

  it('records deviations', () => {
    useLiveStore.getState().recordDeviation({
      stintId: 'st-1', plannedStart: '16:00', actualStart: '16:03', deltaMinutes: 3,
    });
    expect(useLiveStore.getState().deviations).toHaveLength(1);
    expect(useLiveStore.getState().deviations[0].deltaMinutes).toBe(3);
  });
});
```

- [ ] **Step 7: Run all tests**

Run: `cd packages/client && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/store/
git commit -m "feat: add Zustand stores with undo/redo for race plan and live data"
```

---

### Task 4: Server + WebSocket Foundation

**Files:**
- Create: `packages/server/src/index.ts` (overwrite placeholder)
- Create: `packages/server/src/websocket.ts`
- Create: `packages/server/src/__tests__/websocket.test.ts`

**Interfaces:**
- Consumes: `ClientMessage`, `ServerMessage` from `@race-planner/shared` (Task 2)
- Produces: running HTTP+WS server on port 3001, `handleMessage(ws, message: ClientMessage): void`, `broadcast(message: ServerMessage): void`

- [ ] **Step 1: Write failing test**

`packages/server/src/__tests__/websocket.test.ts`:
```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { WebSocket } from 'ws';
import { createServer, stopServer } from '../index';

describe('WebSocket server', () => {
  let port: number;

  afterEach(async () => {
    await stopServer();
  });

  it('accepts a WebSocket connection', async () => {
    port = await createServer(0);
    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => ws.on('open', resolve));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('responds to list-plans with plan-list', async () => {
    port = await createServer(0);
    const ws = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => ws.on('open', resolve));

    const response = await new Promise<string>((resolve) => {
      ws.on('message', (data) => resolve(data.toString()));
      ws.send(JSON.stringify({ type: 'list-plans' }));
    });

    const parsed = JSON.parse(response);
    expect(parsed.type).toBe('plan-list');
    expect(Array.isArray(parsed.plans)).toBe(true);
    ws.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run`
Expected: FAIL — createServer not found.

- [ ] **Step 3: Implement server index.ts**

`packages/server/src/index.ts`:
```typescript
import { createServer as createHttpServer, type Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { handleMessage } from './websocket.js';

let httpServer: Server | null = null;
let wss: WebSocketServer | null = null;

export async function createServer(port: number): Promise<number> {
  httpServer = createHttpServer();
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (raw: Buffer) => {
      try {
        const message = JSON.parse(raw.toString());
        handleMessage(ws, message, wss!);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });
  });

  return new Promise((resolve) => {
    httpServer!.listen(port, () => {
      const addr = httpServer!.address();
      const assignedPort = typeof addr === 'object' && addr ? addr.port : port;
      console.log(`Race Planner server on port ${assignedPort}`);
      resolve(assignedPort);
    });
  });
}

export async function stopServer(): Promise<void> {
  if (wss) {
    for (const client of wss.clients) {
      client.close();
    }
    wss.close();
    wss = null;
  }
  if (httpServer) {
    await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    httpServer = null;
  }
}

if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')) {
  createServer(3001);
}
```

- [ ] **Step 4: Implement websocket.ts**

`packages/server/src/websocket.ts`:
```typescript
import type { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '@race-planner/shared';

export function handleMessage(
  ws: WebSocket,
  message: ClientMessage,
  wss: WebSocketServer
): void {
  switch (message.type) {
    case 'list-plans':
      send(ws, { type: 'plan-list', plans: [] });
      break;

    case 'save-plan':
      send(ws, { type: 'plan-saved', id: message.plan.id });
      break;

    case 'load-plan':
      send(ws, { type: 'error', message: `Plan ${message.id} not found` });
      break;

    case 'delete-plan':
      send(ws, { type: 'error', message: 'Not implemented' });
      break;

    case 'export':
      send(ws, { type: 'error', message: 'Not implemented' });
      break;

    case 'iracing-connect':
      send(ws, { type: 'iracing-status', connected: false });
      break;

    case 'iracing-disconnect':
      send(ws, { type: 'iracing-status', connected: false });
      break;

    default:
      send(ws, { type: 'error', message: 'Unknown message type' });
  }
}

export function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcast(wss: WebSocketServer, message: ServerMessage): void {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}
```

- [ ] **Step 5: Run tests**

Run: `cd packages/server && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/
git commit -m "feat: add WebSocket server with message routing"
```

---

### Task 5: File Storage

**Files:**
- Create: `packages/server/src/storage/plans.ts`
- Create: `packages/server/src/storage/templates.ts`
- Modify: `packages/server/src/websocket.ts`
- Create: `packages/server/src/__tests__/storage.test.ts`
- Create: `data/templates/24h-lemans.json`

**Interfaces:**
- Consumes: `RacePlan`, `RacePlanSchema`, `PlanSummary` from `@race-planner/shared` (Task 2), `handleMessage` from Task 4
- Produces: `savePlan(plan): Promise<void>`, `loadPlan(id): Promise<RacePlan>`, `listPlans(): Promise<PlanSummary[]>`, `deletePlan(id): Promise<void>`, `listTemplates(): Promise<PlanSummary[]>`, `loadTemplate(id): Promise<RacePlan>`

- [ ] **Step 1: Write failing test**

`packages/server/src/__tests__/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { savePlan, loadPlan, listPlans, deletePlan } from '../storage/plans';
import type { RacePlan } from '@race-planner/shared';

describe('File storage', () => {
  let dataDir: string;

  const makePlan = (id: string): RacePlan => ({
    id,
    config: {
      id: 'cfg-1', name: 'Test Race', simulator: 'Test', circuit: 'Test',
      car: 'Test', durationMinutes: 180, startTime: '14:00',
      sunsetTime: '20:00', sunriseTime: '06:00', mode: 'duration',
      pitStopDurationSeconds: 60, fuelCapacity: 100, fuelPerLap: 3,
      avgLapTimeSeconds: 120,
    },
    drivers: [{ id: 'drv-1', name: 'Pilote 1', color: '#FF0000' }],
    stints: [],
    pitStops: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'rp-test-'));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('saves and loads a plan', async () => {
    const plan = makePlan('plan-1');
    await savePlan(plan, dataDir);
    const loaded = await loadPlan('plan-1', dataDir);
    expect(loaded.config.name).toBe('Test Race');
    expect(loaded.drivers).toHaveLength(1);
  });

  it('lists saved plans', async () => {
    await savePlan(makePlan('plan-1'), dataDir);
    await savePlan(makePlan('plan-2'), dataDir);
    const list = await listPlans(dataDir);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBeDefined();
  });

  it('deletes a plan', async () => {
    await savePlan(makePlan('plan-1'), dataDir);
    await deletePlan('plan-1', dataDir);
    const list = await listPlans(dataDir);
    expect(list).toHaveLength(0);
  });

  it('creates backup on save', async () => {
    const plan = makePlan('plan-1');
    await savePlan(plan, dataDir);
    plan.config.name = 'Updated';
    await savePlan(plan, dataDir);
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(dataDir);
    const backups = files.filter((f) => f.includes('.bak'));
    expect(backups.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/server && npx vitest run`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement plans.ts**

`packages/server/src/storage/plans.ts`:
```typescript
import { readFile, writeFile, readdir, unlink, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { RacePlan, PlanSummary } from '@race-planner/shared';

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

export async function savePlan(plan: RacePlan, dataDir: string): Promise<void> {
  await ensureDir(dataDir);
  const filePath = join(dataDir, `${plan.id}.json`);

  if (existsSync(filePath)) {
    const timestamp = Date.now();
    const bakPath = join(dataDir, `${plan.id}.${timestamp}.bak`);
    await copyFile(filePath, bakPath);
    await cleanOldBackups(plan.id, dataDir, 5);
  }

  plan.updatedAt = new Date().toISOString();
  await writeFile(filePath, JSON.stringify(plan, null, 2), 'utf-8');
}

export async function loadPlan(id: string, dataDir: string): Promise<RacePlan> {
  const filePath = join(dataDir, `${id}.json`);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as RacePlan;
}

export async function listPlans(dataDir: string): Promise<PlanSummary[]> {
  await ensureDir(dataDir);
  const files = await readdir(dataDir);
  const plans: PlanSummary[] = [];

  for (const file of files) {
    if (!file.endsWith('.json') || file.includes('.bak')) continue;
    try {
      const raw = await readFile(join(dataDir, file), 'utf-8');
      const plan = JSON.parse(raw) as RacePlan;
      plans.push({
        id: plan.id,
        name: plan.config.name,
        circuit: plan.config.circuit,
        durationMinutes: plan.config.durationMinutes,
        driverCount: plan.drivers.length,
        updatedAt: plan.updatedAt,
      });
    } catch {
      // skip corrupted files
    }
  }

  return plans;
}

export async function deletePlan(id: string, dataDir: string): Promise<void> {
  const files = await readdir(dataDir);
  for (const file of files) {
    if (file.startsWith(id)) {
      await unlink(join(dataDir, file));
    }
  }
}

async function cleanOldBackups(id: string, dataDir: string, keep: number): Promise<void> {
  const files = await readdir(dataDir);
  const backups = files
    .filter((f) => f.startsWith(id) && f.endsWith('.bak'))
    .sort();

  while (backups.length > keep) {
    const oldest = backups.shift()!;
    await unlink(join(dataDir, oldest));
  }
}
```

- [ ] **Step 4: Implement templates.ts**

`packages/server/src/storage/templates.ts`:
```typescript
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { RacePlan, PlanSummary } from '@race-planner/shared';

export async function listTemplates(templatesDir: string): Promise<PlanSummary[]> {
  try {
    const files = await readdir(templatesDir);
    const templates: PlanSummary[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const raw = await readFile(join(templatesDir, file), 'utf-8');
      const plan = JSON.parse(raw) as RacePlan;
      templates.push({
        id: plan.id,
        name: plan.config.name,
        circuit: plan.config.circuit,
        durationMinutes: plan.config.durationMinutes,
        driverCount: plan.drivers.length,
        updatedAt: plan.updatedAt,
      });
    }

    return templates;
  } catch {
    return [];
  }
}

export async function loadTemplate(id: string, templatesDir: string): Promise<RacePlan> {
  const files = await readdir(templatesDir);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await readFile(join(templatesDir, file), 'utf-8');
    const plan = JSON.parse(raw) as RacePlan;
    if (plan.id === id) return plan;
  }
  throw new Error(`Template ${id} not found`);
}
```

- [ ] **Step 5: Wire storage into websocket.ts**

Replace the `save-plan`, `load-plan`, `list-plans`, `delete-plan` cases in `packages/server/src/websocket.ts`:

```typescript
import type { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '@race-planner/shared';
import { savePlan, loadPlan, listPlans, deletePlan } from './storage/plans.js';
import { resolve } from 'node:path';

const DATA_DIR = resolve(process.cwd(), 'data', 'plans');

export function handleMessage(
  ws: WebSocket,
  message: ClientMessage,
  wss: WebSocketServer
): void {
  switch (message.type) {
    case 'list-plans':
      listPlans(DATA_DIR).then((plans) => send(ws, { type: 'plan-list', plans }));
      break;

    case 'save-plan':
      savePlan(message.plan, DATA_DIR).then(() =>
        send(ws, { type: 'plan-saved', id: message.plan.id })
      );
      break;

    case 'load-plan':
      loadPlan(message.id, DATA_DIR)
        .then((plan) => send(ws, { type: 'plan-loaded', plan }))
        .catch(() => send(ws, { type: 'error', message: `Plan ${message.id} not found` }));
      break;

    case 'delete-plan':
      deletePlan(message.id, DATA_DIR).then(() =>
        send(ws, { type: 'plan-list', plans: [] })
      );
      break;

    case 'export':
      send(ws, { type: 'error', message: 'Not implemented' });
      break;

    case 'iracing-connect':
      send(ws, { type: 'iracing-status', connected: false });
      break;

    case 'iracing-disconnect':
      send(ws, { type: 'iracing-status', connected: false });
      break;

    default:
      send(ws, { type: 'error', message: 'Unknown message type' });
  }
}

export function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcast(wss: WebSocketServer, message: ServerMessage): void {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}
```

- [ ] **Step 6: Create default template**

`data/templates/24h-lemans.json`:
```json
{
  "id": "template-24h-lemans",
  "config": {
    "id": "template-24h-lemans-config",
    "name": "24 Heures du Mans",
    "simulator": "Le Mans Ultimate",
    "circuit": "Circuit de la Sarthe",
    "car": "Toyota TR010 Hybrid",
    "durationMinutes": 1440,
    "startTime": "16:00",
    "sunsetTime": "20:05",
    "sunriseTime": "07:41",
    "mode": "duration",
    "pitStopDurationSeconds": 60,
    "fuelCapacity": 110,
    "fuelPerLap": 4.16,
    "avgLapTimeSeconds": 218.6
  },
  "drivers": [],
  "stints": [],
  "pitStops": [],
  "createdAt": "2026-09-25T00:00:00.000Z",
  "updatedAt": "2026-09-25T00:00:00.000Z"
}
```

- [ ] **Step 7: Run tests**

Run: `cd packages/server && npx vitest run`
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/storage/ data/templates/
git commit -m "feat: add file-based plan storage with backup rotation and templates"
```
