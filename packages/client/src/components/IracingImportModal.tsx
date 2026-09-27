import { useState, useEffect, useRef } from 'react';
import { useCalendarStore } from '../store/useCalendarStore';
import { useRaceStore } from '../store/useRaceStore';
import { useTheme } from '../hooks/useTheme';
import type { IracingSeriesInfo, IracingWeekInfo, IracingTimeSlot } from '@race-planner/shared';

function useElapsedTimer(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (active) {
      setElapsed(0);
      ref.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      setElapsed(0);
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);
  return elapsed;
}

declare global {
  interface Window {
    electronAPI?: {
      openIracingLogin: () => Promise<{ success: boolean }>;
      iracingFetch: (endpoint: string) => Promise<{ data?: unknown; error?: string }>;
      iracingLogout: () => Promise<void>;
    };
  }
}

const LICENSE_LABELS: Record<number, string> = {
  1: 'R', 2: 'D', 3: 'C', 4: 'B', 5: 'A', 6: 'Pro', 7: 'Pro/WC',
};

function formatDuration(minutes: number | null): string {
  if (!minutes) return '?';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function formatTimeSlots(week: IracingWeekInfo): string {
  if (week.timeSlots.length === 0) return 'Pas de créneau';
  const first = week.timeSlots[0];
  if (first.repeating && first.repeatMinutes > 0) {
    return `Toutes les ${formatDuration(first.repeatMinutes)} (UTC ${first.startTimeUTC})`;
  }
  return week.timeSlots.map(s => `UTC ${s.startTimeUTC}`).join(', ');
}

function extractSeriesName(raw: any): string {
  if (raw.series_name) return raw.series_name;
  if (raw.series_short_name) return raw.series_short_name;
  if (raw.season_name) {
    return raw.season_name.replace(/\s*-\s*\d{4}\s*season\s*\d+$/i, '').trim();
  }
  return `Series #${raw.series_id ?? 0}`;
}

function normalizeSeries(raw: any): IracingSeriesInfo {
  return {
    seriesId: raw.series_id ?? 0,
    seasonId: raw.season_id ?? 0,
    seriesName: extractSeriesName(raw),
    seasonName: raw.season_name ?? '',
    maxTeamDrivers: raw.max_team_drivers ?? 1,
    driverChanges: raw.driver_changes ?? false,
    official: raw.official ?? false,
    licenseGroup: raw.license_group ?? 0,
    weeks: (raw.schedules ?? []).map(normalizeWeek),
  };
}

function normalizeWeek(raw: any): IracingWeekInfo {
  const limitMin = raw.race_time_limit_minutes ?? raw.race_time_limit ?? null;
  return {
    weekNum: raw.race_week_num ?? 0,
    trackName: raw.track?.track_name ?? raw.track_name ?? 'Inconnu',
    trackConfig: raw.track?.config_name ?? raw.track_config ?? '',
    trackId: raw.track?.track_id ?? raw.track_id ?? 0,
    raceTimeLimitMinutes: limitMin,
    raceLapLimit: raw.race_lap_limit ?? null,
    simStartTime: raw.simulated_start_utc_time ?? raw.start_date ?? null,
    timeSlots: (raw.race_time_descriptors ?? []).map(normalizeTimeSlot),
  };
}

function normalizeTimeSlot(raw: any): IracingTimeSlot {
  return {
    dayOfWeek: raw.day_of_week ?? 0,
    startTimeUTC: raw.start_time_utc ?? raw.session_start_utc ?? '',
    repeating: raw.repeating ?? false,
    repeatMinutes: raw.repeat_minutes ?? 0,
    sessionMinutes: raw.session_minutes ?? 0,
  };
}

type SeriesCategory = 'all' | 'endurance' | 'special';

function isRawSpecialEvent(s: any): boolean {
  const name = ((s.series_name ?? '') + ' ' + (s.season_name ?? '') + ' ' + (s.series_short_name ?? '')).toLowerCase();
  return name.includes('special event') || name.includes('24h') || name.includes('24 hour')
    || name.includes('petit le mans') || name.includes('bathurst') || name.includes('daytona')
    || name.includes('spa 24') || name.includes('le mans') || name.includes('nürburgring 24');
}

function isRawEndurance(s: any): boolean {
  if (s.driver_changes || (s.max_team_drivers ?? 1) > 1) return true;
  const schedules: any[] = s.schedules ?? [];
  return schedules.some((w: any) => {
    const limitMin = w.race_time_limit_minutes ?? w.race_time_limit ?? 0;
    return limitMin >= 60;
  });
}

function getSeriesCategory(s: IracingSeriesInfo): SeriesCategory {
  const name = (s.seriesName + ' ' + s.seasonName).toLowerCase();
  if (name.includes('special event') || name.includes('24h') || name.includes('24 hour')
    || name.includes('petit le mans') || name.includes('bathurst') || name.includes('daytona')
    || name.includes('spa 24') || name.includes('le mans') || name.includes('nürburgring 24')) {
    return 'special';
  }
  return 'endurance';
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getUpcomingSessions(slot: IracingTimeSlot, count: number = 6): Date[] {
  const results: Date[] = [];
  const now = new Date();
  const timeMatch = slot.startTimeUTC.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return results;
  const startH = parseInt(timeMatch[1]);
  const startM = parseInt(timeMatch[2]);

  if (slot.repeating && slot.repeatMinutes > 0) {
    const base = new Date(now);
    base.setUTCHours(startH, startM, 0, 0);
    if (base > now) base.setUTCDate(base.getUTCDate() - 1);
    while (base <= now) {
      base.setUTCMinutes(base.getUTCMinutes() + slot.repeatMinutes);
    }
    for (let i = 0; i < count; i++) {
      results.push(new Date(base));
      base.setUTCMinutes(base.getUTCMinutes() + slot.repeatMinutes);
    }
  } else {
    for (let dayOff = 0; dayOff < 14 && results.length < count; dayOff++) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() + dayOff);
      if (slot.dayOfWeek >= 0 && d.getUTCDay() !== slot.dayOfWeek) continue;
      d.setUTCHours(startH, startM, 0, 0);
      if (d > now) results.push(d);
    }
  }
  return results;
}

