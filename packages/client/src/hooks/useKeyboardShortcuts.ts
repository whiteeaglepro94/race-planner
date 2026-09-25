import { useEffect } from 'react';
import { useRaceStore } from '../store/useRaceStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useRaceStore.temporal.getState().undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        useRaceStore.temporal.getState().redo();
      }
      if (e.key === 'Delete') {
        const selected = useRaceStore.getState().selectedStintId;
        if (selected) useRaceStore.getState().removeStint(selected);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
