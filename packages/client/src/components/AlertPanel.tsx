import { useState } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';

export function AlertPanel() {
  const alerts = useRaceStore((s) => s.alerts);
  const [open, setOpen] = useState(false);
  const t = useTheme();

  if (alerts.length === 0) return null;

  const severityColors = { error: t.red, warning: t.accent, info: t.blue };

  return (
    <div style={{ background: t.bgCard, borderTop: `1px solid ${t.border}`, transition: 'background 1.5s ease' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', color: t.accent, padding: '4px 16px', cursor: 'pointer', textAlign: 'left', fontSize: 11 }}>
        {alerts.length} alerte{alerts.length > 1 ? 's' : ''} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{ padding: '0 16px 8px', maxHeight: 150, overflowY: 'auto' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 11, padding: '2px 0', color: severityColors[a.severity] }}>
              [{a.severity.toUpperCase()}] {a.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
