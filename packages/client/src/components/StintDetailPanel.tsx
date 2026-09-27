import { useState, useEffect } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import { useTheme, type Theme } from '../hooks/useTheme';

const TIRE_LABELS: Record<string, string> = { dry: 'Secs', wet: 'Pluie', intermediate: 'Intermédiaires' };
const CONDITION_LABELS: Record<string, string> = { new: 'train neuf au départ du relais', used: 'usagés — déjà roulés' };

function formatLapTime(seconds: number | undefined): string {
  if (!seconds) return '—';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toFixed(1);
  return `${min}:${sec.padStart(4, '0')}`;
}

function buildStyles(t: Theme): Record<string, React.CSSProperties> {
  return {
    empty: {
      padding: '12px 16px',
      background: t.bgCanvas,
      borderTop: `1px solid ${t.border}`,
      textAlign: 'center',
      fontSize: 12,
      transition: 'background 1.5s ease',
    },
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 0,
      background: t.bgCanvas,
      borderTop: `1px solid ${t.border}`,
      transition: 'background 1.5s ease',
    },
    col: {
      padding: '10px 14px',
      borderRight: `1px solid ${t.bgCard}`,
      minHeight: 100,
    },
    headerRed: {
      fontSize: 9,
      fontWeight: 700,
      color: t.red,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    headerGrey: {
      fontSize: 9,
      fontWeight: 700,
      color: t.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    headerOrange: {
      fontSize: 9,
      fontWeight: 700,
      color: t.accent,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    relaisTitle: {
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 4,
    },
    relaisSubtitle: {
      fontSize: 11,
      color: t.textMuted,
    },
    select: {
      width: '100%',
      padding: '4px 6px',
      background: t.bgCard,
      color: t.textPrimary,
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 4,
      fontSize: 13,
    },
    selectInline: {
      padding: '3px 4px',
      background: t.bgCard,
      color: t.textPrimary,
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 4,
      fontSize: 11,
    },
    helperText: {
      fontSize: 10,
      color: t.textFaint,
      marginTop: 4,
      lineHeight: '1.3',
    },
    tireIcon: {
      fontSize: 14,
      color: t.accent,
    },
    tireDetail: {
      fontSize: 11,
      color: t.textSecondary,
      marginTop: 4,
    },
    radioLabel: {
      fontSize: 11,
      color: t.textMuted,
      display: 'flex',
      alignItems: 'center',
      gap: 3,
    },
    valueRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    fuelValue: {
      fontSize: 14,
      fontWeight: 700,
      color: t.textPrimary,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    numberInput: {
      width: 40,
      padding: '3px 4px',
      background: t.bgCard,
      color: t.textPrimary,
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 4,
      fontSize: 14,
      fontWeight: 700,
      textAlign: 'center' as const,
    },
    chronoValue: {
      fontSize: 22,
      fontWeight: 700,
      color: t.textPrimary,
      marginBottom: 4,
    },
    chronoInput: {
      width: 70,
      padding: '3px 6px',
      background: t.bgCard,
      color: t.textPrimary,
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 4,
      fontSize: 11,
    },
    textarea: {
      width: '100%',
      background: t.bgCard,
      color: t.textPrimary,
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 4,
      resize: 'vertical' as const,
      padding: '4px 6px',
      fontSize: 11,
      lineHeight: '1.4',
    },
  };
}

function isValidTime(v: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(v);
}

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(m: number): string {
  const total = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function StintTimeEditor({ stint, driver, update, styles, t }: {
  stint: { id: string; startTime: string; endTime: string; durationMinutes: number; locked: boolean };
  driver: { name: string; color: string } | undefined;
  update: (partial: Record<string, unknown>) => void;
  styles: Record<string, React.CSSProperties>;
  t: Theme;
}) {
  const [startInput, setStartInput] = useState(stint.startTime);
  const [endInput, setEndInput] = useState(stint.endTime);

  useEffect(() => { setStartInput(stint.startTime); }, [stint.startTime]);
  useEffect(() => { setEndInput(stint.endTime); }, [stint.endTime]);

  const commitStart = () => {
    if (!isValidTime(startInput)) { setStartInput(stint.startTime); return; }
    const [h, m] = startInput.split(':').map(Number);
    const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const endMin = timeToMin(stint.endTime);
    let dur = endMin - timeToMin(v);
    if (dur <= 0) dur += 1440;
    update({ startTime: v, durationMinutes: dur });
    setStartInput(v);
  };

  const commitEnd = () => {
    if (!isValidTime(endInput)) { setEndInput(stint.endTime); return; }
    const [h, m] = endInput.split(':').map(Number);
    const v = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const startMin = timeToMin(stint.startTime);
    let dur = timeToMin(v) - startMin;
    if (dur <= 0) dur += 1440;
    update({ endTime: v, durationMinutes: dur });
    setEndInput(v);
  };

  const durH = Math.floor(stint.durationMinutes / 60);
  const durM = stint.durationMinutes % 60;
  const durStr = durH > 0 ? `${durH}h${String(durM).padStart(2, '0')}` : `${durM} min`;

  const timeInput: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${t.borderSubtle}`,
    borderRadius: 4,
    color: driver?.color ?? '#5ddfde',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: '"Segoe UI Mono", "Consolas", monospace',
    width: 58,
    textAlign: 'center',
    outline: 'none',
    padding: '1px 3px',
  };

  return (
    <div style={{ ...styles.col, borderTop: `3px solid ${driver?.color ?? '#e74c3c'}` }}>
      <div style={styles.headerRed}>Relais sélectionné</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: driver?.color ?? '#5ddfde' }}>{driver?.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
          onBlur={commitStart}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          maxLength={5}
          style={timeInput}
        />
        <span style={{ color: t.textMuted, fontSize: 14 }}>→</span>
        <input
          type="text"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
          onBlur={commitEnd}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          maxLength={5}
          style={timeInput}
        />
      </div>
      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
        Durée : {durStr} — relais {stint.locked ? 'verrouillé' : 'simple'}
      </div>
    </div>
  );
}

export function StintDetailPanel() {
  const selectedId = useRaceStore((s) => s.selectedStintId);
  const stint = useRaceStore((s) => s.stints.find((st) => st.id === s.selectedStintId));
  const drivers = useRaceStore((s) => s.drivers);
  const raceConfig = useRaceStore((s) => s.raceConfig);
  const updateStint = useRaceStore((s) => s.updateStint);
  const driver = drivers.find((d) => d.id === stint?.driverId);
  const t = useTheme();
  const styles = buildStyles(t);

  if (!stint || !selectedId) {
    return (
      <div style={styles.empty}>
        <span style={{ color: t.textFaint }}>Cliquez sur un relais pour voir ses détails</span>
      </div>
    );
  }

  const update = (partial: Record<string, unknown>) => updateStint(selectedId, partial);
  const fuelConsoPct = raceConfig.fuelCapacity > 0
    ? ((raceConfig.fuelPerLap / raceConfig.fuelCapacity) * 100).toFixed(2)
    : '?';

  return (
    <div style={styles.container}>
      {/* Col 1: Relais sélectionné */}
      <StintTimeEditor stint={stint} driver={driver} update={update} styles={styles} t={t} />

      {/* Col 2: Pilote */}
      <div style={{ ...styles.col, borderTop: `3px solid ${t.borderSubtle}` }}>
        <div style={styles.headerGrey}>Pilote</div>
        <select
          value={stint.driverId}
          onChange={(e) => update({ driverId: e.target.value })}
          style={styles.select}
        >
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div style={styles.helperText}>proposé pour équilibrer le temps de volant</div>
      </div>

      {/* Col 3: Pneus prévus */}
      <div style={{ ...styles.col, borderTop: `3px solid ${t.borderSubtle}` }}>
        <div style={styles.headerGrey}>Pneus prévus</div>
        <div style={styles.valueRow}>
          <span style={styles.tireIcon}>◉</span>
          <select
            value={stint.tireCompound}
            onChange={(e) => update({ tireCompound: e.target.value })}
            style={{ ...styles.selectInline, flex: 1 }}
          >
            <option value="dry">Secs</option>
            <option value="wet">Pluie</option>
            <option value="intermediate">Intermédiaires</option>
          </select>
        </div>
        <div style={styles.tireDetail}>
          {TIRE_LABELS[stint.tireCompound]} — {CONDITION_LABELS[stint.tireCondition]}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <label style={styles.radioLabel}>
            <input type="radio" checked={stint.tireCondition === 'new'} onChange={() => update({ tireCondition: 'new' })} />
            Neuf
          </label>
          <label style={styles.radioLabel}>
            <input type="radio" checked={stint.tireCondition === 'used'} onChange={() => update({ tireCondition: 'used' })} />
            Usagé
          </label>
        </div>
        <div style={{ fontSize: 10, color: t.textFaint, marginTop: 4 }}>stock : 3 jeux</div>
      </div>

      {/* Col 4: Carburant */}
      <div style={{ ...styles.col, borderTop: `3px solid ${t.borderSubtle}` }}>
        <div style={styles.headerGrey}>Carburant</div>
        <div style={styles.fuelValue}>
          <input
            type="number"
            value={stint.fuelLoads}
            min={0}
            onChange={(e) => update({ fuelLoads: Number(e.target.value) })}
            style={styles.numberInput}
          />
          <span> plein(s)</span>
        </div>
        <div style={styles.helperText}>
          conso cible {fuelConsoPct} %/tour (plan global)
        </div>
      </div>

      {/* Col 5: Chrono cible */}
      <div style={{ ...styles.col, borderTop: `3px solid ${t.borderSubtle}` }}>
        <div style={styles.headerGrey}>Chrono cible</div>
        <div style={styles.chronoValue}>
          {stint.targetLapTimeSeconds ? formatLapTime(stint.targetLapTimeSeconds) : '—'}
        </div>
        <input
          type="number"
          step={0.1}
          value={stint.targetLapTimeSeconds ?? ''}
          placeholder="sec"
          onChange={(e) => update({ targetLapTimeSeconds: e.target.value ? Number(e.target.value) : undefined })}
          style={styles.chronoInput}
        />
        <div style={styles.helperText}>référence mémorisée — se recale en course</div>
      </div>

      {/* Col 6: Brief de passation */}
      <div style={{ ...styles.col, borderTop: `3px solid ${t.accent}` }}>
        <div style={styles.headerOrange}>Brief de passation</div>
        <textarea
          value={stint.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={3}
          placeholder="Préparé en course, dit à la radio au changement de pilote."
          style={styles.textarea}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ fontSize: 10, color: t.textMuted }}>état de piste, position, menaces — au moment du relais</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11, color: t.textMuted }}>
          <input type="checkbox" checked={stint.locked} onChange={(e) => update({ locked: e.target.checked })} />
          Verrouiller ce relais
        </label>
      </div>
    </div>
  );
}
