import { useLiveStore } from '../store/useLiveStore';
import { useTheme } from '../hooks/useTheme';
import type { SessionDriver } from '@race-planner/shared';

function formatLap(seconds: number): string {
  if (seconds <= 0) return '—';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toFixed(1);
  return `${min}:${sec.padStart(4, '0')}`;
}

function formatGap(seconds: number): string {
  if (Math.abs(seconds) < 0.01) return '—';
  const sign = seconds > 0 ? '+' : '';
  return `${sign}${seconds.toFixed(1)}s`;
}

function CompareRow({ label, playerVal, rivalVal, unit, t }: {
  label: string; playerVal: string; rivalVal: string; unit?: string; lowerIsBetter?: boolean; t: ReturnType<typeof useTheme>;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 11, padding: '2px 0' }}>
      <span style={{ width: 100, color: t.textMuted }}>{label}</span>
      <span style={{ width: 90, color: t.green, fontWeight: 600 }}>{playerVal}{unit ?? ''}</span>
      <span style={{ width: 90, color: t.orange, fontWeight: 600 }}>{rivalVal}{unit ?? ''}</span>
    </div>
  );
}

export function DriversPanel() {
  const active = useLiveStore((s) => s.active);
  const drivers = useLiveStore((s) => s.sessionDrivers);
  const compareIdx = useLiveStore((s) => s.compareCarIdx);
  const setCompare = useLiveStore((s) => s.setCompareCarIdx);
  const t = useTheme();

  if (!active || drivers.length === 0) return null;

  const player = drivers.find((d) => d.isPlayer);
  const rival = compareIdx !== null ? drivers.find((d) => d.carIdx === compareIdx) : null;

  const cellStyle: React.CSSProperties = {
    padding: '3px 8px',
    fontSize: 11,
    borderBottom: `1px solid ${t.border}`,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      background: t.bgCanvas,
      borderTop: `1px solid ${t.border}`,
      maxHeight: 280,
      overflow: 'auto',
      display: 'flex',
      transition: 'background 1.5s ease',
    }}>
      {/* Tableau des pilotes */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '6px 16px 2px', fontSize: 11, fontWeight: 700, color: t.textPrimary, textTransform: 'uppercase', letterSpacing: 1 }}>
          Pilotes en session ({drivers.length})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: t.textMuted, fontSize: 10, textTransform: 'uppercase' }}>
              <th style={{ ...cellStyle, textAlign: 'left' }}>Pos</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>#</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>Pilote</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>Équipe</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>Classe</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>Voiture</th>
              <th style={{ ...cellStyle, textAlign: 'right' }}>Tour</th>
              <th style={{ ...cellStyle, textAlign: 'right' }}>Dernier</th>
              <th style={{ ...cellStyle, textAlign: 'right' }}>Meilleur</th>
              <th style={{ ...cellStyle, textAlign: 'center' }}>Pit</th>
              <th style={{ ...cellStyle, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => {
              const isSelected = compareIdx === d.carIdx;
              const rowBg = d.isPlayer ? t.greenBg : isSelected ? (t.night ? '#1a1208' : '#1c1a0d') : 'transparent';
              return (
                <tr key={d.carIdx} style={{ background: rowBg }}>
                  <td style={{ ...cellStyle, color: t.textPrimary, fontWeight: 700 }}>P{d.position}</td>
                  <td style={{ ...cellStyle, color: t.textSecondary }}>
                    <span style={{ borderLeft: `3px solid ${d.carClassColor ?? '#555'}`, paddingLeft: 5 }}>
                      {d.carNumber}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: d.isPlayer ? t.green : t.textPrimary, fontWeight: d.isPlayer ? 700 : 400 }}>
                    {d.name}
                    {d.isPlayer && <span style={{ color: t.green, fontSize: 9, marginLeft: 4 }}>(VOUS)</span>}
                  </td>
                  <td style={{ ...cellStyle, color: t.textMuted }}>{d.teamName || '—'}</td>
                  <td style={{ ...cellStyle }}>
                    <span style={{
                      display: 'inline-block',
                      background: d.carClassColor ?? '#555',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 3,
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                      lineHeight: '14px',
                    }}>
                      {d.carClass || '?'}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: t.textMuted, fontSize: 10 }}>{d.carName || '—'}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: t.textSecondary }}>{d.lap}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: t.textSecondary }}>{formatLap(d.lastLapTime)}</td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: t.blue }}>{formatLap(d.bestLapTime)}</td>
                  <td style={{ ...cellStyle, textAlign: 'center', color: d.isOnPitRoad ? t.red : t.textFaint }}>
                    {d.isOnPitRoad ? 'PIT' : '—'}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    {!d.isPlayer && (
                      <button
                        onClick={() => setCompare(isSelected ? null : d.carIdx)}
                        style={{
                          background: isSelected ? t.orange : t.bgElevated,
                          color: isSelected ? '#000' : t.textMuted,
                          border: `1px solid ${isSelected ? t.orange : t.borderSubtle}`,
                          borderRadius: 4,
                          padding: '1px 8px',
                          fontSize: 9,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {isSelected ? 'COMPARER' : 'VS'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Panneau de comparaison */}
      {player && rival && (
        <div style={{
          width: 300,
          borderLeft: `1px solid ${t.border}`,
          padding: '8px 16px',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            Comparaison
          </div>

          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: t.textMuted, marginBottom: 6 }}>
            <span style={{ width: 100 }}></span>
            <span style={{ width: 90, color: t.green, fontWeight: 700 }}>#{player.carNumber} (Vous)</span>
            <span style={{ width: 90, color: t.orange, fontWeight: 700 }}>#{rival.carNumber}</span>
          </div>

          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 6 }}>
            <CompareRow t={t} label="Position" playerVal={`P${player.position}`} rivalVal={`P${rival.position}`} />
            <CompareRow t={t} label="Pos. classe" playerVal={`P${player.classPosition}`} rivalVal={`P${rival.classPosition}`} />
            <CompareRow t={t} label="Tour" playerVal={String(player.lap)} rivalVal={String(rival.lap)} />
            <CompareRow t={t} label="Dernier tour" playerVal={formatLap(player.lastLapTime)} rivalVal={formatLap(rival.lastLapTime)} lowerIsBetter />
            <CompareRow t={t} label="Meilleur tour" playerVal={formatLap(player.bestLapTime)} rivalVal={formatLap(rival.bestLapTime)} lowerIsBetter />
            <CompareRow t={t} label="Écart" playerVal="—" rivalVal={formatGap(rival.gapToLeader)} />
            <CompareRow t={t} label="En stand" playerVal={player.isOnPitRoad ? 'Oui' : 'Non'} rivalVal={rival.isOnPitRoad ? 'Oui' : 'Non'} />
            <CompareRow t={t} label="iRating" playerVal={String(player.iRating)} rivalVal={String(rival.iRating)} />
          </div>

          {/* Delta résumé */}
          <div style={{
            marginTop: 8,
            padding: '6px 8px',
            background: t.bgCard,
            borderRadius: 4,
            fontSize: 11,
          }}>
            <div style={{ color: t.textMuted, marginBottom: 4 }}>Delta tours au tour</div>
            {player.bestLapTime > 0 && rival.bestLapTime > 0 ? (
              <span style={{
                color: player.bestLapTime <= rival.bestLapTime ? t.green : t.red,
                fontWeight: 700,
                fontSize: 14,
              }}>
                {player.bestLapTime <= rival.bestLapTime ? '−' : '+'}{Math.abs(rival.bestLapTime - player.bestLapTime).toFixed(2)}s
              </span>
            ) : (
              <span style={{ color: t.textFaint }}>En attente de données...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
