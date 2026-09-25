import { useRef, useEffect } from 'react';
import { RaceTimelineRenderer } from './renderer';
import { handleMouseDown, handleMouseUp, handleMouseMove, handleWheel, handleDblClick } from './interaction';

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
      renderer.resize(parent.clientWidth, 220);
    };
    resize();
    window.addEventListener('resize', resize);

    const onDown = (e: MouseEvent) => handleMouseDown(e, renderer.viewport);
    const onMove = (e: MouseEvent) => handleMouseMove(e, renderer.viewport);
    const onUp = () => handleMouseUp();
    const onWheel = (e: WheelEvent) => handleWheel(e, renderer.viewport);
    const onDbl = (e: MouseEvent) => handleDblClick(e, renderer.viewport);

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDbl);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('dblclick', onDbl);
    };
  }, []);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'default' }} />
    </div>
  );
}
