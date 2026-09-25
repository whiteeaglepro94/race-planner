// packages/client/src/components/ToolBar.tsx
import { useRaceStore } from '../store/useRaceStore';
import { distributeStints, autofillGaps, validatePlan } from '@race-planner/shared';

export function ToolBar({ onSave, onExport }: { onSave: () => void; onExport: (format: 'pdf' | 'png' | 'csv') => void }) {
  const store = useRaceStore.getState;
  const setStints = useRaceStore((s) => s.setStints);
  const setAlerts = useRaceStore((s) => s.setAlerts);

  const handleDistribute = () => {
    const { drivers, raceConfig, stints } = store();
    const locked = stints.filter((s) => s.locked);
    const result = distributeStints(drivers, raceConfig, locked);
    setStints(result);
  };

  const handleAutofill = () => {
    const { stints, drivers, raceConfig } = store();
    setStints(autofillGaps(stints, drivers, raceConfig));
  };

  const handleValidate = () => {
    const s = store();
    const alerts = validatePlan({ id: s.raceConfig.id, config: s.raceConfig, drivers: s.drivers, stints: s.stints, pitStops: s.pitStops, createdAt: '', updatedAt: '' });
    setAlerts(alerts);
  };

  const handleClear = () => {
    const { stints } = store();
    const locked = stints.filter((s) => s.locked);
    setStints(locked);
  };

  const btn = { background: '#2a2a3e', color: '#e0e0e0', border: '1px solid #444', padding: '6px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 12 };

  return (
    <div style={{ display: 'flex', gap: 8, padding: '6px 16px', borderBottom: '1px solid #333', flexWrap: 'wrap' }}>
      <span style={{ color: '#888', fontSize: 11, alignSelf: 'center' }}>Plan de course</span>
      <button style={{ ...btn, background: '#2d4a2d' }} onClick={handleDistribute}>⟳ Volant équilibré</button>
      <button style={{ ...btn, background: '#4a2d2d' }} onClick={handleAutofill}>↯ Remplissage auto</button>
      <button style={btn} onClick={handleValidate}>✓ Vérifier</button>
      <button style={btn} onClick={handleClear}>✕ Tout effacer</button>
      <div style={{ flex: 1 }} />
      <button style={btn} onClick={() => onExport('pdf')}>Export PDF</button>
      <button style={btn} onClick={() => onExport('csv')}>Export CSV</button>
      <button style={btn} onClick={onSave}>Sauvegarder</button>
    </div>
  );
}
