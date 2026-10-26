// WearLog weather proxy — 기상청 단기예보 조회서비스 (data.go.kr 15084084).
// Deploy: supabase functions deploy weather-kma
// Secret:  supabase secrets set KMA_SERVICE_KEY=<공공데이터포털 일반 인증키(Decoding)>
// The service key never ships in the app. The app sends only the 5 km grid index (nx, ny).
// Response shape is validated client-side by parseKmaProxyResponse (src/infrastructure/weather-providers).
// Logs never include nx/ny or the key.

const BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const VILAGE_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
const TTL_MINUTES = 60;

type Item = { category: string; fcstDate?: string; fcstTime?: string; fcstValue?: string; obsrValue?: string };

function kstNow(): Date {
  // Shift to KST and read with getUTC* so the runtime timezone doesn't matter.
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}
const ymd = (d: Date) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
const hh = (h: number) => `${String(h).padStart(2, '0')}00`;

/** Latest 단기예보 base (published ~10 min after the base hour). */
export function vilageBase(now = kstNow()): { date: string; time: string } {
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const avail = VILAGE_BASE_HOURS.filter((h) => h * 60 + 10 <= mins);
  if (avail.length) return { date: ymd(now), time: hh(avail[avail.length - 1]) };
  const prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return { date: ymd(prev), time: hh(23) };
}

/** Latest 초단기실황 base (hourly, conservatively available at HH:40). */
export function ncstBase(now = kstNow()): { date: string; time: string } {
  const d = now.getUTCMinutes() < 40 ? new Date(now.getTime() - 60 * 60 * 1000) : now;
  return { date: ymd(d), time: hh(d.getUTCHours()) };
}

async function call(op: string, key: string, base: { date: string; time: string }, nx: number, ny: number, rows: number): Promise<Item[]> {
  const qs = new URLSearchParams({ serviceKey: key, pageNo: '1', numOfRows: String(rows), dataType: 'JSON', base_date: base.date, base_time: base.time, nx: String(nx), ny: String(ny) });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${BASE}/${op}?${qs}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`kma-http-${res.status}`);
    const json = await res.json();
    const code = json?.response?.header?.resultCode;
    if (code !== '00') throw new Error(`kma-result-${code}`);
    return json.response.body.items.item as Item[];
  } finally {
    clearTimeout(t);
  }
}

const SKY: Record<string, string> = { '1': '맑음', '3': '구름많음', '4': '흐림' };
const PTY: Record<string, string> = { '0': 'none', '1': 'rain', '2': 'rainSnow', '3': 'snow', '4': 'shower', '5': 'rain', '6': 'rainSnow', '7': 'snow' };
const PTY_KO: Record<string, string> = { rain: '비', rainSnow: '비/눈', snow: '눈', shower: '소나기' };

const n = (v: string | undefined): number | null => {
  if (v == null) return null;
  const x = parseFloat(v);
  return Number.isFinite(x) && x > -900 ? x : null; // KMA uses -999/900+ as missing
};
/** PCP: "강수없음" → 0, "1mm 미만" → 0.5, "30.0~50.0mm" → 30, "50.0mm 이상" → 50. */
const pcp = (v: string | undefined): number | null => {
  if (v == null) return null;
  if (v.includes('없음')) return 0;
  if (v.includes('미만')) return 0.5;
  return n(v.replace(/mm.*$/, '').split('~')[0]);
};

function slot(fcst: Item[], date: string, time: string) {
  const at = fcst.filter((i) => i.fcstDate === date && i.fcstTime === time);
  if (!at.length) return null;
  const v = (c: string) => at.find((i) => i.category === c)?.fcstValue;
  const pty = PTY[v('PTY') ?? ''] ?? null;
  return {
    isForecast: true,
    forecastTime: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}T${time.slice(0, 2)}:00:00+09:00`,
    temperatureC: n(v('TMP')),
    conditionLabelKo: pty && pty !== 'none' ? PTY_KO[pty] : (SKY[v('SKY') ?? ''] ?? null),
    precipitationProbabilityPct: n(v('POP')),
    precipitationMm: pcp(v('PCP')),
    precipitationType: pty,
    windSpeedMps: n(v('WSD')),
    humidityPct: n(v('REH')),
  };
}

Deno.serve(async (req) => {
  const key = Deno.env.get('KMA_SERVICE_KEY');
  if (!key) return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503 });
  const u = new URL(req.url);
  const nx = Number(u.searchParams.get('nx'));
  const ny = Number(u.searchParams.get('ny'));
  if (!Number.isInteger(nx) || !Number.isInteger(ny) || nx < 1 || nx > 149 || ny < 1 || ny > 253) {
    return new Response(JSON.stringify({ error: 'bad_grid' }), { status: 400 });
  }
  try {
    const now = kstNow();
    const today = ymd(now);
    const [fcst, ncst] = await Promise.all([call('getVilageFcst', key, vilageBase(now), nx, ny, 1000), call('getUltraSrtNcst', key, ncstBase(now), nx, ny, 20).catch(() => [] as Item[])]);

    const todays = fcst.filter((i) => i.fcstDate === today && i.category === 'TMP').map((i) => n(i.fcstValue)).filter((x): x is number => x != null);
    const tmn = n(fcst.find((i) => i.fcstDate === today && i.category === 'TMN')?.fcstValue) ?? (todays.length ? Math.min(...todays) : null);
    const tmx = n(fcst.find((i) => i.fcstDate === today && i.category === 'TMX')?.fcstValue) ?? (todays.length ? Math.max(...todays) : null);

    const nextHour = hh((now.getUTCHours() + 1) % 24);
    const nearest = slot(fcst, today, nextHour);
    const o = (c: string) => ncst.find((i) => i.category === c)?.obsrValue;
    const nowPty = PTY[o('PTY') ?? ''] ?? nearest?.precipitationType ?? null;
    const periods: Record<string, unknown> = {};
    if (ncst.length || nearest) {
      periods.now = {
        isForecast: !ncst.length,
        forecastTime: nearest?.forecastTime ?? null,
        temperatureC: n(o('T1H')) ?? nearest?.temperatureC ?? null,
        minTemperatureC: tmn,
        maxTemperatureC: tmx,
        conditionLabelKo: nowPty && nowPty !== 'none' ? PTY_KO[nowPty] : (nearest?.conditionLabelKo ?? null),
        // 실황 has no probability; use the next forecast hour's POP.
        precipitationProbabilityPct: nearest?.precipitationProbabilityPct ?? null,
        precipitationMm: n(o('RN1')) ?? nearest?.precipitationMm ?? null,
        precipitationType: nowPty,
        windSpeedMps: n(o('WSD')) ?? nearest?.windSpeedMps ?? null,
        humidityPct: n(o('REH')) ?? nearest?.humidityPct ?? null,
      };
    }
    const hour = now.getUTCHours();
    for (const [name, h] of [['morning', 9], ['afternoon', 15], ['evening', 19]] as const) {
      if (h <= hour) continue; // already past today — not shown as a future period
      const s = slot(fcst, today, hh(h));
      if (s) periods[name] = { ...s, minTemperatureC: tmn, maxTemperatureC: tmx };
    }
    const fetchedAt = new Date().toISOString();
    const validUntil = new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString();
    return new Response(JSON.stringify({ fetchedAt, validUntil, periods }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    console.warn('[weather-kma] upstream failure', (e as Error).message);
    return new Response(JSON.stringify({ error: 'upstream' }), { status: 502 });
  }
});
