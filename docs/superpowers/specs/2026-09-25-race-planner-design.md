# Race Planner — Design Specification

Interactive endurance race planning application for motorsport simulation.

## Overview

A web-based tool for creating, editing, and following race plans for endurance events (3h, 6h, 24h, custom). Built around an interactive horizontal timeline where drivers' stints are displayed as colored blocks. Includes live iRacing telemetry integration for real-time race following.

**Reference:** The visual mockup shows a 24 Heures du Mans planning interface with dark theme, colored stint blocks per driver, night overlay, sun markers, pit stop indicators, and a detail panel.

## Tech Stack

| Decision          | Choice                              |
|-------------------|-------------------------------------|
| Frontend          | React + TypeScript + Vite           |
| Timeline render   | Canvas HTML5 custom                 |
| Backend           | Node.js + WebSocket                 |
| iRacing bridge    | `node-irsdk`                        |
| Persistence       | JSON files (local filesystem)       |
| Architecture      | Monorepo (Turborepo)                |
| State management  | Zustand + temporal middleware       |
| Validation        | Zod                                 |

## Project Structure

```
race-planner/
├── packages/
│   ├── shared/          # Types, models, validation, automation logic
│   │   └── src/
│   │       ├── models.ts
│   │       ├── schema.ts         # Zod schemas
│   │       └── automation/
│   │           ├── distribute.ts
│   │           ├── autofill.ts
│   │           ├── recalculate.ts
│   │           ├── validate.ts
│   │           └── pitEstimate.ts
│   ├── server/          # Node.js backend
│   │   └── src/
│   │       ├── index.ts
│   │       ├── websocket.ts
│   │       ├── iracing/
│   │       │   ├── bridge.ts
│   │       │   └── session.ts
│   │       ├── storage/
│   │       │   ├── plans.ts
│   │       │   └── templates.ts
│   │       └── export/
│   │           ├── pdf.ts
│   │           ├── image.ts
│   │           └── csv.ts
│   └── client/          # React + Vite frontend
│       └── src/
│           ├── App.tsx
│           ├── store/
│           │   ├── useRaceStore.ts
│           │   └── useLiveStore.ts
│           ├── components/
│           │   ├── TopBar.tsx
│           │   ├── ToolBar.tsx
│           │   ├── DriverBar.tsx
│           │   ├── DriverChip.tsx
│           │   ├── StintDetailPanel.tsx
│           │   ├── StatusBar.tsx
│           │   └── LivePanel.tsx
│           ├── canvas/
│           │   ├── TimelineCanvas.tsx    # React wrapper
│           │   ├── renderer.ts          # draw functions
│           │   ├── viewport.ts          # zoom, scroll, coord transform
│           │   ├── hitTest.ts           # click/drag detection
│           │   ├── interaction.ts       # mouse/keyboard handlers
│           │   └── layers/
│           │       ├── background.ts    # night/day overlay
│           │       ├── timeAxis.ts      # hour markers
│           │       ├── stintBlocks.ts   # colored stint rectangles
│           │       ├── pitStops.ts      # pit stop markers
│           │       ├── sunMarkers.ts    # sunrise/sunset icons
│           │       └── cursor.ts        # live race cursor
│           └── hooks/
│               ├── useWebSocket.ts
│               ├── useAutoSave.ts
│               └── useKeyboardShortcuts.ts
├── data/
│   ├── plans/           # Saved race plans (JSON)
│   ├── templates/       # Pre-configured race templates
│   └── exports/         # Temporary export files
├── turbo.json
├── package.json
└── tsconfig.base.json
```

## Data Models

### RaceConfig

```typescript
interface RaceConfig {
  id: string
  name: string                    // "24 Heures du Mans"
  simulator: string               // "Le Mans Ultimate"
  circuit: string                 // "Circuit de la Sarthe"
  car: string                     // "Toyota TR010 Hybrid"
  durationMinutes: number         // 1440 for 24h
  startTime: string               // "16:00" (sim time)
  sunsetTime: string              // "20:05"
  sunriseTime: string             // "07:41"
  mode: 'duration' | 'laps'
  totalLaps?: number
  pitStopDurationSeconds: number
  fuelCapacity: number
  fuelPerLap: number
  avgLapTimeSeconds: number       // 3:38.6 = 218.6
}
```

