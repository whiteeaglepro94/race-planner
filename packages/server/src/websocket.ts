import type { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '@race-planner/shared';

export function handleMessage(
  ws: WebSocket,
  message: ClientMessage,
  wss: WebSocketServer
): void {
  switch (message.type) {
    case 'list-plans':
      send(ws, { type: 'plan-list', plans: [] });
      break;

    case 'save-plan':
      send(ws, { type: 'plan-saved', id: message.plan.id });
      break;

    case 'load-plan':
      send(ws, { type: 'error', message: `Plan ${message.id} not found` });
      break;

    case 'delete-plan':
      send(ws, { type: 'error', message: 'Not implemented' });
      break;

    case 'export':
      send(ws, { type: 'error', message: 'Not implemented' });
      break;

    case 'iracing-connect':
      send(ws, { type: 'iracing-status', connected: false });
      break;

    case 'iracing-disconnect':
      send(ws, { type: 'iracing-status', connected: false });
      break;

    default:
      send(ws, { type: 'error', message: 'Unknown message type' });
  }
}

export function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export function broadcast(wss: WebSocketServer, message: ServerMessage): void {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}
