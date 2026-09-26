import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';

export function InfoBar() {
  const config = useRaceStore((s) => s.raceConfig);
  const drivers = useRaceStore((s) => s.drivers);
  const stints = useRaceStore((s) => s.stints);
  const t = useTheme();

  const sorted = [...stints].sort((a, b) => a.order - b.order);
  const firstStint = sorted[0];
  const firstDriver = drivers.find((d) => d.id === firstStint?.driverId);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 16px',
      background: t.bgCanvas,
      borderBottom: `1px solid ${t.border}`,
      fontSize: 11,
      color: t.textMuted,
      gap: 16,
      flexWrap: 'wrap',
      transition: 'background 1.5s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: t.green }} />
          <span>Départ : </span>
          <b style={{ color: firstDriver?.color ?? t.textPrimary }}>{firstDriver?.name ?? '—'}</b>
          <span> à {config.startTime}</span>
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: t.accent }} />
          Se recale en course : le passé est mesuré, le plan restant est re-résolu
        </span>
      </div>

      <div style={{ color: t.textFaint }}>
        Pré-remplie depuis le <b style={{ color: t.textPrimary }}>plan global</b> + <b style={{ color: t.textPrimary }}>équipage</b> · glisse ou clique un relais pour le réaffecter
      </div>
    </div>
  );
}
