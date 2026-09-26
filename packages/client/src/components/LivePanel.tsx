import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';

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
  const t = useTheme();

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
    <div style={{ background: t.bgCanvas, padding: '8px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 24, alignItems: 'center', fontSize: 12, transition: 'background 1.5s ease' }}>
      <button onClick={handleToggle}
        style={{ background: active ? t.red : t.green, color: '#fff', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: 4, fontWeight: 'bold' }}>
        {active ? 'ARRÊTER SUIVI' : 'SUIVI EN COURSE'}
      </button>

      {!active && <span style={{ color: t.textFaint }}>Cliquez pour démarrer le suivi en temps réel</span>}

      {active && (
        <>
          <span style={{ color: connected ? t.green : t.red, fontWeight: 'bold' }}>
            {connected ? '● CONNECTÉ' : '● DÉCONNECTÉ'}
          </span>

          {data && (
            <>
              <span style={{ color: t.textPrimary }}>Position: <b>P{data.position}</b></span>
              <span style={{ color: t.textPrimary }}>Tour: <b>{data.currentLap}/{data.totalLaps}</b></span>
              <span style={{ color: t.textPrimary }}>Essence: <b>{data.fuelRemaining.toFixed(1)}L</b></span>
              <span style={{ color: t.textPrimary }}>Dernier: <b>{formatLapTime(data.lastLapTime)}</b></span>
              <span style={{ color: t.textPrimary }}>Meilleur: <b>{formatLapTime(data.bestLapTime)}</b></span>
              <span style={{ color: t.textPrimary }}>Piste: <b>{data.trackTemp.toFixed(0)}°C</b></span>
            </>
          )}

          {currentDriver && (
            <span style={{ color: currentDriver.color, fontWeight: 'bold' }}>
              Stint: {currentDriver.name}
            </span>
          )}

          {deltaText && (
            <span style={{ color: lastDev!.deltaMinutes > 0 ? t.red : t.green, fontWeight: 'bold' }}>
              {deltaText}
            </span>
          )}
        </>
      )}
    </div>
  );
}
