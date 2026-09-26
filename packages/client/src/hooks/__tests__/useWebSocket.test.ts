// @vitest-environment jsdom
// packages/client/src/hooks/__tests__/useWebSocket.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// Mock WebSocket
class MockWebSocket {
  static instance: MockWebSocket;
  static OPEN = 1;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1;
  send = vi.fn();
  close = vi.fn();
  constructor() { MockWebSocket.instance = this; }
}
vi.stubGlobal('WebSocket', MockWebSocket);

describe('useWebSocket', () => {
  it('connects and exposes send', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:3001'));
    act(() => { MockWebSocket.instance.onopen?.(); });
    expect(result.current.connected).toBe(true);
    act(() => { result.current.send({ type: 'list-plans' }); });
    expect(MockWebSocket.instance.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'list-plans' })
    );
  });
});
