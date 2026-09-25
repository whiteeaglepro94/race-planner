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
