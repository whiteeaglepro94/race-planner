// packages/client/src/components/StatusBar.tsx
import { useRaceStore } from '../store/useRaceStore';

export function StatusBar() {
  const drivers = useRaceStore((s) => s.drivers);
  const stints = useRaceStore((s) => s.stints);
  const config = useRaceStore((s) => s.raceConfig);

  return (
    <div style={{ display: 'flex', gap: 16, padding: '6px 16px', background: '#0d0d1a', borderTop: '1px solid #333', fontSize: 11, color: '#aaa', overflowX: 'auto' }}>
      {drivers.map((d) => {
        const driverStints = stints.filter((s) => s.driverId === d.id);
        const totalMin = driverStints.reduce((sum, s) => sum + s.durationMinutes, 0);
        const hh = Math.floor(totalMin / 60);
        const mm = totalMin % 60;
        const maxMin = config.durationMinutes / drivers.length;
        return (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: `3px solid ${d.color}`, paddingLeft: 6 }}>
            <span style={{ fontWeight: 'bold', color: d.color }}>{d.name}</span>
            <span>{hh} h {String(mm).padStart(2, '0')}</span>
            <span>/ max {Math.floor(maxMin / 60)} h</span>
            <span>{driverStints.length} relais</span>
          </div>
        );
      })}
    </div>
  );
}