### Driver

```typescript
interface Driver {
  id: string
  name: string                    // "Sacha"
  color: string                   // "#4CAF50"
  maxDriveTimeMinutes?: number    // regulatory limit
}
```

### Stint

```typescript
interface Stint {
  id: string
  driverId: string
  startTime: string               // "HH:mm"
  endTime: string
  durationMinutes: number
  locked: boolean                 // protected from auto-fill
  tireCompound: 'dry' | 'wet' | 'intermediate'
  tireCondition: 'new' | 'used'
  fuelLoads: number
  targetLapTimeSeconds?: number
  notes: string                   // passation brief
  order: number                   // position in timeline
}
```

### PitStop

```typescript
interface PitStop {
  id: string
  afterStintId: string
  time: string
  durationSeconds: number
  tireChange: boolean
  refuel: boolean
}
```

### RacePlan

```typescript
interface RacePlan {
  id: string
  config: RaceConfig
  drivers: Driver[]
  stints: Stint[]
  pitStops: PitStop[]
  createdAt: string
  updatedAt: string
}
```

### LiveRaceData

```typescript
interface LiveRaceData {
  sessionTime: number
  currentLap: number
  totalLaps: number
  position: number
  fuelRemaining: number
  lastLapTime: number
  bestLapTime: number
  trackTemp: number
  isOnTrack: boolean
  currentDriverIndex: number
}
```

### LiveState

```typescript
interface LiveState {
  active: boolean
  connected: boolean
  data: LiveRaceData | null
  currentStintIndex: number
  elapsedMinutes: number
  deviations: StintDeviation[]
}

interface StintDeviation {
  stintId: string
  plannedStart: string
  actualStart: string
  deltaMinutes: number            // positive = behind schedule
}
```

## Component Architecture

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ TopBar (race config: name, circuit, car, duration,      │
│         start time, driver count)                       │
├─────────────────────────────────────────────────────────┤
│ ToolBar (auto-distribute, balance, autofill, add stint, │
│          add pit, export, save, load)                   │
├─────────────────────────────────────────────────────────┤
│ DriverBar (driver chips with colors, drag to assign)    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ TimelineCanvas (horizontal timeline, stint blocks,      │
│  night overlay, sun markers, pit stops, zoom/scroll)    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [LivePanel - visible only during race follow mode]      │
├─────────────────────────────────────────────────────────┤
│ StintDetailPanel (selected stint: driver, times, tires, │
│  fuel, target lap, notes, lock toggle)                  │
├─────────────────────────────────────────────────────────┤
│ StatusBar (per-driver summary: total time, stint count) │
└─────────────────────────────────────────────────────────┘
```

### Canvas System

The `TimelineCanvas` is a self-contained rendering system, decoupled from React's render cycle.

**Coordinate system:**
- World coordinates: minutes since race start. 0 = start time, durationMinutes = end.
- Viewport: visible window defined by `offsetX` (scroll position in world coords) and `scale` (pixels per minute).
- Conversion: `screenX = (worldMinutes - offsetX) * scale`, inverse for hit testing.

**Rendering layers (drawn bottom to top):**
1. Background — night/day gradient based on sunset/sunrise times
2. Time axis — hour markers with labels
3. Sun markers — sunrise and sunset icons at correct positions
4. Stint blocks — colored rectangles per stint, driver name and time range as text
5. Pit stop markers — icons between stint blocks
6. Selection highlight — outline on selected stint
7. Live cursor — vertical line at current race time (live mode only)
8. Drag preview — ghost block when dragging a stint

**Interactions:**
- Click on stint block: select, open StintDetailPanel
- Drag stint block: reposition in time, cascade recalculate following stints
- Drag right edge of block: resize duration
- Mouse wheel: horizontal zoom (centered on cursor)
- Middle-click drag: horizontal scroll
- Double-click empty area: create new stint at that time position
- Right-click stint: context menu (duplicate, delete, lock/unlock)

**Performance:**
- Render loop via `requestAnimationFrame`, only redraws when store state changes (dirty flag)
- Only visible stints are drawn (viewport culling)
- Text rendering cached where possible

### State Management

Two Zustand stores:

**`useRaceStore`** — all plan data, with `temporal` middleware for undo/redo:
- `raceConfig: RaceConfig`
- `drivers: Driver[]`
- `stints: Stint[]`
- `pitStops: PitStop[]`
- `selectedStintId: string | null`
- `viewport: { offsetX: number, scale: number }`
- `alerts: PlanAlert[]`
- Actions: addStint, updateStint, removeStint, addDriver, updateDriver, removeDriver, etc.

**`useLiveStore`** — live race data, no undo/redo:
- `liveState: LiveState`
- Actions: setLiveData, startFollowing, stopFollowing, recordDeviation

## Server Architecture

### WebSocket Protocol

Single WebSocket connection, multiplexed by message type.

**Client to Server:**

```typescript
type ClientMessage =
  | { type: 'save-plan', plan: RacePlan }
  | { type: 'load-plan', id: string }
  | { type: 'list-plans' }
  | { type: 'delete-plan', id: string }
  | { type: 'export', format: 'pdf' | 'png' | 'csv', plan: RacePlan }
  | { type: 'iracing-connect' }
  | { type: 'iracing-disconnect' }
