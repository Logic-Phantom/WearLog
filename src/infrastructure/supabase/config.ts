/**
 * Public Supabase settings only (no native imports, so pure modules and tests can read them).
 * The publishable key is public by design and protected by RLS. Never put service_role keys,
 * OAuth client secrets or the KMA service key in the app.
 * Missing values → community + KMA weather run in "not configured" mode; the app stays fully local.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const SUPABASE_CONFIGURED = /^https:\/\/.+/.test(SUPABASE_URL) && SUPABASE_PUBLISHABLE_KEY.length > 20;

/** Base URL + public key for Edge Functions (weather proxy). Null when Supabase is not configured. */
export function edgeFunctionEndpoint(name: string): { url: string; key: string } | null {
  if (!SUPABASE_CONFIGURED) return null;
  return { url: `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/${name}`, key: SUPABASE_PUBLISHABLE_KEY };
}
