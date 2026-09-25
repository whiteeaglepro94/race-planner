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
