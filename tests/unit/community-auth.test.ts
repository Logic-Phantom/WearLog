import { enabledSocialProviders, expoGoCallbackUrl, parseAuthCallback } from '@/features/auth/social-auth';
import { publicWeatherSummary, sanitizeStyleTags, sanitizeTitle, validateHandle } from '@/features/community/moderation-policy';

describe('OAuth callback parsing', () => {
  it('reads the PKCE code from query or fragment', () => {
    expect(parseAuthCallback('wearlog://auth/callback?code=abc')).toEqual({ code: 'abc', error: null });
    expect(parseAuthCallback('wearlog://auth/callback#code=xyz')).toEqual({ code: 'xyz', error: null });
  });

  it('surfaces provider errors and cancellation', () => {
    expect(parseAuthCallback('wearlog://auth/callback?error=access_denied&error_description=User+cancelled').error).toBe('User cancelled');
    expect(parseAuthCallback('wearlog://auth/callback')).toEqual({ code: null, error: null });
  });

  it('builds the Expo Go redirect from the dev host', () => {
    expect(expoGoCallbackUrl('192.168.0.5:8081')).toBe('exp://192.168.0.5:8081/--/auth/callback');
  });

  it('lists only providers enabled in Supabase', () => {
    expect(enabledSocialProviders({ external: { kakao: true, google: false } })).toEqual(['kakao']);
    expect(enabledSocialProviders(null)).toEqual([]);
  });
});

describe('community policy', () => {
  it('validates handles', () => {
    expect(validateHandle('style.daily')).toBeNull();
    expect(validateHandle('ab')).not.toBeNull();
    expect(validateHandle('my.wearlog')).not.toBeNull();
    expect(validateHandle('a..b')).not.toBeNull();
  });

  it('keeps only known style tags, max 3, and trims titles', () => {
    expect(sanitizeStyleTags(['minimal', 'x', 'street', 'minimal', 'casual', 'classic'])).toEqual(['minimal', 'street', 'casual']);
    expect(sanitizeTitle('  비 오는   날 ')).toBe('비 오는 날');
    expect(sanitizeTitle('')).toBeNull();
  });

  it('public weather summary is coarse and location-free', () => {
    expect(publicWeatherSummary(12.4, true)).toBe('비 오는 날 · 12°C');
    expect(publicWeatherSummary(null, false)).toBeNull();
  });
});
