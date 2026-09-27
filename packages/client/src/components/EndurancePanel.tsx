import { useMemo } from 'react';
import { useLiveStore } from '../store/useLiveStore';
import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';
import type { RivalPitEvent } from '@race-planner/shared';

function formatDur(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

function formatElapsed(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

function formatLap(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

export function EndurancePanel() {
  const active = useLiveStore((s) => s.active);
  const data = useLiveStore((s) => s.data);
  const drivers = useLiveStore((s) => s.sessionDrivers);
  const rivalPits = useLiveStore((s) => s.rivalPitHistory);
  const elapsed = useLiveStore((s) => s.elapsedMinutes);
  const config = useRaceStore((s) => s.raceConfig);
  const stints = useRaceStore((s) => s.stints);
  const teamDrivers = useRaceStore((s) => s.drivers);
  const t = useTheme();

  const remainingMin = Math.max(0, config.durationMinutes - elapsed);
  const progressPct = config.durationMinutes > 0 ? Math.min(100, (elapsed / config.durationMinutes) * 100) : 0;

  const fuelEstimate = useMemo(() => {
    if (!data || config.fuelPerLap <= 0 || config.avgLapTimeSeconds <= 0) return null;
    const lapsRemaining = data.fuelRemaining / config.fuelPerLap;
    const minutesRemaining = lapsRemaining * (config.avgLapTimeSeconds / 60);
    return { lapsRemaining: Math.floor(lapsRemaining), minutesRemaining: Math.round(minutesRemaining) };
  }, [data, config.fuelPerLap, config.avgLapTimeSeconds]);

  const driverStats = useMemo(() => {
    return teamDrivers.map((d) => {
      const driverStints = stints.filter((s) => s.driverId === d.id);
      const totalMin = driverStints.reduce((sum, s) => sum + s.durationMinutes, 0);
      return { driver: d, stintCount: driverStints.length, totalMin };
    });
  }, [teamDrivers, stints]);

  const pitsByClass = useMemo(() => {
    const map = new Map<string, RivalPitEvent[]>();
    for (const e of rivalPits) {
      const key = e.carClass || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [rivalPits]);

  const recentPits = useMemo(() => {
    return [...rivalPits].reverse().slice(0, 30);
  }, [rivalPits]);

  const pitCountByDriver = useMemo(() => {
    const counts = new Map<number, number>();
    for (const e of rivalPits) {
      counts.set(e.carIdx, (counts.get(e.carIdx) || 0) + 1);
    }
    return counts;
  }, [rivalPits]);

  const classStandings = useMemo(() => {
    const classes = new Map<string, typeof drivers>();
    for (const d of drivers) {
      const key = d.carClass || 'Unknown';
      if (!classes.has(key)) classes.set(key, []);
      classes.get(key)!.push(d);
    }
    for (const [, list] of classes) {
      list.sort((a, b) => a.classPosition - b.classPosition);
    }
    return classes;
  }, [drivers]);

  const cellStyle: React.CSSProperties = {
    padding: '3px 8px',
    fontSize: 11,
    borderBottom: `1px solid ${t.border}`,
    whiteSpace: 'nowrap',
  };

  const sectionStyle: React.CSSProperties = {
    background: t.bgCard,
    borderRadius: 6,
    padding: '10px 14px',
    border: `1px solid ${t.border}`,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  };

  if (!active) {
    return (
      <div style={{ background: t.bgCanvas, padding: '16px', borderTop: `1px solid ${t.border}`, transition: 'background 1.5s ease' }}>
        <div style={{ color: t.textFaint, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          Panneau d'endurance — Activez le suivi en course pour voir les données en temps réel
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.bgCanvas, padding: '12px 16px', borderTop: `1px solid ${t.border}`, transition: 'background 1.5s ease' }}>
      {/* Header + progress */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, textTransform: 'uppercase', letterSpacing: 1 }}>
            Suivi Endurance
          </span>
          <span style={{ fontSize: 11, color: t.textMuted }}>
            {formatElapsed(elapsed)} / {formatElapsed(config.durationMinutes)} — <b style={{ color: t.accent }}>{progressPct.toFixed(1)}%</b>
          </span>
        </div>
        <div style={{ height: 4, background: t.bgElevated, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: t.accent, borderRadius: 2, transition: 'width 1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.textFaint, marginTop: 2 }}>
          <span>Restant : {formatElapsed(remainingMin)}</span>
          {data && <span>Tour {data.currentLap} — P{data.position}</span>}
        </div>
      </div>

      {/* Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        {/* Carburant */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Carburant</div>
          {data ? (
            <>
              <div style={{ fontSize: 20, fontWeight: 700, color: data.fuelRemaining < config.fuelPerLap * 3 ? t.red : t.green }}>
                {data.fuelRemaining.toFixed(1)} L
              </div>
              {fuelEstimate && (
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                  ~{fuelEstimate.lapsRemaining} tours restants ({fuelEstimate.minutesRemaining} min)
                </div>
              )}
              <div style={{ fontSize: 10, color: t.textFaint, marginTop: 2 }}>
                Conso : {config.fuelPerLap} L/tour — Réservoir : {config.fuelCapacity} L
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: t.textFaint }}>En attente...</div>
          )}
        </div>

        {/* Chronos */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Chronos</div>
          {data ? (
            <>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: t.textFaint }}>Dernier</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary }}>{formatLap(data.lastLapTime)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: t.textFaint }}>Meilleur</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.blue }}>{formatLap(data.bestLapTime)}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: t.textFaint, marginTop: 4 }}>
                Piste : {data.trackTemp.toFixed(0)}°C
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: t.textFaint }}>En attente...</div>
          )}
        </div>

        {/* Équipage */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Temps de volant</div>
          {driverStats.length > 0 ? driverStats.map((ds) => (
            <div key={ds.driver.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ds.driver.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: t.textPrimary, flex: 1 }}>{ds.driver.name}</span>
              <span style={{ fontSize: 11, color: t.textMuted }}>{ds.stintCount} relais</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: t.accent }}>{formatElapsed(ds.totalMin)}</span>
            </div>
          )) : (
            <div style={{ fontSize: 11, color: t.textFaint }}>Aucun pilote</div>
          )}
        </div>
      </div>

      {/* Rival pit history */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        {/* Historique des pits */}
        <div style={sectionStyle}>
          <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
            <span>Arrêts stands adverses</span>
            <span style={{ color: t.textFaint, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              {rivalPits.length} arrêts détectés
            </span>
          </div>
          {recentPits.length > 0 ? (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: t.textMuted, fontSize: 9, textTransform: 'uppercase' }}>
                    <th style={{ ...cellStyle, textAlign: 'left' }}>#</th>
                    <th style={{ ...cellStyle, textAlign: 'left' }}>Pilote</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>Classe</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>Tour</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>Durée</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>Type</th>
                    <th style={{ ...cellStyle, textAlign: 'center' }}>Nb arrêts</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPits.map((pit, i) => {
                    const totalStops = pitCountByDriver.get(pit.carIdx) ?? 0;
                    return (
                      <tr key={`${pit.carIdx}-${pit.pitInTime}-${i}`} style={{ background: pit.pitOutTime === null ? `${t.red}15` : 'transparent' }}>
                        <td style={{ ...cellStyle, color: t.textSecondary }}>{pit.carNumber}</td>
                        <td style={{ ...cellStyle, color: t.textPrimary, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pit.driverName}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            background: pit.carClassColor ?? '#555',
                            color: '#fff',
                            fontSize: 8,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 3,
                          }}>
                            {pit.carClass || '?'}
                          </span>
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center', color: t.textSecondary }}>T{pit.lapIn}</td>
                        <td style={{ ...cellStyle, textAlign: 'center', color: pit.pitOutTime === null ? t.red : t.textPrimary, fontWeight: 600 }}>
                          {pit.pitDurationSec !== null ? formatDur(pit.pitDurationSec) : 'EN STAND'}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          {pit.fuelOnly === null ? (
                            <span style={{ color: t.textFaint }}>—</span>
                          ) : pit.fuelOnly ? (
                            <span style={{ color: t.orange, fontWeight: 600 }}>Essence</span>
                          ) : (
                            <span style={{ color: t.blue, fontWeight: 600 }}>Pneus+Ess</span>
                          )}
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center', color: t.textMuted }}>{totalStops}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: t.textFaint, textAlign: 'center', padding: '12px 0' }}>
              Aucun arrêt détecté pour le moment
            </div>
          )}
        </div>

        {/* Résumé par classe */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Classement par classe</div>
          {classStandings.size > 0 ? (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {[...classStandings.entries()].map(([cls, list]) => (
                <div key={cls} style={{ marginBottom: 8 }}>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: list[0]?.carClassColor ?? t.textMuted,
                    textTransform: 'uppercase',
                    marginBottom: 3,
                    borderBottom: `1px solid ${t.border}`,
                    paddingBottom: 2,
                  }}>
                    {cls} ({list.length})
                  </div>
                  {list.slice(0, 5).map((d) => {
                    const stops = pitCountByDriver.get(d.carIdx) ?? 0;
                    return (
                      <div key={d.carIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        padding: '1px 0',
                        color: d.isPlayer ? t.green : t.textSecondary,
                        fontWeight: d.isPlayer ? 700 : 400,
                      }}>
                        <span style={{ width: 22, fontWeight: 700 }}>P{d.classPosition}</span>
                        <span style={{ width: 24 }}>#{d.carNumber}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                        <span style={{ color: t.textFaint, width: 36, textAlign: 'right' }}>T{d.lap}</span>
                        <span style={{ color: t.textFaint, width: 40, textAlign: 'right' }}>{stops} pit{stops !== 1 ? 's' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: t.textFaint, textAlign: 'center', padding: '12px 0' }}>
              En attente des données...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
