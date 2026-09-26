// packages/client/src/canvas/__tests__/viewport.test.ts
import { describe, it, expect } from 'vitest';
import { Viewport } from '../viewport';

describe('Viewport', () => {
  it('converts world to screen coords', () => {
    const vp = new Viewport(0, 3, 1200);
    expect(vp.worldToScreenX(60)).toBe(180);
  });

  it('converts screen to world coords', () => {
    const vp = new Viewport(0, 3, 1200);
    expect(vp.screenToWorldX(180)).toBe(60);
  });

  it('handles scroll offset', () => {
    const vp = new Viewport(30, 3, 1200);
    expect(vp.worldToScreenX(60)).toBe(90);
  });

  it('zooms centered on cursor', () => {
    const vp = new Viewport(0, 3, 1200);
    const worldBefore = vp.screenToWorldX(600);
    vp.zoom(4.5, 600);
    const worldAfter = vp.screenToWorldX(600);
    expect(Math.abs(worldBefore - worldAfter)).toBeLessThan(0.01);
    expect(vp.scale).toBe(4.5);
  });

  it('clamps scale to min/max', () => {
    const vp = new Viewport(0, 0.5, 1200);
    vp.zoom(0.05, 600);
    expect(vp.scale).toBeGreaterThanOrEqual(0.1);
    const vp2 = new Viewport(0, 50, 1200);
    vp2.zoom(100, 600);
    expect(vp2.scale).toBeLessThanOrEqual(60);
  });
});
