/**
 * 기상청 동네예보 격자 변환 (Lambert Conformal Conic, 5 km grid). Constants and formula from the
 * KMA 단기예보 OpenAPI 활용가이드 (docs/WEATHER_PROVIDER.md). Runs on-device so only the coarse
 * grid index (nx, ny) — not GPS coordinates — is ever sent to the weather proxy.
 */
const RE = 6371.00877; // earth radius (km)
const GRID = 5.0; // grid spacing (km)
const SLAT1 = 30.0;
const SLAT2 = 60.0;
const OLON = 126.0;
const OLAT = 38.0;
const XO = 43;
const YO = 136;

const DEGRAD = Math.PI / 180.0;

export interface KmaGrid {
  nx: number;
  ny: number;
}

export function latLonToKmaGrid(lat: number, lon: number): KmaGrid {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/** KMA grid covers the Korean peninsula region; outside it the service has no data. */
export function isInKmaDomain(g: KmaGrid): boolean {
  return g.nx >= 1 && g.nx <= 149 && g.ny >= 1 && g.ny <= 253;
}