function formatLocalDateTime(d: Date): string {
  const day = DAY_NAMES[d.getDay()];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${dd}/${mm} ${hh}:${min}`;
}

function dateToLocalHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseCalendar(raw: unknown): IracingSeriesInfo[] {
  if (!Array.isArray(raw)) return [];
  const filtered = raw.filter((s: any) => isRawEndurance(s) || isRawSpecialEvent(s));
  return filtered.map(normalizeSeries).sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}

export function IracingImportModal() {
  const open = useCalendarStore(s => s.open);
  const authenticated = useCalendarStore(s => s.authenticated);
  const loading = useCalendarStore(s => s.loading);
  const authLoading = useCalendarStore(s => s.authLoading);
  const error = useCalendarStore(s => s.error);
  const series = useCalendarStore(s => s.series);
  const selectedSeasonId = useCalendarStore(s => s.selectedSeasonId);
  const selectedWeekNum = useCalendarStore(s => s.selectedWeekNum);
  const selectedTimeSlotIdx = useCalendarStore(s => s.selectedTimeSlotIdx);
  const searchFilter = useCalendarStore(s => s.searchFilter);
  const store = useCalendarStore.getState;
  const t = useTheme();

  const authElapsed = useElapsedTimer(authLoading);
  const loadElapsed = useElapsedTimer(loading);
  const [categoryFilter, setCategoryFilter] = useState<SeriesCategory>('all');

  if (!open) return null;

  const selectedSeries = series.find(s => s.seasonId === selectedSeasonId);
  const selectedWeek = selectedSeries?.weeks.find(w => w.weekNum === selectedWeekNum);

  const filteredSeries = series.filter(s => {
    if (searchFilter && !s.seriesName.toLowerCase().includes(searchFilter.toLowerCase())
      && !s.seasonName.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (categoryFilter !== 'all' && getSeriesCategory(s) !== categoryFilter) return false;
    return true;
  });

  const countEndurance = series.filter(s => getSeriesCategory(s) === 'endurance').length;
  const countSpecial = series.filter(s => getSeriesCategory(s) === 'special').length;

  const handleLogin = async () => {
    if (!window.electronAPI) {
      store().setError('Disponible uniquement dans l\'application Electron');
      return;
    }
    store().setAuthLoading(true);
    store().setError(null);
    try {
      const result = await window.electronAPI.openIracingLogin();
      if (result.success) {
        store().setAuthenticated(true);
        store().setAuthLoading(false);
        store().setLoading(true);
        store().setError(null);
        const res = await window.electronAPI.iracingFetch('series/seasons');
        if (res.error) {
          store().setLoading(false);
          store().setError(res.error);
        } else {
          store().setSeries(parseCalendar(res.data));
        }
      } else {
        store().setAuthLoading(false);
        store().setError('Connexion annulée');
      }
    } catch {
      store().setAuthLoading(false);
      store().setError('Erreur lors de la connexion');
    }
  };

  const handleFetchSeasons = async () => {
    if (!window.electronAPI) return;
    store().setLoading(true);
    store().setError(null);
    const res = await window.electronAPI.iracingFetch('series/seasons');
    if (res.error) {
      store().setLoading(false);
      store().setError(res.error);
    } else {
      store().setSeries(parseCalendar(res.data));
    }
  };

  const upcomingSessions = selectedWeek?.timeSlots.length
    ? getUpcomingSessions(selectedWeek.timeSlots[0])
    : [];
  const selectedSession = selectedTimeSlotIdx !== null && selectedTimeSlotIdx < upcomingSessions.length
    ? upcomingSessions[selectedTimeSlotIdx]
    : null;

  const handleImport = () => {
    if (!selectedSeries || !selectedWeek) return;
    const config: Record<string, any> = {
      circuit: selectedWeek.trackConfig
        ? `${selectedWeek.trackName} (${selectedWeek.trackConfig})`
        : selectedWeek.trackName,
      simulator: 'iRacing',
      name: `${selectedSeries.seriesName} — S${selectedWeek.weekNum + 1}`,
    };
    if (selectedWeek.raceTimeLimitMinutes && selectedWeek.raceTimeLimitMinutes > 0) {
      config.durationMinutes = selectedWeek.raceTimeLimitMinutes;
    }
    if (selectedWeek.simStartTime) {
      const match = selectedWeek.simStartTime.match(/(\d{2}):(\d{2})/);
      if (match) config.startTime = `${match[1]}:${match[2]}`;
    }
    useRaceStore.getState().setConfig(config);
    if (selectedSession) {
      useRaceStore.getState().setRealStartTime(dateToLocalHHMM(selectedSession));
    }
    store().setOpen(false);
  };

  const handleLogout = async () => {
    await window.electronAPI?.iracingLogout();
    store().setAuthenticated(false);
    store().setSeries([]);
    store().setError(null);
  };

  const handleClose = () => {
    store().setOpen(false);
    store().setError(null);
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const modalStyle: React.CSSProperties = {
    background: t.bgCard,
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    width: 700,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: `1px solid ${t.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const inputStyle: React.CSSProperties = {
    background: t.bgElevated,
    color: t.textPrimary,
    border: `1px solid ${t.borderSubtle}`,
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
  };

  const btnStyle: React.CSSProperties = {
    background: t.accent,
    color: '#000',
    border: 'none',
    borderRadius: 6,
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const btnSecondaryStyle: React.CSSProperties = {
    ...btnStyle,
    background: t.bgElevated,
    color: t.textPrimary,
    border: `1px solid ${t.borderSubtle}`,
    fontWeight: 500,
  };

  const rowStyle: React.CSSProperties = {
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: `1px solid ${t.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transition: 'background 0.15s',
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary }}>
            Connexion iRacing
          </span>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: t.textMuted, fontSize: 18, cursor: 'pointer' }}
          >
            X
          </button>
        </div>

        <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>
          {!authenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.4, textAlign: 'center' }}>
                Connectez-vous via la page officielle iRacing.
                <br />
                Vos identifiants ne transitent jamais par Race Planner.
              </span>
              <button
                onClick={handleLogin}
                disabled={authLoading}
                style={{
                  ...btnStyle,
                  background: '#e67e22',
                  padding: '12px 32px',
                  fontSize: 14,
                  opacity: authLoading ? 0.5 : 1,
                }}
              >
                {authLoading ? `Connexion en cours... (${authElapsed}s)` : 'Se connecter à iRacing'}
              </button>
              {error && (
                <span style={{ color: t.red, fontSize: 12 }}>{error}</span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: t.green, fontSize: 12, fontWeight: 600 }}>
                  Connecté à iRacing Data API
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {series.length === 0 && !loading && (
                    <button onClick={handleFetchSeasons} style={btnStyle}>
                      Charger le calendrier
                    </button>
                  )}
                  {loading && (
                    <span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>Chargement... ({loadElapsed}s)</span>
                  )}
                  <button onClick={handleLogout} style={btnSecondaryStyle}>
                    Déconnexion
                  </button>
                </div>
              </div>

              {error && (
                <span style={{ color: t.red, fontSize: 12 }}>{error}</span>
              )}

              {series.length > 0 && (
                <>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => store().setSearchFilter(e.target.value)}
                    placeholder="Rechercher une série..."
                    style={{ ...inputStyle, marginBottom: 4 }}
                  />

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {([
                      ['all', `Tout (${series.length})`],
                      ['endurance', `Endurance / Team (${countEndurance})`],
                      ['special', `Special Events (${countSpecial})`],
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setCategoryFilter(key as SeriesCategory)}
                        style={{
                          padding: '4px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'inherit',
                          borderRadius: 14,
                          border: `1px solid ${categoryFilter === key ? t.accent : t.borderSubtle}`,
                          background: categoryFilter === key ? t.accent : 'transparent',
                          color: categoryFilter === key ? '#000' : t.textMuted,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                    <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 'auto', fontWeight: 600 }}>
                      {filteredSeries.length} résultat{filteredSeries.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ maxHeight: 250, overflow: 'auto', border: `1px solid ${t.border}`, borderRadius: 8 }}>
                    {filteredSeries.map(s => (
                      <div
                        key={s.seasonId}
                        onClick={() => store().setSelectedSeasonId(s.seasonId === selectedSeasonId ? null : s.seasonId)}
                        style={{
                          ...rowStyle,
                          background: s.seasonId === selectedSeasonId ? t.bgElevated : 'transparent',
                        }}
                        onMouseEnter={e => { if (s.seasonId !== selectedSeasonId) (e.currentTarget.style.background = t.bgElevated); }}
                        onMouseLeave={e => { if (s.seasonId !== selectedSeasonId) (e.currentTarget.style.background = 'transparent'); }}
                      >
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: s.official ? '#1a3d0d' : t.bgElevated,
                          color: s.official ? t.green : t.textMuted,
                          border: `1px solid ${s.official ? '#238636' : t.borderSubtle}`,
                        }}>
                          {LICENSE_LABELS[s.licenseGroup] ?? '?'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
                            {s.seriesName}
                          </div>
                          <div style={{ fontSize: 11, color: t.textMuted }}>
                            {s.seasonName}
                            {s.driverChanges && <span style={{ color: t.blue, marginLeft: 8 }}>Team ({s.maxTeamDrivers} max)</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: t.textMuted }}>
                          {s.weeks.length} sem.
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedSeries && (
                    <>
                      <div style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginTop: 8 }}>
                        Semaines — {selectedSeries.seriesName}
                      </div>
                      <div style={{ maxHeight: 200, overflow: 'auto', border: `1px solid ${t.border}`, borderRadius: 8 }}>
                        {selectedSeries.weeks.map(w => (
                          <div
                            key={w.weekNum}
                            onClick={() => store().setSelectedWeekNum(w.weekNum === selectedWeekNum ? null : w.weekNum)}
                            style={{
                              ...rowStyle,
                              background: w.weekNum === selectedWeekNum ? t.bgElevated : 'transparent',
                            }}
                            onMouseEnter={e => { if (w.weekNum !== selectedWeekNum) (e.currentTarget.style.background = t.bgElevated); }}
                            onMouseLeave={e => { if (w.weekNum !== selectedWeekNum) (e.currentTarget.style.background = 'transparent'); }}
                          >
                            <span style={{ fontSize: 11, fontWeight: 700, color: t.accent, minWidth: 24 }}>
                              S{w.weekNum + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary }}>
                                {w.trackName}
                                {w.trackConfig && <span style={{ color: t.textMuted, fontWeight: 400 }}> ({w.trackConfig})</span>}
                              </div>
                              <div style={{ fontSize: 11, color: t.textMuted }}>
                                {formatDuration(w.raceTimeLimitMinutes)}
                                {w.simStartTime && <span style={{ marginLeft: 8 }}>Sim {w.simStartTime}</span>}
                                <span style={{ marginLeft: 8 }}>{formatTimeSlots(w)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedWeek && selectedSeries && (
                    <div style={{
                      background: t.bgElevated,
                      border: `2px solid ${t.accent}`,
                      borderRadius: 8,
                      padding: 16,
                      marginTop: 4,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
                            {selectedSeries.seriesName}
                          </div>
                          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                            S{selectedWeek.weekNum + 1} — {selectedWeek.trackName}
                            {selectedWeek.trackConfig && ` (${selectedWeek.trackConfig})`}
                          </div>
                          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                            {formatDuration(selectedWeek.raceTimeLimitMinutes)}
                            {selectedWeek.simStartTime && ` | Sim ${selectedWeek.simStartTime}`}
                          </div>
                        </div>
                      </div>

                      {upcomingSessions.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>
                            Créneau de course (heure locale)
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {upcomingSessions.map((d, i) => (
                              <button
                                key={i}
                                onClick={() => store().setSelectedTimeSlotIdx(selectedTimeSlotIdx === i ? null : i)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: 11,
                                  fontWeight: selectedTimeSlotIdx === i ? 700 : 500,
                                  fontFamily: 'inherit',
                                  borderRadius: 6,
                                  border: `1px solid ${selectedTimeSlotIdx === i ? t.accent : t.borderSubtle}`,
                                  background: selectedTimeSlotIdx === i ? t.accent : 'transparent',
                                  color: selectedTimeSlotIdx === i ? '#000' : t.textSecondary,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {formatLocalDateTime(d)}
                              </button>
                            ))}
                          </div>
                          {selectedSession && (
                            <div style={{ fontSize: 11, color: t.blue, marginTop: 6 }}>
                              Frise HEURE RÉEL calée sur {dateToLocalHHMM(selectedSession)} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <button onClick={handleImport} style={{ ...btnStyle, opacity: selectedSession ? 1 : 0.5 }}>
                          Importer dans le planning
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
