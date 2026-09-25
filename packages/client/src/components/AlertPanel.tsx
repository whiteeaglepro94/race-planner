// packages/client/src/components/AlertPanel.tsx
import { useState } from 'react';
import { useRaceStore } from '../store/useRaceStore';

const SEVERITY_COLORS = { error: '#e74c3c', warning: '#f5a623', info: '#3498db' };

export function AlertPanel() {
  const alerts = useRaceStore((s) => s.alerts);
  const [open, setOpen] = useState(false);

  if (alerts.length === 0) return null;

  return (
    <div style={{ background: '#1a1a2e', borderTop: '1px solid #333' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', background: 'none', border: 'none', color: '#f5a623', padding: '4px 16px', cursor: 'pointer', textAlign: 'left', fontSize: 11 }}>
        {alerts.length} alerte{alerts.length > 1 ? 's' : ''} {open ? '▲' : '▼'}
      </button>
      {open && (
        <div style={{ padding: '0 16px 8px', maxHeight: 150, overflowY: 'auto' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 11, padding: '2px 0', color: SEVERITY_COLORS[a.severity] }}>
              [{a.severity.toUpperCase()}] {a.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
