import { useRaceStore } from '../store/useRaceStore';

export function StintDetailPanel() {
  const selectedId = useRaceStore((s) => s.selectedStintId);
  const stint = useRaceStore((s) => s.stints.find((st) => st.id === s.selectedStintId));
  const drivers = useRaceStore((s) => s.drivers);
  const updateStint = useRaceStore((s) => s.updateStint);
  const driver = drivers.find((d) => d.id === stint?.driverId);

  if (!stint || !selectedId) {
    return (
      <div style={{ padding: 16, color: '#666', background: '#12121f', borderTop: '1px solid #333' }}>
        Sélectionnez un relais sur la frise
      </div>
    );
  }

  const update = (partial: Record<string, unknown>) => updateStint(selectedId, partial);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, padding: 16, background: '#12121f', borderTop: '1px solid #333' }}>
      <Section title="RELAIS SÉLECTIONNÉ" accent={driver?.color}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>{driver?.name} · {stint.startTime} → {stint.endTime}</div>
        <div style={{ fontSize: 11, color: '#888' }}>relais {stint.locked ? 'verrouillé' : 'simple'}</div>
      </Section>

      <Section title="PILOTE">
        <select value={stint.driverId} onChange={(e) => update({ driverId: e.target.value })}>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Section>

      <Section title="PNEUS PRÉVUS">
        <select value={stint.tireCompound} onChange={(e) => update({ tireCompound: e.target.value })}>
          <option value="dry">Secs</option>
          <option value="wet">Pluie</option>
          <option value="intermediate">Intermédiaires</option>
        </select>
        <select value={stint.tireCondition} onChange={(e) => update({ tireCondition: e.target.value })}>
          <option value="new">Train neuf</option>
          <option value="used">Usagés</option>
        </select>
      </Section>

      <Section title="CARBURANT">
        <label>
          Pleins: <input type="number" value={stint.fuelLoads} min={0}
            onChange={(e) => update({ fuelLoads: Number(e.target.value) })} style={{ width: 40 }} />
        </label>
      </Section>

      <Section title="CHRONO CIBLE">
        <input type="number" step={0.1} value={stint.targetLapTimeSeconds ?? ''}
          placeholder="sec" onChange={(e) => update({ targetLapTimeSeconds: e.target.value ? Number(e.target.value) : undefined })}
          style={{ width: 70 }} />
      </Section>

      <Section title="BRIEF DE PASSATION">
        <textarea value={stint.notes} onChange={(e) => update({ notes: e.target.value })}
          rows={2} style={{ width: '100%', background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #333', resize: 'vertical' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <input type="checkbox" checked={stint.locked} onChange={(e) => update({ locked: e.target.checked })} />
          Verrouillé
        </label>
      </Section>
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: accent ? `3px solid ${accent}` : undefined, paddingLeft: accent ? 8 : 0 }}>
      <div style={{ fontSize: 9, color: '#f5a623', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
