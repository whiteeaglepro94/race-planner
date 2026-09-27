import { useState, useRef } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import { distributeStints, autofillGaps, validatePlan } from '@race-planner/shared';
import { exportCSV, exportPNG, exportPDF, saveAsJSON } from '../utils/exportClient';
import { useLiveStore } from '../store/useLiveStore';
import { useCalendarStore } from '../store/useCalendarStore';
import { DriverChip } from './DriverChip';
import { useTheme } from '../hooks/useTheme';
import { useNightModeStore } from '../hooks/useNightMode';

const DEFAULT_COLORS = ['#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e74c3c', '#1abc9c'];


function DemoBadge({ onStart, onStop }: { onStart: () => void; onStop: () => void }) {
  const demo = useLiveStore((s) => s.demo);
  const active = useLiveStore((s) => s.active);
  const connected = useLiveStore((s) => s.connected);
  const startFollowing = useLiveStore((s) => s.startFollowing);
  const stopFollowing = useLiveStore((s) => s.stopFollowing);
  const setDemo = useLiveStore((s) => s.setDemo);

  const handleClick = () => {
    if (demo) {
      stopFollowing();
      setDemo(false);
      onStop();
    } else {
      startFollowing();
      setDemo(true);
      onStart();
    }
  };

  const isActive = demo && active;
  const isConnected = demo && connected;
  const bg = isActive ? (isConnected ? '#1a1a3d' : '#3d1a0d') : 'var(--bg-elevated)';
  const color = isActive ? (isConnected ? '#a78bfa' : 'var(--red)') : 'var(--text-muted)';
  const border = isActive ? (isConnected ? '#7c3aed' : '#da3633') : 'var(--border-subtle)';
  const label = isActive
    ? isConnected ? '▶ Démo en cours' : '● Démarrage...'
    : 'Démo';

  return (
    <button onClick={handleClick} style={{
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: '2px 10px',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      whiteSpace: 'nowrap',
      cursor: 'pointer',
    }}>
      {label}
    </button>
  );
}

