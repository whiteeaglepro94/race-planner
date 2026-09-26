import { usePanelStore, type PanelId } from '../store/usePanelStore';

const PANEL_LABELS: Record<PanelId, string> = {
  info: 'Infos',
  drivers: 'Pilotes',
  live: 'Live',
  alerts: 'Alertes',
  stintDetail: 'Relais',
};

export function PanelToggleBar() {
  const panels = usePanelStore((s) => s.panels);
  const toggle = usePanelStore((s) => s.togglePanel);
  const reset = usePanelStore((s) => s.resetLayout);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 16px',
      background: '#0d1117',
      borderBottom: '1px solid #21262d',
    }}>
      <span style={{ fontSize: 9, color: '#484f58', textTransform: 'uppercase', letterSpacing: 1, marginRight: 4 }}>
        Panneaux
      </span>
      {(Object.keys(PANEL_LABELS) as PanelId[]).map((id) => (
        <button
          key={id}
          onClick={() => toggle(id)}
          style={{
            background: panels[id].visible ? '#1c2333' : 'transparent',
            color: panels[id].visible ? '#58a6ff' : '#484f58',
            border: `1px solid ${panels[id].visible ? '#1f3a5f' : '#21262d'}`,
            borderRadius: 4,
            padding: '1px 8px',
            fontSize: 10,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {PANEL_LABELS[id]}
        </button>
      ))}
      <button
        onClick={reset}
        style={{
          background: 'transparent',
          color: '#484f58',
          border: '1px solid #21262d',
          borderRadius: 4,
          padding: '1px 8px',
          fontSize: 10,
          cursor: 'pointer',
          marginLeft: 'auto',
        }}
      >
        Reset layout
      </button>
    </div>
  );
}
