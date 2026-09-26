import { useState, useRef } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import type { Driver } from '@race-planner/shared';

export function DriverChip({ driver }: { driver: Driver }) {
  const updateDriver = useRaceStore((s) => s.updateDriver);
  const removeDriver = useRaceStore((s) => s.removeDriver);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(driver.name);
  const colorRef = useRef<HTMLInputElement>(null);

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px 4px 0',
    background: driver.color + '20',
    borderLeft: `3px solid ${driver.color}`,
    borderRadius: 4,
    cursor: 'pointer',
    position: 'relative',
    userSelect: 'none',
    transition: 'background 0.15s',
    border: `1px solid ${driver.color}40`,
    borderLeftWidth: 3,
    borderLeftColor: driver.color,
  };

  const handleChipClick = () => {
    setTimeout(() => colorRef.current?.click(), 0);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/driver-id', driver.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={chipStyle}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = driver.color + '35'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = driver.color + '20'; }}
    >
      <input
        ref={colorRef}
        type="color"
        value={driver.color}
        onChange={(e) => updateDriver(driver.id, { color: e.target.value })}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
      <span
        style={{ color: driver.color, fontSize: 14, fontWeight: 'bold', marginLeft: 8, opacity: 0.8, cursor: 'pointer' }}
        onClick={handleChipClick}
      >
        ≡
      </span>
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { updateDriver(driver.id, { name }); setEditing(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { updateDriver(driver.id, { name }); setEditing(false); }
            if (e.key === 'Escape') { setName(driver.name); setEditing(false); }
          }}
          autoFocus
          style={{
            width: 80,
            background: 'transparent',
            color: '#e6edf3',
            border: 'none',
            borderBottom: `1px solid ${driver.color}`,
            outline: 'none',
            fontWeight: 600,
            fontSize: 13,
            padding: 0,
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          style={{ color: '#e6edf3', fontWeight: 600, fontSize: 13, letterSpacing: 0.3 }}
        >
          {driver.name}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); removeDriver(driver.id); }}
        style={{
          background: 'none',
          border: 'none',
          color: '#484f58',
          cursor: 'pointer',
          fontSize: 13,
          padding: '0 2px',
          marginLeft: 2,
          lineHeight: 1,
          opacity: 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; }}
        title="Retirer ce pilote"
      >
        ×
      </button>
    </div>
  );
}