```

**Server to Client:**

```typescript
type ServerMessage =
  | { type: 'plan-saved', id: string }
  | { type: 'plan-loaded', plan: RacePlan }
  | { type: 'plan-list', plans: PlanSummary[] }
  | { type: 'export-ready', url: string }
  | { type: 'iracing-status', connected: boolean }
  | { type: 'iracing-data', data: LiveRaceData }
  | { type: 'error', message: string }
```

### iRacing Bridge

- Uses `node-irsdk` to read iRacing shared memory on Windows
- Polls at 10Hz when active
- Normalizes raw telemetry into `LiveRaceData` interface
- Isolated module: replaceable with another simulator's SDK
- Auto-reconnect every 5 seconds if connection lost
- Graceful degradation: app works fully without iRacing running

### File Storage

```
data/
├── plans/
│   ├── {uuid}.json           # saved race plans
│   └── {uuid}.json.bak       # automatic backup (last 5 versions)
├── templates/
│   ├── 24h-lemans.json       # pre-configured templates
│   ├── 6h-spa.json
│   └── 3h-custom.json
└── exports/                  # temporary export files, auto-cleaned
```

- Auto-save: debounced 3 seconds after each plan modification
- Backup rotation: keeps last 5 versions per plan
- Templates: read-only, shipped with the app

## Automation System

### Distribute (equal time split)

```typescript
function distributeStints(
  drivers: Driver[],
  config: RaceConfig,
  lockedStints: Stint[]
): Stint[]
```

Algorithm:
1. Calculate remaining time = race duration - sum of locked stints
2. Divide remaining time equally among drivers
3. Split into stints of target duration (default ~90 min, configurable)
4. Round-robin driver assignment
5. Respect `maxDriveTimeMinutes` per driver
6. Insert PitStop between each stint

### Autofill (fill gaps)

Fills holes in the planning. If a stint exists from 16:00–17:30 and the next starts at 19:00, autofill proposes a stint from 17:30–19:00 assigned to the least-utilized driver.

### Cascade Recalculate

When a stint is modified (duration change, moved):
1. Recalculate `endTime` of modified stint
2. For each subsequent unlocked stint: `startTime` = previous `endTime` + pit stop duration
3. If last stint exceeds race end: truncate + alert

### Pit Stop Estimation

```typescript
function estimatePitStops(config: RaceConfig): number {
  const totalLaps = (config.durationMinutes * 60) / config.avgLapTimeSeconds
  const lapsPerTank = config.fuelCapacity / config.fuelPerLap
  return Math.ceil(totalLaps / lapsPerTank) - 1
}
```

### Validation Alerts

```typescript
type AlertSeverity = 'error' | 'warning' | 'info'

