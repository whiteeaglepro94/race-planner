import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';

function formatLapTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toFixed(1);
  return `${min}:${sec.padStart(4, '0')}`;
}

export function LivePanel({ onConnect, onDisconnect }: { onConnect: () => void; onDisconnect: () => void }) {
  const { active, connected, data, deviations } = useLiveStore();
  const startFollowing = useLiveStore((s) => s.startFollowing);
  const stopFollowing = useLiveStore((s) => s.stopFollowing);
  const drivers = useRaceStore((s) => s.drivers);
  const stints = useRaceStore((s) => s.stints);
  const currentStintIdx = useLiveStore((s) => s.currentStintIndex);

  const currentStint = stints[currentStintIdx];
  const currentDriver = drivers.find((d) => d.id === currentStint?.driverId);
  const lastDev = deviations[deviations.length - 1];
  const deltaText = lastDev
    ? lastDev.deltaMinutes > 0
      ? `Retard ${lastDev.deltaMinutes} min`
      : `Avance ${Math.abs(lastDev.deltaMinutes)} min`
    : '';

  const handleToggle = () => {
    if (active) {
      stopFollowing();
      onDisconnect();
    } else {
      startFollowing();
      onConnect();
    }
  };

  return (
    <div style={{ background: '#0a0a18', padding: '8px 16px', borderTop: '1px solid #333', display: 'flex', gap: 24, alignItems: 'center', fontSize: 12 }}>
      <button onClick={handleToggle}
        style={{ background: active ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: 4, fontWeight: 'bold' }}>
        {active ? 'ARRÊTER SUIVI' : 'SUIVI EN COURSE'}
      </button>

      {!active && <span style={{ color: '#666' }}>Cliquez pour démarrer le suivi en temps réel</span>}

      {active && (
        <>
          <span style={{ color: connected ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
            {connected ? '● CONNECTÉ' : '● DÉCONNECTÉ'}
          </span>

          {data && (
            <>
              <span style={{ color: '#e0e0e0' }}>Position: <b>P{data.position}</b></span>
              <span style={{ color: '#e0e0e0' }}>Tour: <b>{data.currentLap}/{data.totalLaps}</b></span>
              <span style={{ color: '#e0e0e0' }}>Essence: <b>{data.fuelRemaining.toFixed(1)}L</b></span>
              <span style={{ color: '#e0e0e0' }}>Dernier: <b>{formatLapTime(data.lastLapTime)}</b></span>
              <span style={{ color: '#e0e0e0' }}>Meilleur: <b>{formatLapTime(data.bestLapTime)}</b></span>
              <span style={{ color: '#e0e0e0' }}>Piste: <b>{data.trackTemp}°C</b></span>
            </>
          )}

          {currentDriver && (
            <span style={{ color: currentDriver.color, fontWeight: 'bold' }}>
              Stint: {currentDriver.name}
            </span>
          )}

          {deltaText && (
            <span style={{ color: lastDev!.deltaMinutes > 0 ? '#e74c3c' : '#27ae60', fontWeight: 'bold' }}>
              {deltaText}
            </span>
          )}
        </>
      )}
    </div>
  );
}
