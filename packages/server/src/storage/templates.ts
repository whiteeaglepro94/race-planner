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