interface PlanAlert {
  severity: AlertSeverity
  stintId?: string
  driverId?: string
  message: string
}

function validatePlan(plan: RacePlan): PlanAlert[]
```

Validations run on every store mutation:

| Alert                                       | Severity |
|---------------------------------------------|----------|
| Driver exceeds `maxDriveTimeMinutes`        | error    |
| Stint exceeds race end time                 | error    |
| Gap between consecutive stints              | warning  |
| Stint shorter than 20 minutes               | warning  |
| Stint longer than 180 minutes               | warning  |
| Total stint duration ≠ race duration        | warning  |
| Stint during night period without notes     | info     |

Thresholds are user-configurable. Alerts display as overlay icons on the affected stint blocks in the canvas, and in a collapsible alert panel.

### Locking

A stint with `locked: true`:
- Is excluded from distribute, autofill, and cascade recalculate
- Displays a lock icon on the canvas
- Right-click to toggle lock/unlock

## Export System

### PDF Export

Uses `pdfkit` on the server. Vector rendering, not screenshot.

Content:
- Header: race name, circuit, car, duration, start time
- Miniature colored timeline
- Detailed table: stint, driver, start, end, duration, tires, fuel, notes
- Per-driver summary: total time, stint count, average stint duration

### Image Export (PNG)

Canvas `toDataURL('image/png')` on the client side. Configurable resolution.

### CSV Export

Flat table: stint number, driver, start, end, duration, tire compound, tire condition, fuel loads, target lap time, notes.

### JSON Import/Export

Format = raw `RacePlan`. Import validates schema with Zod, alerts on incompatibility.

## Live Race Mode

### Activation

1. User clicks "SUIVIE EN COURSE" button
2. Client sends `iracing-connect` via WebSocket
3. Server starts `node-irsdk` polling at 10Hz
4. Server pushes `LiveRaceData` to client via WebSocket

### Visual Behavior

- Timeline splits visually: left = past (dimmed, actual data), right = future (plan)
- Vertical cursor advances in real-time on the timeline
- Current stint highlighted with pulsing border
- Live panel appears above detail panel with telemetry data

### Live Panel Display

```
┌──────────────────────────────────────────────────────────┐
│ LIVE  Position: P3  Lap: 142/382  Fuel: 45.2L           │
│       Last: 3:38.4  Best: 3:36.9  Track: 28°C           │
│       Current stint: SACHA — 42 min remaining            │
└──────────────────────────────────────────────────────────┘
```

### Deviation Tracking

- Records `StintDeviation` for each stint: planned vs actual start time
- Status bar shows: "Behind 3 min" or "Ahead 1 min" relative to plan
- If actual stint overruns plan: auto-recalculate future unlocked stints

### Disconnection Handling

- If iRacing signal lost: retain last known state
- Red "DISCONNECTED" icon in live panel
- Auto-reconnect attempt every 5 seconds
- Plan continues advancing on system clock as fallback

## UI Theme

Dark theme inspired by motorsport simulation software:
- Background: dark gray (#1a1a2e or similar)
- Stint blocks: per-driver colors with slight transparency
- Night overlay: darker shade with reduced opacity
- Text: light gray/white, high contrast
- Accent: amber/gold for selected elements and warnings
- Controls: professional, minimal, flat design
- All colors user-customizable per driver

## Future Considerations (not in V1 scope but architecture supports)

- Electron packaging for standalone `.exe` distribution
- Multi-car planning (team with multiple entries)
- Historical race data import for planning reference
- Weather forecast integration
- Tire degradation modeling
- Fuel strategy optimizer
- Integration with other simulators (ACC, rFactor 2, iRacing)
- Cloud sync for team collaboration
