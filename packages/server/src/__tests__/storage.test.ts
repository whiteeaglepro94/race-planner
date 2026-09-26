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
      id: 'cfg-1', name: 'Test Race', teamName: '', simulator: 'Test', circuit: 'Test',
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
