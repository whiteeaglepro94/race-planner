const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const J2000 = 2451545.0;

function julianDay(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const m = month <= 2 ? month + 12 : month;
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function noaaPosition(JD: number) {
  const JC = (JD - J2000) / 36525;
  const L0 = ((280.46646 + JC * (36000.76983 + 0.0003032 * JC)) % 360 + 360) % 360;
  const M = ((357.52911 + JC * (35999.05029 - 0.0001537 * JC)) % 360 + 360) % 360;
  const e = 0.016708634 - JC * (0.000042037 + 0.0000001267 * JC);

  const sinM = Math.sin(M * RAD);
  const sin2M = Math.sin(2 * M * RAD);
  const sin3M = Math.sin(3 * M * RAD);
  const C =
    sinM * (1.914602 - JC * (0.004817 + 0.000014 * JC)) +
    sin2M * (0.019993 - 0.000101 * JC) +
    sin3M * 0.000289;

  const omega = 125.04 - 1934.136 * JC;
  const sunAppLon = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  const eps0 = 23 + (26 + (21.448 - JC * (46.815 + JC * (0.00059 - JC * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);

  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(sunAppLon * RAD));

  const y2 = Math.tan((eps / 2) * RAD) ** 2;
  const eqTimeMin =
    4 * DEG *
    (y2 * Math.sin(2 * L0 * RAD) -
      2 * e * sinM +
      4 * e * y2 * sinM * Math.cos(2 * L0 * RAD) -
      0.5 * y2 * y2 * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * sin2M);

  return { decl, eqTimeMin };
}

function fmtMin(totalMin: number): string {
  const clamped = ((totalMin % 1440) + 1440) % 1440;
  const hh = Math.floor(clamped / 60);
  const mm = Math.round(clamped % 60);
  if (mm >= 60) return `${String((hh + 1) % 24).padStart(2, '0')}:00`;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function calcRealSunTimes(
  date: Date,
  lat: number,
  lon: number,
): { sunrise: string; sunset: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const tzOffsetMin = -date.getTimezoneOffset();
  const JD_midnight = julianDay(year, month, day);

  // Pass 1: compute at solar noon approximation
  // Solar noon UTC ≈ 12:00 - lon/15 hours
  const noonOffsetH = 12 - lon / 15;
  const JD_noon = JD_midnight + noonOffsetH / 24;
  const pos1 = noaaPosition(JD_noon);

  const cosHA1 =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(pos1.decl)) /
    (Math.cos(lat * RAD) * Math.cos(pos1.decl));

  if (cosHA1 > 1) return { sunrise: '06:00', sunset: '18:00' };
  if (cosHA1 < -1) return { sunrise: '00:00', sunset: '23:59' };

  const HA1 = Math.acos(cosHA1) * DEG;
  const sunriseUTC1 = 720 - 4 * (lon + HA1) - pos1.eqTimeMin;
  const sunsetUTC1 = 720 - 4 * (lon - HA1) - pos1.eqTimeMin;

  // Pass 2: refine at the computed sunrise/sunset times
  const JD_rise = JD_midnight + sunriseUTC1 / 1440;
  const pos_rise = noaaPosition(JD_rise);
  const cosHA_r =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(pos_rise.decl)) /
    (Math.cos(lat * RAD) * Math.cos(pos_rise.decl));
  let sunriseUTC = sunriseUTC1;
  if (cosHA_r >= -1 && cosHA_r <= 1) {
    const HA_r = Math.acos(cosHA_r) * DEG;
    sunriseUTC = 720 - 4 * (lon + HA_r) - pos_rise.eqTimeMin;
  }

  const JD_set = JD_midnight + sunsetUTC1 / 1440;
  const pos_set = noaaPosition(JD_set);
  const cosHA_s =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(pos_set.decl)) /
    (Math.cos(lat * RAD) * Math.cos(pos_set.decl));
  let sunsetUTC = sunsetUTC1;
  if (cosHA_s >= -1 && cosHA_s <= 1) {
    const HA_s = Math.acos(cosHA_s) * DEG;
    sunsetUTC = 720 - 4 * (lon - HA_s) - pos_set.eqTimeMin;
  }

  return {
    sunrise: fmtMin(sunriseUTC + tzOffsetMin),
    sunset: fmtMin(sunsetUTC + tzOffsetMin),
  };
}