function NightToggle() {
  const override = useNightModeStore((s) => s.override);
  const setOverride = useNightModeStore((s) => s.setOverride);

  const cycle = () => {
    if (override === 'auto') setOverride('on');
    else if (override === 'on') setOverride('off');
    else setOverride('auto');
  };

  const labels: Record<string, string> = { auto: 'Auto', on: 'Nuit', off: 'Jour' };
  const icons: Record<string, string> = { auto: '◐', on: '🌙', off: '☀' };
  const bg = override === 'on' ? '#1a1a3d' : override === 'off' ? '#2a2210' : 'var(--bg-elevated)';
  const color = override === 'on' ? '#a78bfa' : override === 'off' ? '#f0c040' : 'var(--text-muted)';
  const border = override === 'on' ? '#7c3aed' : override === 'off' ? '#b08820' : 'var(--border-subtle)';

  return (
    <button onClick={cycle} title="Mode nuit : Auto / Forcé / Désactivé" style={{
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: '2px 10px',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}>
      <span style={{ fontSize: 12 }}>{icons[override]}</span>
      {labels[override]}
    </button>
  );
}

export function ToolBar({ onSave, onExport, onDemoStart, onDemoStop, onIracingImport }: { onSave: () => void; onExport: (format: 'pdf' | 'png' | 'csv') => void; onDemoStart: () => void; onDemoStop: () => void; onIracingImport: () => void }) {
  const store = useRaceStore.getState;
  const setStints = useRaceStore((s) => s.setStints);
  const setAlerts = useRaceStore((s) => s.setAlerts);
  const drivers = useRaceStore((s) => s.drivers);
  const addDriver = useRaceStore((s) => s.addDriver);
  const [saveMsg, setSaveMsg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTheme();

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

  const handleSave = () => {
    saveAsJSON();
    onSave();
    setSaveMsg('✓ Sauvegardé');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const plan = JSON.parse(ev.target?.result as string);
        const s = store();
        if (plan.config) s.setConfig(plan.config);
        if (plan.drivers) {
          const currentDrivers = s.drivers;
          currentDrivers.forEach((d) => useRaceStore.getState().removeDriver(d.id));
          plan.drivers.forEach((d: any) => useRaceStore.getState().addDriver(d));
        }
        if (plan.stints) useRaceStore.getState().setStints(plan.stints);
        if (plan.pitStops) useRaceStore.getState().setPitStops(plan.pitStops);
        setSaveMsg('✓ Chargé');
        setTimeout(() => setSaveMsg(''), 2000);
      } catch {
        setSaveMsg('✗ Fichier invalide');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddDriver = () => {
    const color = DEFAULT_COLORS[drivers.length % DEFAULT_COLORS.length];
    addDriver({ id: crypto.randomUUID(), name: `Pilote ${drivers.length + 1}`, color });
  };

  const actionBtn: React.CSSProperties = {
    background: t.bgElevated,
    color: t.textPrimary,
    border: `1px solid ${t.borderSubtle}`,
    padding: '5px 12px',
    cursor: 'pointer',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <div style={{ background: t.bgCanvas, borderBottom: `1px solid ${t.border}`, padding: '8px 16px', transition: 'background 1.5s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Title + badges */}
        <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          Plan de course
        </span>
        <button
          onClick={onIracingImport}
          style={{
            background: '#2a1a0a',
            color: '#e67e22',
            border: '1px solid #e67e22',
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: 0.8,
            whiteSpace: 'nowrap' as const,
            cursor: 'pointer',
          }}
        >
          Connexion iRacing
        </button>
        <DemoBadge onStart={onDemoStart} onStop={onDemoStop} />
        <NightToggle />

        {/* Separator */}
        <div style={{ width: 1, height: 22, background: t.border, margin: '0 4px' }} />

        {/* Pilots section */}
        <span style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1, whiteSpace: 'nowrap' }}>
          Pilotes
        </span>
        {drivers.map((d) => (
          <DriverChip key={d.id} driver={d} />
        ))}
        <button
          onClick={handleAddDriver}
          style={{
            background: 'transparent',
            color: t.textMuted,
            border: `1px dashed ${t.borderSubtle}`,
            padding: '4px 12px',
            cursor: 'pointer',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          +
        </button>
        <span style={{ color: t.textFaint, fontSize: 11, fontStyle: 'italic' }}>
          glisse un pilote sur un relais pour l'y affecter
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <div style={{ position: 'relative' }}>
          <button style={actionBtn} onClick={() => setShowExport(!showExport)}>
            ≡ Exporter
          </button>
          {showExport && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              background: t.bgCard,
              border: `1px solid ${t.borderSubtle}`,
              borderRadius: 6,
              padding: 4,
              zIndex: 100,
              minWidth: 130,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <button
                style={{ ...actionBtn, border: 'none', width: '100%', justifyContent: 'flex-start', borderRadius: 4 }}
                onClick={() => { exportPDF(); setShowExport(false); }}
              >
                Export PDF
              </button>
              <button
                style={{ ...actionBtn, border: 'none', width: '100%', justifyContent: 'flex-start', borderRadius: 4 }}
                onClick={() => { exportPNG(); setShowExport(false); }}
              >
                Export PNG
              </button>
              <button
                style={{ ...actionBtn, border: 'none', width: '100%', justifyContent: 'flex-start', borderRadius: 4 }}
                onClick={() => { exportCSV(); setShowExport(false); }}
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
        <button style={{ ...actionBtn, background: t.greenBg, borderColor: t.green, color: t.green }} onClick={handleDistribute}>
          ⟳ Volant équilibré
        </button>
        <button style={{ ...actionBtn, background: t.redBg, borderColor: t.red, color: t.red }} onClick={handleAutofill}>
          ↯ Remplissage auto
        </button>
        <button style={actionBtn} onClick={handleClear}>
          ✕ Tout effacer
        </button>

        <div style={{ width: 1, height: 22, background: t.border, margin: '0 2px' }} />

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button style={actionBtn} onClick={handleLoad}>
          ↥ Charger
        </button>
        <button style={{ ...actionBtn, background: t.accent, color: '#000', fontWeight: 700, borderColor: t.accent }} onClick={handleSave}>
          Sauvegarder
        </button>
        {saveMsg && (
          <span style={{ color: t.green, fontSize: 11, fontWeight: 600 }}>{saveMsg}</span>
        )}
      </div>
    </div>
  );
}
