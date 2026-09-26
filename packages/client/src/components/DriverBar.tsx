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

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    padding: '8px 16px',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderBottom: '1px solid #333',
  };

  const labelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: 1,
    marginRight: 4,
  };

  const addBtnStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#888',
    border: '1px dashed #555',
    padding: '5px 14px',
    cursor: 'pointer',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s',
  };

  const helperStyle: React.CSSProperties = {
    color: '#555',
    fontSize: 11,
    fontStyle: 'italic',
    marginLeft: 8,
  };

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Pilotes</span>
      {drivers.map((d) => (
        <DriverChip key={d.id} driver={d} />
      ))}
      <button
        onClick={handleAdd}
        style={addBtnStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#888';
          (e.currentTarget as HTMLButtonElement).style.color = '#ccc';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#555';
          (e.currentTarget as HTMLButtonElement).style.color = '#888';
        }}
      >
        +
      </button>
      <span style={helperStyle}>
        glisse un pilote sur un relais pour l'y affecter
      </span>
    </div>
  );
}
