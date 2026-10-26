/**
 * 체감온도 estimate. The KMA 단기예보 service does not return a felt temperature, so the app may
 * estimate the winter wind-chill version and MUST label it "추정" (prompt §3.9).
 * Formula (KMA 겨울철 체감온도, JAG/TI wind chill):
 *   13.12 + 0.6215·T − 11.37·V^0.16 + 0.3965·V^0.16·T   (T: °C, V: km/h at 10 m)
 * Valid only for T ≤ 10 °C and V ≥ 4.8 km/h (≈1.3 m/s). Outside that range → null (unknown).
 */
export function estimateWindChillC(tempC: number | null, windMps: number | null): number | null {
  if (tempC == null || windMps == null) return null;
  const v = windMps * 3.6;
  if (tempC > 10 || v < 4.8) return null;
  const p = Math.pow(v, 0.16);
  return Math.round((13.12 + 0.6215 * tempC - 11.37 * p + 0.3965 * p * tempC) * 10) / 10;
}
