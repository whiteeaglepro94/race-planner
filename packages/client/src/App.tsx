import './components/global.css';
import './App.css';
import { TopBar } from './components/TopBar';
import { ToolBar } from './components/ToolBar';
import { TimelineCanvas } from './canvas/TimelineCanvas';
import { InfoBar } from './components/InfoBar';
import { StintDetailPanel } from './components/StintDetailPanel';
import { PitStopDetailPanel } from './components/PitStopDetailPanel';
import { StatusBar } from './components/StatusBar';
import { AlertPanel } from './components/AlertPanel';
import { LivePanel } from './components/LivePanel';
import { DriversPanel } from './components/DriversPanel';
import { FlagOverlay } from './components/FlagOverlay';
import { IracingImportModal } from './components/IracingImportModal';
import { useWebSocket } from './hooks/useWebSocket';
import { useAutoSave } from './hooks/useAutoSave';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePitDetection } from './hooks/usePitDetection';
import { useRaceStore } from './store/useRaceStore';
import { useCalendarStore } from './store/useCalendarStore';
import { useNightMode } from './hooks/useNightMode';
import { useRivalPitTracking } from './hooks/useRivalPitTracking';
import { EndurancePanel } from './components/EndurancePanel';

export function App() {
  const { send, connected } = useWebSocket('ws://localhost:3001');
  useAutoSave(send);
  useKeyboardShortcuts();
  usePitDetection();
  useRivalPitTracking();

  const isNight = useNightMode();

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
    <div className={`app${isNight ? ' night-mode' : ''}`}>
      <FlagOverlay />
      <TopBar />
      <ToolBar onSave={handleSave} onExport={handleExport} onDemoStart={() => send({ type: 'demo-start' })} onDemoStop={() => send({ type: 'demo-stop' })} onIracingImport={() => useCalendarStore.getState().setOpen(true)} />
      <div className="app__timeline">
        <TimelineCanvas />
      </div>
      <InfoBar />
      <DriversPanel />
      <LivePanel
        onConnect={() => send({ type: 'iracing-connect' })}
        onDisconnect={() => send({ type: 'iracing-disconnect' })}
      />
      <EndurancePanel />
      <AlertPanel />
      <StintDetailPanel />
      <PitStopDetailPanel />
      <StatusBar />
      <IracingImportModal />
    </div>
  );
}
