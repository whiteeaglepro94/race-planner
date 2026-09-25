import type { WebSocket, WebSocketServer } from 'ws';
import type { ClientMessage, ServerMessage, LiveRaceData } from '@race-planner/shared';
import { savePlan, loadPlan, listPlans, deletePlan } from './storage/plans.js';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { IracingSession } from './iracing/session.js';

const DATA_DIR = resolve(process.cwd(), 'data', 'plans');
let iracingSession: IracingSession | null = null;

export async function handleMessage(
  ws: WebSocket,
  message: ClientMessage,
  wss: WebSocketServer
): Promise<void> {
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

    case 'export': {
      if (message.format === 'csv') {
        const { planToCSV } = await import('./export/csv.js');
        const csv = planToCSV(message.plan);
        const filePath = resolve(process.cwd(), 'data', 'exports', `${message.plan.id}.csv`);
        await mkdir(resolve(process.cwd(), 'data', 'exports'), { recursive: true });
        await writeFile(filePath, csv, 'utf-8');
        send(ws, { type: 'export-ready', url: `/exports/${message.plan.id}.csv` });
      } else if (message.format === 'pdf') {
        const { planToPDF } = await import('./export/pdf.js');
        const buf = await planToPDF(message.plan);
        const filePath = resolve(process.cwd(), 'data', 'exports', `${message.plan.id}.pdf`);
        await mkdir(resolve(process.cwd(), 'data', 'exports'), { recursive: true });
        await writeFile(filePath, buf);
        send(ws, { type: 'export-ready', url: `/exports/${message.plan.id}.pdf` });
      }
      break;
    }

    case 'iracing-connect': {
      if (!iracingSession) iracingSession = new IracingSession();
      iracingSession.connect(
        (data) => broadcast(wss, { type: 'iracing-data', data: data as LiveRaceData }),
        (connected) => broadcast(wss, { type: 'iracing-status', connected }),
      );
      break;
    }

    case 'iracing-disconnect': {
      iracingSession?.disconnect();
      broadcast(wss, { type: 'iracing-status', connected: false });
      break;
    }

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
