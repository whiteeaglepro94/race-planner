import type { IracingSeriesInfo, IracingWeekInfo, IracingTimeSlot, RaceConfig } from '@race-planner/shared';
import type { IracingApiClient } from './api-client.js';
import { getCachedOrFetch } from './cache.js';

export async function fetchCalendarData(client: IracingApiClient): Promise<IracingSeriesInfo[]> {
  const { data } = await getCachedOrFetch<any[]>('iracing-seasons', async () => {
    return client.getData<any[]>('series/seasons');
  });

  if (!Array.isArray(data)) return [];

  const endurance = data.filter((s) => {
    if (s.driver_changes || (s.max_team_drivers ?? 1) > 1) return true;
    const schedules: any[] = s.schedules ?? [];
    return schedules.some((w) => {
      const limit = w.race_time_limit ?? w.race_time_limit_minutes ?? 0;
      return limit >= 3600 || (w.race_time_limit_minutes ?? 0) >= 60;
    });
  });

  return endurance.map(normalizeSeries).sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}

function normalizeSeries(raw: any): IracingSeriesInfo {
  return {
    seriesId: raw.series_id ?? 0,
    seasonId: raw.season_id ?? 0,
    seriesName: raw.series_name ?? raw.series_short_name ?? `Series #${raw.series_id}`,
    seasonName: raw.season_name ?? '',
    maxTeamDrivers: raw.max_team_drivers ?? 1,
    driverChanges: raw.driver_changes ?? false,
    official: raw.official ?? false,
    licenseGroup: raw.license_group ?? 0,
    weeks: (raw.schedules ?? []).map(normalizeWeek),
  };
}

function normalizeWeek(raw: any): IracingWeekInfo {
  const limitSec = raw.race_time_limit ?? 0;
  const limitMin = raw.race_time_limit_minutes ?? (limitSec > 0 ? Math.round(limitSec / 60) : null);

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

export function weekToPartialConfig(
  series: IracingSeriesInfo,
  week: IracingWeekInfo,
): Partial<RaceConfig> {
  const config: Partial<RaceConfig> = {
    circuit: week.trackConfig ? `${week.trackName} (${week.trackConfig})` : week.trackName,
    simulator: 'iRacing',
    name: `${series.seriesName} — S${week.weekNum + 1}`,
  };

  if (week.raceTimeLimitMinutes && week.raceTimeLimitMinutes > 0) {
    config.durationMinutes = week.raceTimeLimitMinutes;
  }

  if (week.simStartTime) {
    const match = week.simStartTime.match(/(\d{2}):(\d{2})/);
    if (match) {
      config.startTime = `${match[1]}:${match[2]}`;
    }
  }

  return config;
}
