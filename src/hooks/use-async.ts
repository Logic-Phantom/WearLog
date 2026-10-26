import { useCallback, useEffect, useState, type DependencyList } from 'react';

import { logError, toUserMessage } from '@/domain/errors';

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

function sameDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
}

/**
 * Loads data with loading/error states; re-runs when deps change (shallow compare) or on reload().
 * `loading` is derived — the latest request has not settled — so no setState runs in the effect body.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [prevDeps, setPrevDeps] = useState(deps);
  const [generation, setGeneration] = useState(0);
  if (!sameDeps(prevDeps, deps)) {
    // Adjusting state while rendering (React-documented pattern) instead of in an effect.
    setPrevDeps(deps);
    setGeneration((g) => g + 1);
  }
  const key = String(generation);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let alive = true;
    fn()
      .then((data) => alive && setSettled({ key, data, error: null }))
      .catch((e) => {
        logError('load', e);
        if (alive) setSettled((prev) => ({ key, data: prev?.data ?? null, error: toUserMessage(e) }));
      });
    return () => {
      alive = false;
    };
    // `fn` is intentionally not a dependency: callers pass inline closures; deps drive reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setGeneration((g) => g + 1), []);
  return { data: settled?.data ?? null, loading: settled?.key !== key, error: settled?.key === key ? settled.error : null, reload };
}
