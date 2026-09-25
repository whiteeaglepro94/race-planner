import type { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage } from '@race-planner/shared';
import { savePlan, loadPlan, listPlans, deletePlan } from './storage/plans.js';
import { resolve } from 'node:path';

const DATA_DIR = resolve(process.cwd(), 'data', 'plans');

export function handleMessage(
  ws: WebSocket,
  message: ClientMessage,
  wss: WebSocketServer
): void {
  switch (message.type) {
    case 'list-plans':
      listPlans(DATA_DIR).then((plans) => send(ws, { type: 'plan-list', plans }));
      break;

    case 'save-plan':
      savePlan(message.plan, DATA_DIR).then(() =>
        send(ws, { type: 'plan-saved', id: message.plan.id })
      );
      break;

    case 'load-plan':
      loadPlan(message.id, DATA_DIR)
        .then((plan) => send(ws, { type: 'plan-loaded', plan }))
        .catch(() => send(ws, { type: 'error', message: `Plan ${message.id} not found` }));
      break;

    case 'delete-plan':
      deletePlan(message.id, DATA_DIR).then(() =>
        send(ws, { type: 'plan-list', plans: [] })
      );
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
