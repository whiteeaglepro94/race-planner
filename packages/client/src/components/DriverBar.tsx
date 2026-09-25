import { useRaceStore } from '../store/useRaceStore';
import { DriverChip } from './DriverChip';

const DEFAULT_COLORS = ['#4CAF50', '#9C27B0', '#FFC107', '#E91E63', '#00BCD4', '#FF5722'];

export function DriverBar() {
  const drivers = useRaceStore((s) => s.drivers);
  const addDriver = useRaceStore((s) => s.addDriver);

  const handleAdd = () => {
    const color = DEFAULT_COLORS[drivers.length % DEFAULT_COLORS.length];
    addDriver({ id: crypto.randomUUID(), name: `Pilote ${drivers.length + 1}`, color });
  };

  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ color: '#888', fontSize: 11, textTransform: 'uppercase' }}>Pilotes</span>
      {drivers.map((d) => <DriverChip key={d.id} driver={d} />)}
      <button onClick={handleAdd}
        style={{ background: '#2a2a3e', color: '#e0e0e0', border: '1px dashed #555', padding: '4px 12px', cursor: 'pointer', borderRadius: 4 }}>
        + Ajouter
      </button>
      <span style={{ color: '#666', fontSize: 11, marginLeft: 8 }}>
        glisse un pilote sur un relais pour l'y affecter
      </span>
    </div>
  );
}
