import type { TasteProfile } from '@/domain/models';
import { kvGet, kvSet } from '@/infrastructure/database/database';

import { STYLE_CARDS } from './style-cards';

const KEY = 'tasteProfile.v1';

export function defaultTasteProfile(): TasteProfile {
  return {
    selectedStyleCardIds: [],
    preferredStyles: [],
    preferredFits: [],
    preferredColorIds: [],
    avoidedColorIds: [],
    occasionPreferences: [],
    personalizationEnabled: true,
    onboardingState: 'notStarted',
    updatedAt: null,
    schemaVersion: 1,
  };
}

export function needsOnboarding(p: TasteProfile): boolean {
  return p.onboardingState === 'notStarted' || p.onboardingState === 'inProgress';
}

/**
 * Derives the profile from the cards the user actually picked. Nothing is inferred from cards
 * that were not selected (prompt §3.1).
 */
export function profileFromCards(cardIds: string[], base: TasteProfile): TasteProfile {
  const cards = STYLE_CARDS.filter((c) => cardIds.includes(c.id));
  const uniq = <T,>(xs: T[]) => [...new Set(xs)];
  return {
    ...base,
    selectedStyleCardIds: cards.map((c) => c.id),
    preferredStyles: uniq(cards.flatMap((c) => c.styleTags)),
    preferredFits: uniq(cards.flatMap((c) => c.fits ?? [])),
    preferredColorIds: uniq(cards.flatMap((c) => c.colorIds ?? [])),
    occasionPreferences: uniq(cards.flatMap((c) => c.occasions ?? [])),
    updatedAt: new Date().toISOString(),
  };
}

export async function loadTasteProfile(): Promise<TasteProfile> {
  const stored = await kvGet<TasteProfile>(KEY);
  return stored?.schemaVersion === 1 ? { ...defaultTasteProfile(), ...stored } : defaultTasteProfile();
}

export async function saveTasteProfile(p: TasteProfile): Promise<void> {
  await kvSet(KEY, p);
}
