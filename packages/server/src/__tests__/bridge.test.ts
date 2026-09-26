import { describe, it, expect } from 'vitest';
import { IracingBridge } from '../iracing/bridge';

describe('IracingBridge', () => {
  it('can be instantiated', () => {
    const bridge = new IracingBridge();
    expect(bridge).toBeDefined();
  });

  it('accepts a data callback', () => {
    const bridge = new IracingBridge();
    const cb = () => {};
    bridge.onData(cb);
    expect(bridge).toBeDefined();
  });
});
