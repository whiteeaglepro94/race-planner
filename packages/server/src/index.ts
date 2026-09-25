import { createServer as createHttpServer, type Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { handleMessage } from './websocket.js';

let httpServer: Server | null = null;
let wss: WebSocketServer | null = null;

export async function createServer(port: number): Promise<number> {
  httpServer = createHttpServer();
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (raw: Buffer) => {
      try {
        const message = JSON.parse(raw.toString());
        handleMessage(ws, message, wss!);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });
  });

  return new Promise((resolve) => {
    httpServer!.listen(port, () => {
      const addr = httpServer!.address();
      const assignedPort = typeof addr === 'object' && addr ? addr.port : port;
      console.log(`Race Planner server on port ${assignedPort}`);
      resolve(assignedPort);
    });
  });
}

export async function stopServer(): Promise<void> {
  if (wss) {
    for (const client of wss.clients) {
      client.close();
    }
    wss.close();
    wss = null;
  }
  if (httpServer) {
    await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    httpServer = null;
  }
}

if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')) {
  createServer(3001);
}
