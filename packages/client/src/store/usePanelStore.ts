import { create } from 'zustand';

export type PanelId = 'drivers' | 'live' | 'alerts' | 'stintDetail' | 'info';

interface PanelState {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  visible: boolean;
}

interface PanelStore {
  panels: Record<PanelId, PanelState>;
  nextZ: number;
  updatePanel: (id: PanelId, partial: Partial<PanelState>) => void;
  bringToFront: (id: PanelId) => void;
  togglePanel: (id: PanelId) => void;
  resetLayout: () => void;
}

const defaults: Record<PanelId, PanelState> = {
  info:        { x: 10,  y: 400, w: 350, h: 160, z: 10, visible: true },
  drivers:     { x: 10,  y: 570, w: 700, h: 250, z: 11, visible: true },
  live:        { x: 370, y: 400, w: 400, h: 160, z: 12, visible: true },
  alerts:      { x: 720, y: 570, w: 350, h: 200, z: 13, visible: true },
  stintDetail: { x: 780, y: 400, w: 380, h: 300, z: 14, visible: true },
};

export const usePanelStore = create<PanelStore>()((set) => ({
  panels: { ...defaults },
  nextZ: 20,

  updatePanel: (id, partial) =>
    set((s) => ({
      panels: { ...s.panels, [id]: { ...s.panels[id], ...partial } },
    })),

  bringToFront: (id) =>
    set((s) => ({
      panels: { ...s.panels, [id]: { ...s.panels[id], z: s.nextZ } },
      nextZ: s.nextZ + 1,
    })),

  togglePanel: (id) =>
    set((s) => ({
      panels: { ...s.panels, [id]: { ...s.panels[id], visible: !s.panels[id].visible } },
    })),

  resetLayout: () => set({ panels: { ...defaults }, nextZ: 20 }),
}));
