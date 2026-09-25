import { useRaceStore } from '../store/useRaceStore';

const PRESETS = [
  { label: '3 h', minutes: 180 },
  { label: '6 h', minutes: 360 },
  { label: '24 h', minutes: 1440 },
];

export function TopBar() {
  const config = useRaceStore((s) => s.raceConfig);
  const setConfig = useRaceStore((s) => s.setConfig);
  const driverCount = useRaceStore((s) => s.drivers.length);

  return (
    <div style={{ display: 'flex', gap: 16, padding: '8px 16px', background: '#12121f', borderBottom: '1px solid #333', alignItems: 'center', flexWrap: 'wrap' }}>
      <Field label="SIMULATEUR">
        <input value={config.simulator} onChange={(e) => setConfig({ simulator: e.target.value })} />
      </Field>
      <Field label="CIRCUIT">
        <input value={config.circuit} onChange={(e) => setConfig({ circuit: e.target.value })} />
      </Field>
      <Field label="VOITURE">
        <input value={config.car} onChange={(e) => setConfig({ car: e.target.value })} />
      </Field>
      <Field label="DURÉE">
        <div style={{ display: 'flex', gap: 4 }}>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setConfig({ durationMinutes: p.minutes })}
              style={{ background: config.durationMinutes === p.minutes ? '#f5a623' : '#2a2a3e', color: '#e0e0e0', border: 'none', padding: '2px 8px', cursor: 'pointer', borderRadius: 3 }}>
              {p.label}
            </button>
          ))}
          <input type="number" value={config.durationMinutes} onChange={(e) => setConfig({ durationMinutes: Number(e.target.value) })}
            style={{ width: 60 }} />
        </div>
      </Field>
      <Field label="DÉPART EN JEU (HORLOGE SIM)">
        <input type="time" value={config.startTime} onChange={(e) => setConfig({ startTime: e.target.value })}
          style={{ fontSize: 18, fontWeight: 'bold' }} />
      </Field>
      <Field label="ÉQUIPAGE">
        <span style={{ fontSize: 16 }}>{driverCount} pilotes</span>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      {children}
    </div>
  );
}
