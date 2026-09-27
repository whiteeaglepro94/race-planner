import { useEffect, useRef, useState, useCallback } from 'react';
import type { ClientMessage, ServerMessage } from '@race-planner/shared';
import { useRaceStore } from '../store/useRaceStore';
import { useLiveStore } from '../store/useLiveStore';
import { useCalendarStore } from '../store/useCalendarStore';

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onmessage = (e) => {
        const msg: ServerMessage = JSON.parse(e.data);
        switch (msg.type) {
          case 'plan-loaded': {
            const { config, drivers, stints, pitStops } = msg.plan;
            const store = useRaceStore.getState();
            store.setConfig(config);
            store.setStints(stints);
            store.setPitStops(pitStops);
            drivers.forEach((d) => store.addDriver(d));
            break;
          }
          case 'iracing-data': {
            const live = useLiveStore.getState();
            live.setLiveData(msg.data);
            const todSeconds = msg.data.sessionTimeOfDay;
            if (todSeconds > 0) {
              const todMinutes = todSeconds / 60;
              const startTime = useRaceStore.getState().raceConfig.startTime;
              const [sh, sm] = startTime.split(':').map(Number);
              const startMinutes = sh * 60 + sm;
              let elapsed = todMinutes - startMinutes;
              if (elapsed < -720) elapsed += 1440;
              if (elapsed < 0) elapsed = 0;
              live.setElapsedMinutes(elapsed);
            }
            break;
          }
          case 'iracing-drivers':
            useLiveStore.getState().setSessionDrivers(msg.drivers);
            break;
          case 'iracing-status':
            useLiveStore.getState().setConnected(msg.connected);
            if (msg.error) useLiveStore.getState().setError(msg.error);
            break;
          case 'iracing-api-auth': {
            const cal = useCalendarStore.getState();
            cal.setAuthLoading(false);
            cal.setAuthenticated(msg.success);
            if (msg.error) cal.setError(msg.error);
            break;
          }
          case 'iracing-api-seasons': {
            const cal = useCalendarStore.getState();
            cal.setSeries(msg.series);
            break;
          }
          case 'iracing-api-import': {
            useRaceStore.getState().setConfig(msg.config);
            useCalendarStore.getState().setOpen(false);
            break;
          }
          case 'error': {
            const cal = useCalendarStore.getState();
            if (cal.loading) {
              cal.setLoading(false);
              cal.setError(msg.message);
            }
            break;
          }
        }
      };
    }
    connect();
    return () => { wsRef.current?.close(); };
  }, [url]);

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send, connected };
}
