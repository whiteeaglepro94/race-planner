import { useRaceStore } from '../store/useRaceStore';
import { useTheme, type Theme } from '../hooks/useTheme';

function buildStyles(t: Theme): Record<string, React.CSSProperties> {
  return {
    container: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
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
    headerOrange: {
      fontSize: 9,
      fontWeight: 700,
      color: t.accent,
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
    title: {
      fontSize: 15,
      fontWeight: 700,
      color: t.accent,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 11,
      color: t.textMuted,
    },
    toggle: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
      fontSize: 13,
      color: t.textPrimary,
      cursor: 'pointer',
    },
    timeInput: {
      width: 90,
      padding: '4px 6px',
      background: t.bgCard,
      color: t.textPrimary,
      border: `1px solid ${t.borderSubtle}`,
      borderRadius: 4,
      fontSize: 14,
      fontWeight: 700,
    },
    helperText: {
      fontSize: 10,
      color: t.textFaint,
      marginTop: 4,
      lineHeight: '1.3',
    },
    deleteBtn: {
      padding: '6px 14px',
      background: t.redBg,
      color: t.red,
      border: `1px solid ${t.red}`,
      borderRadius: 4,
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: 8,
    },
  };
}

export function PitStopDetailPanel() {
  const selectedId = useRaceStore((s) => s.selectedPitStopId);
  const pitStop = useRaceStore((s) => s.pitStops.find((p) => p.id === s.selectedPitStopId));
  const updatePitStop = useRaceStore((s) => s.updatePitStop);
  const removePitStop = useRaceStore((s) => s.removePitStop);
  const t = useTheme();
  const styles = buildStyles(t);

  if (!pitStop || !selectedId) return null;

  const update = (partial: Record<string, unknown>) => updatePitStop(selectedId, partial);

  return (
    <div style={styles.container}>
      <div style={{ ...styles.col, borderTop: `3px solid ${t.accent}` }}>
        <div style={styles.headerOrange}>Pit stop</div>
        <div style={styles.title}>Arrêt planifié</div>
        <div style={styles.subtitle}>position manuelle sur la frise</div>
      </div>

      <div style={{ ...styles.col, borderTop: `3px solid ${t.borderSubtle}` }}>
        <div style={styles.headerGrey}>Horaire</div>
        <input
          type="time"
          value={pitStop.time}
          onChange={(e) => update({ time: e.target.value })}
          style={styles.timeInput}
        />
        <div style={styles.helperText}>glissez le marqueur ou saisissez l'heure</div>
      </div>

      <div style={{ ...styles.col, borderTop: `3px solid ${t.borderSubtle}` }}>
        <div style={styles.headerGrey}>Actions</div>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={pitStop.tireChange}
            onChange={(e) => update({ tireChange: e.target.checked })}
          />
          Changement de pneus
        </label>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={pitStop.refuel}
            onChange={(e) => update({ refuel: e.target.checked })}
          />
          Ravitaillement
        </label>
      </div>

      <div style={{ ...styles.col, borderTop: `3px solid ${t.red}` }}>
        <div style={{ ...styles.headerGrey, color: t.red }}>Supprimer</div>
        <button
          style={styles.deleteBtn}
          onClick={() => removePitStop(selectedId)}
        >
          Supprimer ce pit stop
        </button>
        <div style={styles.helperText}>ou touche Suppr sur la frise</div>
      </div>

    </div>
  );
}
