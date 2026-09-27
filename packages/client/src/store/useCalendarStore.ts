import { create } from 'zustand';
import type { IracingSeriesInfo } from '@race-planner/shared';

interface CalendarState {
  open: boolean;
  authenticated: boolean;
  loading: boolean;
  authLoading: boolean;
  error: string | null;
  series: IracingSeriesInfo[];
  selectedSeasonId: number | null;
  selectedWeekNum: number | null;
  selectedTimeSlotIdx: number | null;
  searchFilter: string;
}

interface CalendarActions {
  setOpen: (open: boolean) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (loading: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSeries: (series: IracingSeriesInfo[]) => void;
  setSelectedSeasonId: (id: number | null) => void;
  setSelectedWeekNum: (week: number | null) => void;
  setSelectedTimeSlotIdx: (idx: number | null) => void;
  setSearchFilter: (filter: string) => void;
  reset: () => void;
}

const initialState: CalendarState = {
  open: false,
  authenticated: false,
  loading: false,
  authLoading: false,
  error: null,
  series: [],
  selectedSeasonId: null,
  selectedWeekNum: null,
  selectedTimeSlotIdx: null,
  searchFilter: '',
};

export const useCalendarStore = create<CalendarState & CalendarActions>()((set) => ({
  ...initialState,
  setOpen: (open) => set({ open }),
  setAuthenticated: (value) => set({ authenticated: value }),
  setLoading: (loading) => set({ loading }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setError: (error) => set({ error }),
  setSeries: (series) => set({ series, loading: false }),
  setSelectedSeasonId: (id) => set({ selectedSeasonId: id, selectedWeekNum: null, selectedTimeSlotIdx: null }),
  setSelectedWeekNum: (week) => set({ selectedWeekNum: week, selectedTimeSlotIdx: null }),
  setSelectedTimeSlotIdx: (idx) => set({ selectedTimeSlotIdx: idx }),
  setSearchFilter: (filter) => set({ searchFilter: filter }),
  reset: () => set(initialState),
}));
