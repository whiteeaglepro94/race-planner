import type { Viewport } from '../viewport';
import type { Stint, Driver } from '@race-planner/shared';

export function setPitTransitionsDirtyCallback(_cb: () => void): void {}

export function drawPitTransitions(
  _ctx: CanvasRenderingContext2D,
  _vp: Viewport,
  _stints: Stint[],
  _drivers: Driver[],
  _y: number,
  _raceStartTime: string
): void {
  // Pit stops are now placed manually — no auto-transitions
}
