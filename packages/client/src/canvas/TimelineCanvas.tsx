import { useRef, useEffect, useState } from 'react';
import { RaceTimelineRenderer, TOTAL_CANVAS_H } from './renderer';
import { handleMouseDown, handleMouseUp, handleMouseMove, handleWheel, handleDblClick, handleDragOver, handleDrop } from './interaction';

function RealTimeClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '2px 8px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#f5a62390', letterSpacing: 1.5, textTransform: 'uppercase' }}>
        Heure réel
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: '"Segoe UI Mono", "Consolas", monospace', color: '#f5a623' }}>
        {hh}:{mm}:{ss}
      </span>
    </div>
  );
}

export function TimelineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RaceTimelineRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new RaceTimelineRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const parent = canvas.parentElement!;
      renderer.resize(parent.clientWidth, TOTAL_CANVAS_H);
    };
    resize();
    window.addEventListener('resize', resize);

    const onDown = (e: MouseEvent) => handleMouseDown(e, renderer.viewport);
    const onMove = (e: MouseEvent) => handleMouseMove(e, renderer.viewport);
    const onUp = () => handleMouseUp();
    const onWheel = (e: WheelEvent) => handleWheel(e, renderer.viewport);
    const onDbl = (e: MouseEvent) => handleDblClick(e, renderer.viewport);
    const onDragOver = (e: DragEvent) => handleDragOver(e, renderer.viewport);
    const onDrop = (e: DragEvent) => handleDrop(e, renderer.viewport);

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDbl);
    canvas.addEventListener('dragover', onDragOver);
    canvas.addEventListener('drop', onDrop);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDbl);
      canvas.removeEventListener('dragover', onDragOver);
      canvas.removeEventListener('drop', onDrop);
    };
  }, []);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <RealTimeClock />
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'default' }} />
    </div>
  );
}
