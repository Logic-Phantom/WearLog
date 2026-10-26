import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { AppError, logError, toUserMessage } from '@/domain/errors';
import type { ForecastPeriod, ManualWeather, TasteProfile, WeatherContext, WeatherPreferences } from '@/domain/models';
import { defaultTasteProfile, loadTasteProfile, saveTasteProfile } from '@/features/taste-onboarding/taste-profile';
import { defaultWeatherPrefs, loadCachedWeather, loadWeatherPrefs, refreshWeather, saveWeatherPrefs, type WeatherBundle } from '@/features/weather/weather-service';

/**
 * App-wide local state: taste profile + weather. Everything here works with no account and no
 * network; weather failures degrade to manual choice and never block the rest of the app.
 */
interface AppState {
  ready: boolean;
  dbError: boolean;
  taste: TasteProfile;
  updateTaste: (patch: Partial<TasteProfile>) => Promise<void>;

  weatherPrefs: WeatherPreferences;
  updateWeatherPrefs: (patch: Partial<WeatherPreferences>) => Promise<void>;
  weather: WeatherBundle | null;
  weatherLoading: boolean;
  weatherError: string | null;
  /** Re-fetches weather; `override` applies prefs that were just changed in the same tick. */
  refresh: (override?: Partial<WeatherPreferences>) => Promise<void>;
  manualWeather: ManualWeather | null;
  setManualWeather: (m: ManualWeather | null) => void;
  period: ForecastPeriod;
  setPeriod: (p: ForecastPeriod) => void;
  /** What the recommender receives right now. */
  weatherContext: WeatherContext;

  /** Bumped after local data writes so lists re-query. */
  dataVersion: number;
  bumpData: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [taste, setTaste] = useState<TasteProfile>(defaultTasteProfile());
  const [weatherPrefs, setWeatherPrefs] = useState<WeatherPreferences>(defaultWeatherPrefs());
  const [weather, setWeather] = useState<WeatherBundle | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [manualWeather, setManualWeather] = useState<ManualWeather | null>(null);
  const [period, setPeriod] = useState<ForecastPeriod>('now');
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    Promise.all([loadTasteProfile(), loadWeatherPrefs(), loadCachedWeather()])
      .then(([t, w, cached]) => {
        if (!alive) return;
        setTaste(t);
        setWeatherPrefs(w);
        setPeriod(w.preferredOutingPeriod);
        setWeather(cached);
      })
      .catch((e) => {
        logError('app-state', e);
        if (alive) setDbError(true);
      })
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const updateTaste = useCallback(
    async (patch: Partial<TasteProfile>) => {
      const next = { ...taste, ...patch, updatedAt: new Date().toISOString() };
      setTaste(next);
      await saveTasteProfile(next);
    },
    [taste],
  );

  const updateWeatherPrefs = useCallback(
    async (patch: Partial<WeatherPreferences>) => {
      const next = { ...weatherPrefs, ...patch };
      setWeatherPrefs(next);
      await saveWeatherPrefs(next);
    },
    [weatherPrefs],
  );

  const refresh = useCallback(
    async (override?: Partial<WeatherPreferences>) => {
    const prefs = { ...weatherPrefs, ...override };
    if (prefs.locationMode === 'off') return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await refreshWeather(prefs));
    } catch (e) {
      logError('weather', e);
      setWeatherError(e instanceof AppError ? e.userMessage : toUserMessage(e));
    } finally {
      setWeatherLoading(false);
    }
    },
    [weatherPrefs],
  );

  const weatherContext = useMemo<WeatherContext>(() => {
    if (!weatherPrefs.weatherRecommendationEnabled) return { kind: 'none', reason: 'disabled' };
    if (manualWeather) return { kind: 'manual', manual: manualWeather };
    const snap = weather?.[period] ?? weather?.now;
    return snap ? { kind: 'snapshot', snapshot: snap } : { kind: 'none', reason: 'unavailable' };
  }, [weatherPrefs.weatherRecommendationEnabled, manualWeather, weather, period]);

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({
      ready,
      dbError,
      taste,
      updateTaste,
      weatherPrefs,
      updateWeatherPrefs,
      weather,
      weatherLoading,
      weatherError,
      refresh,
      manualWeather,
      setManualWeather,
      period,
      setPeriod,
      weatherContext,
      dataVersion,
      bumpData,
    }),
    [ready, dbError, taste, updateTaste, weatherPrefs, updateWeatherPrefs, weather, weatherLoading, weatherError, refresh, manualWeather, period, weatherContext, dataVersion, bumpData],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState outside provider');
  return v;
}
