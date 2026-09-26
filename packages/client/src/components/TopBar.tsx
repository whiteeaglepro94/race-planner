import { useState } from 'react';
import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';

const PRESETS = [
  { label: '3 h', minutes: 180 },
  { label: '6 h', minutes: 360 },
  { label: '24 h', minutes: 1440 },
];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

function addMinutesToTime(time: string, delta: number): string {
  const [hh, mm] = time.split(':').map(Number);
  let total = hh * 60 + mm + delta;
  if (total < 0) total += 1440;
  if (total >= 1440) total -= 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function TopBar() {
  const config = useRaceStore((s) => s.raceConfig);
  const setConfig = useRaceStore((s) => s.setConfig);
  const driverCount = useRaceStore((s) => s.drivers.length);
  const t = useTheme();
  const isCustom = !PRESETS.some((p) => p.minutes === config.durationMinutes);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [customH, setCustomH] = useState(String(Math.floor(config.durationMinutes / 60)));
  const [customM, setCustomM] = useState(String(config.durationMinutes % 60));

  const cardStyle: React.CSSProperties = {
    background: t.bgCard,
    border: `1px solid ${t.borderSubtle}`,
    borderRadius: 6,
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
    transition: 'background 1.5s ease, border-color 1.5s ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${t.borderSubtle}`,
    color: t.textPrimary,
    fontSize: 14,
    fontWeight: 500,
    padding: '2px 0',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  };

  const smallBtnStyle: React.CSSProperties = {
    background: t.bgElevated,
    color: t.textPrimary,
    border: `1px solid ${t.borderSubtle}`,
    borderRadius: 4,
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  };

  return (
    <div style={{ background: t.bgCanvas, borderBottom: `1px solid ${t.border}`, transition: 'background 1.5s ease' }}>
      {/* Breadcrumb */}
      <div style={{ padding: '6px 16px', fontSize: 13, color: t.textMuted, display: 'flex', alignItems: 'center' }}>
        <input
          value={config.teamName}
          onChange={(e) => setConfig({ teamName: e.target.value })}
          placeholder="Écurie"
          style={{
            background: 'transparent',
            border: 'none',
            color: t.textMuted,
            fontSize: 13,
            fontFamily: 'inherit',
            padding: 0,
            outline: 'none',
            width: Math.max(50, (config.teamName || 'Écurie').length * 8),
          }}
        />
        <span style={{ color: t.borderSubtle, margin: '0 6px' }}>›</span>
        <input
          value={config.name}
          onChange={(e) => setConfig({ name: e.target.value })}
          placeholder="Championnat"
          style={{
            background: 'transparent',
            border: 'none',
            color: t.textPrimary,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            padding: 0,
            outline: 'none',
            width: Math.max(90, (config.name || 'Championnat').length * 8),
          }}
        />
      </div>

      {/* Cards row */}
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
        {/* SIMULATEUR */}
        <div style={{ ...cardStyle, minWidth: 120 }}>
          <span style={labelStyle}>Simulateur</span>
          <input
            value={config.simulator}
            onChange={(e) => setConfig({ simulator: e.target.value })}
            placeholder="Le Mans Ultimate"
            style={inputStyle}
          />
        </div>

        {/* CIRCUIT */}
        <div style={{ ...cardStyle, flex: 1, minWidth: 160 }}>
          <span style={labelStyle}>Circuit</span>
          <input
            value={config.circuit}
            onChange={(e) => setConfig({ circuit: e.target.value })}
            placeholder="Le Mans (Circuit de la Sarthe)"
            style={inputStyle}
          />
        </div>

        {/* VOITURE */}
        <div style={{ ...cardStyle, minWidth: 140 }}>
          <span style={labelStyle}>Voiture</span>
          <input
            value={config.car}
            onChange={(e) => setConfig({ car: e.target.value })}
            placeholder="Toyota TR010 Hybrid"
            style={inputStyle}
          />
        </div>

        {/* DURÉE */}
        <div style={{ ...cardStyle, minWidth: 80 }}>
          <span style={labelStyle}>Durée</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setConfig({ durationMinutes: p.minutes }); setShowCustom(false); }}
                style={{
                  background: config.durationMinutes === p.minutes && !showCustom ? t.accent : t.bgElevated,
                  color: config.durationMinutes === p.minutes && !showCustom ? '#000' : t.textPrimary,
                  border: config.durationMinutes === p.minutes && !showCustom ? `1px solid ${t.accent}` : `1px solid ${t.borderSubtle}`,
                  padding: '3px 10px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: config.durationMinutes === p.minutes && !showCustom ? 700 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              style={{
                background: showCustom ? t.accent : t.bgElevated,
                color: showCustom ? '#000' : t.textPrimary,
                border: showCustom ? `1px solid ${t.accent}` : `1px solid ${t.borderSubtle}`,
                padding: '3px 10px',
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: showCustom ? 700 : 400,
              }}
            >
              Perso
            </button>
          </div>
          {showCustom ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <input
                type="number"
                min={0}
                max={99}
                value={customH}
                onChange={(e) => {
                  setCustomH(e.target.value);
                  const h = Math.max(0, parseInt(e.target.value) || 0);
                  const m = Math.max(0, parseInt(customM) || 0);
                  if (h > 0 || m > 0) setConfig({ durationMinutes: h * 60 + m });
                }}
                style={{ width: 36, padding: '2px 4px', background: t.bgCard, color: t.accent, border: `1px solid ${t.borderSubtle}`, borderRadius: 4, fontSize: 13, fontWeight: 700, textAlign: 'center' }}
              />
              <span style={{ fontSize: 11, color: t.textMuted }}>h</span>
              <input
                type="number"
                min={0}
                max={59}
                value={customM}
                onChange={(e) => {
                  setCustomM(e.target.value);
                  const h = Math.max(0, parseInt(customH) || 0);
                  const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                  if (h > 0 || m > 0) setConfig({ durationMinutes: h * 60 + m });
                }}
                style={{ width: 36, padding: '2px 4px', background: t.bgCard, color: t.accent, border: `1px solid ${t.borderSubtle}`, borderRadius: 4, fontSize: 13, fontWeight: 700, textAlign: 'center' }}
              />
              <span style={{ fontSize: 11, color: t.textMuted }}>min</span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: t.textMuted }}>{formatDuration(config.durationMinutes)}</span>
          )}
        </div>

        {/* DÉPART EN JEU — highlighted card */}
        <div
          style={{
            ...cardStyle,
            border: `2px solid ${t.accent}`,
            background: t.night ? '#1a0e05' : '#1a1610',
            minWidth: 180,
            alignItems: 'center',
          }}
        >
          <span style={{ ...labelStyle, color: t.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11 }}>⏱</span> Départ en jeu (horloge sim)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <button
              style={smallBtnStyle}
              onClick={() => setConfig({ startTime: addMinutesToTime(config.startTime, -15) })}
            >
              −
            </button>
            <input
              type="time"
              value={config.startTime}
              onChange={(e) => setConfig({ startTime: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.accent,
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'inherit',
                width: 110,
                textAlign: 'center',
                outline: 'none',
                padding: 0,
              }}
            />
            <button
              style={smallBtnStyle}
              onClick={() => setConfig({ startTime: addMinutesToTime(config.startTime, 15) })}
            >
              +
            </button>
          </div>
          <span style={{ fontSize: 9, color: t.night ? '#704530' : '#997a3e', textAlign: 'center', lineHeight: 1.3 }}>
            place la nuit sur la frise — réglé DANS le jeu, pas l'heure réelle
          </span>
        </div>

        {/* ÉQUIPAGE */}
        <div style={{ ...cardStyle, minWidth: 80, justifyContent: 'center', alignItems: 'center' }}>
          <span style={labelStyle}>Équipage</span>
          <span style={{ fontSize: 22, color: t.textPrimary, fontWeight: 700 }}>{driverCount}</span>
          <span style={{ fontSize: 11, color: t.textMuted }}>pilotes</span>
        </div>
      </div>
    </div>
  );
}
