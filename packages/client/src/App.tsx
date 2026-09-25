import './components/global.css';
import './App.css';
import { TopBar } from './components/TopBar';
import { ToolBar } from './components/ToolBar';
import { DriverBar } from './components/DriverBar';
import { TimelineCanvas } from './canvas/TimelineCanvas';
import { StintDetailPanel } from './components/StintDetailPanel';
import { StatusBar } from './components/StatusBar';
import { AlertPanel } from './components/AlertPanel';
import { LivePanel } from './components/LivePanel';
import { useWebSocket } from './hooks/useWebSocket';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRaceStore } from './store/useRaceStore';

export function App() {
  const { send, connected } = useWebSocket('ws://localhost:3001');
  useAutoSave(send);
  useKeyboardShortcuts();

  const handleSave = () => {
    const s = useRaceStore.getState();
    send({
      type: 'save-plan',
      plan: { id: s.raceConfig.id, config: s.raceConfig, drivers: s.drivers, stints: s.stints, pitStops: s.pitStops, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
  };

  const handleExport = (format: 'pdf' | 'png' | 'csv') => {
    const s = useRaceStore.getState();
    send({
      type: 'export',
      format,
      plan: { id: s.raceConfig.id, config: s.raceConfig, drivers: s.drivers, stints: s.stints, pitStops: s.pitStops, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
  };

  return (
    <div className="app">
      <TopBar />
      <ToolBar onSave={handleSave} onExport={handleExport} />
      <DriverBar />
      <div className="app__timeline">
        <TimelineCanvas />
      </div>
      <LivePanel
        onConnect={() => send({ type: 'iracing-connect' })}
        onDisconnect={() => send({ type: 'iracing-disconnect' })}
      />
      <AlertPanel />
      <StintDetailPanel />
      <StatusBar />
    </div>
  );
}
