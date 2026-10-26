import * as Location from 'expo-location';

import { AppError } from '@/domain/errors';

/**
 * Foreground, on-demand location only (prompt §0.14). Called when the user taps "내 주변 날씨 사용"
 * after the in-app explanation. No background permission, no watchers, nothing persisted.
 * Coordinates are returned to the caller, converted to a KMA grid + area label and then dropped.
 */
export async function getCoarsePositionOnce(): Promise<{ lat: number; lon: number }> {
  const enabled = await Location.hasServicesEnabledAsync().catch(() => false);
  if (!enabled) throw new AppError('location-unavailable');
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') throw new AppError('location-denied');
  try {
    // Balanced (~100 m) is plenty for a 5 km grid and is faster/cheaper than High.
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  } catch (e) {
    throw new AppError('location-unavailable', undefined, e);
  }
}

export async function locationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const p = await Location.getForegroundPermissionsAsync().catch(() => null);
  return (p?.status as 'granted' | 'denied' | 'undetermined') ?? 'undetermined';
}
