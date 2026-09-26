import { useEffect, useRef, useState } from 'react';
import { useLiveStore } from '../store/useLiveStore';

// iRacing SessionFlags bitmask values
const FLAGS = {
  checkered:  0x0001,
  white:      0x0002,
  green:      0x0004,
  yellow:     0x0008,
  red:        0x0010,
  blue:       0x0020,
  debris:     0x0040,
  crossed:    0x0080,
  yellowWaving: 0x0100,
  oneLapToGreen: 0x0200,
  greenHeld:  0x0400,
  tenToGo:    0x0800,
  fiveToGo:   0x1000,
  randomWaving: 0x2000,
  caution:    0x4000,
  cautionWaving: 0x8000,
  black:      0x010000,
  disqualify: 0x020000,
  furled:     0x080000,
  repair:     0x100000,
};

function getFlagColor(flags: number): string | null {
  if (flags & FLAGS.red) return '#e5243b';
  if (flags & (FLAGS.yellow | FLAGS.caution | FLAGS.cautionWaving | FLAGS.yellowWaving)) return '#ffd000';
  if (flags & FLAGS.blue) return '#0055ff';
  if (flags & FLAGS.black) return '#111111';
  if (flags & FLAGS.white) return '#ffffff';
  if (flags & FLAGS.checkered) return '#ffffff';
  if (flags & FLAGS.green) return '#00c853';
  return null;
}

const FLASH_DURATION = 6000;

export function FlagOverlay() {
  const data = useLiveStore((s) => s.data);
  const active = useLiveStore((s) => s.active);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const prevFlagsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || !data) {
      setFlashColor(null);
      setVisible(false);
      prevFlagsRef.current = 0;
      return;
    }

    const flags = data.sessionFlags;
    const prev = prevFlagsRef.current;
    prevFlagsRef.current = flags;

    // Only trigger on new flag (not already active)
    const newFlags = flags & ~prev;
    if (newFlags === 0) return;

    const color = getFlagColor(newFlags) ?? getFlagColor(flags);
    if (!color) return;

    // Don't flash on green (race start normal)
    if (color === '#00c853' && !(newFlags & FLAGS.green & ~FLAGS.greenHeld)) return;

    // Start flash
    setFlashColor(color);
    setVisible(true);

    if (blinkRef.current) clearInterval(blinkRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    blinkRef.current = setInterval(() => {
      setVisible((v) => !v);
    }, 300);

    timerRef.current = setTimeout(() => {
      if (blinkRef.current) clearInterval(blinkRef.current);
      blinkRef.current = null;
      setFlashColor(null);
      setVisible(false);
    }, FLASH_DURATION);

    return () => {
      if (blinkRef.current) clearInterval(blinkRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, data?.sessionFlags]);

  if (!flashColor || !visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      border: `15px solid ${flashColor}`,
      boxShadow: `inset 0 0 40px ${flashColor}60`,
      borderRadius: 0,
    }} />
  );
}
