import { useRef, useCallback, useState, type ReactNode } from 'react';
import { usePanelStore, type PanelId } from '../store/usePanelStore';

interface Props {
  id: PanelId;
  title: string;
  children: ReactNode;
  minWidth?: number;
  minHeight?: number;
}

export function FloatingPanel({ id, title, children, minWidth = 200, minHeight = 100 }: Props) {
  const panel = usePanelStore((s) => s.panels[id]);
  const update = usePanelStore((s) => s.updatePanel);
  const bringToFront = usePanelStore((s) => s.bringToFront);
  const toggle = usePanelStore((s) => s.togglePanel);
  const [minimized, setMinimized] = useState(false);

  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  if (!panel.visible) return null;

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    bringToFront(id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: panel.x, origY: panel.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      update(id, { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [id, panel.x, panel.y, update, bringToFront]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(id);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: panel.w, origH: panel.h };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = ev.clientX - resizeRef.current.startX;
      const dh = ev.clientY - resizeRef.current.startY;
      update(id, {
        w: Math.max(minWidth, resizeRef.current.origW + dw),
        h: Math.max(minHeight, resizeRef.current.origH + dh),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [id, panel.w, panel.h, minWidth, minHeight, update, bringToFront]);

  return (
    <div
      onMouseDown={() => bringToFront(id)}
      style={{
        position: 'absolute',
        left: panel.x,
        top: panel.y,
        width: panel.w,
        height: minimized ? 'auto' : panel.h,
        zIndex: panel.z,
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={onDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#161b22',
          borderBottom: minimized ? 'none' : '1px solid #21262d',
          cursor: 'grab',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#e6edf3', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {title}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMinimized(!minimized)}
            style={{
              background: 'transparent', border: 'none', color: '#7d8590',
              cursor: 'pointer', fontSize: 12, padding: '0 4px', lineHeight: 1,
            }}
          >
            {minimized ? '▢' : '—'}
          </button>
          <button
            onClick={() => toggle(id)}
            style={{
              background: 'transparent', border: 'none', color: '#7d8590',
              cursor: 'pointer', fontSize: 12, padding: '0 4px', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!minimized && (
        <div style={{ flex: 1, overflow: 'auto', userSelect: 'text' }}>
          {children}
        </div>
      )}

      {/* Resize handle */}
      {!minimized && (
        <div
          onMouseDown={onResizeStart}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#30363d', fontSize: 10, lineHeight: 1 }}>◢</span>
        </div>
      )}
    </div>
  );
}
