import { useState } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import type { Driver } from '@race-planner/shared';

export function DriverChip({ driver }: { driver: Driver }) {
  const updateDriver = useRaceStore((s) => s.updateDriver);
  const removeDriver = useRaceStore((s) => s.removeDriver);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(driver.name);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: driver.color + '33', border: `2px solid ${driver.color}`, borderRadius: 4 }}>
      <input type="color" value={driver.color} onChange={(e) => updateDriver(driver.id, { color: e.target.value })}
        style={{ width: 16, height: 16, border: 'none', cursor: 'pointer', padding: 0 }} />
      {editing ? (
        <input value={name} onChange={(e) => setName(e.target.value)}
          onBlur={() => { updateDriver(driver.id, { name }); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { updateDriver(driver.id, { name }); setEditing(false); } }}
          autoFocus style={{ width: 80, background: 'transparent', color: '#e0e0e0', border: 'none', outline: 'none' }} />
      ) : (
        <span onDoubleClick={() => setEditing(true)} style={{ color: '#e0e0e0', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>
          ≡ {driver.name}
        </span>
      )}
      <button onClick={() => removeDriver(driver.id)}
        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>×</button>
    </div>
  );
}
