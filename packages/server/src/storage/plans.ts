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
