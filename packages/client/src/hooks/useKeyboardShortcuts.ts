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
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        const state = useRaceStore.getState();
        if (state.selectedPitStopId) {
          state.removePitStop(state.selectedPitStopId);
        } else if (state.selectedStintId) {
          state.removeStint(state.selectedStintId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
