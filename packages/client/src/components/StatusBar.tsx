import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';

export function StatusBar() {
  const drivers = useRaceStore((s) => s.drivers);
  const stints = useRaceStore((s) => s.stints);
  const config = useRaceStore((s) => s.raceConfig);
  const showTireIcons = useRaceStore((s) => s.showTireIcons);
  const showFuelIcons = useRaceStore((s) => s.showFuelIcons);
  const setShowTireIcons = useRaceStore((s) => s.setShowTireIcons);
  const setShowFuelIcons = useRaceStore((s) => s.setShowFuelIcons);
  const t = useTheme();

  const maxMinutes = config.durationMinutes > 0 && drivers.length > 0
    ? Math.floor(config.durationMinutes * 14 / 24)
    : 840;

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h} h ${String(m).padStart(2, '0')}`;
  };

  const formatMax = (min: number) => {
    const h = Math.floor(min / 60);
    return `max ${h} h`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '6px 16px',
      background: t.bgCanvas,
      borderTop: `1px solid ${t.border}`,
      fontSize: 11,
      color: t.textMuted,
      overflowX: 'auto',
      flexWrap: 'nowrap',
      transition: 'background 1.5s ease',
    }}>
      {/* Toggles */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', cursor: 'pointer' }}>
        <input type="checkbox" checked={showTireIcons} onChange={(e) => setShowTireIcons(e.target.checked)} style={{ accentColor: t.red }} />
        <span>changement de pneus</span>
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', cursor: 'pointer' }}>
        <input type="checkbox" checked={showFuelIcons} onChange={(e) => setShowFuelIcons(e.target.checked)} style={{ accentColor: t.red }} />
        <span>essence seule</span>
      </label>

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: t.border, flexShrink: 0 }} />

      {/* Driver gauges */}
      {drivers.map((d) => {
        const driverStints = stints.filter((s) => s.driverId === d.id);
        const totalMin = driverStints.reduce((sum, s) => sum + s.durationMinutes, 0);
        const pct = Math.min(100, (totalMin / maxMinutes) * 100);

        return (
          <div key={d.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: d.color,
              flexShrink: 0,
            }} />

            <span style={{
              color: d.color,
              fontWeight: 700,
              fontSize: 11,
              maxWidth: 50,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {d.name}
            </span>

            <div style={{
              width: 60,
              height: 6,
              background: t.bgElevated,
              borderRadius: 3,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: d.color,
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>

            <span style={{ color: t.textPrimary, fontWeight: 600, fontSize: 10 }}>
              {formatTime(totalMin)}
            </span>
            <span style={{ color: t.textFaint, fontSize: 10 }}>
              / {formatMax(maxMinutes)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
