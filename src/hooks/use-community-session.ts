import { useEffect, useState } from 'react';

import type { CommunitySession } from '@/features/community/community-repository';
import { communityRepository } from '@/features/community/supabase-community-repository';

export function useCommunitySession(): { session: CommunitySession | null; loading: boolean; configured: boolean } {
  const configured = communityRepository.status() === 'ready';
  const [session, setSession] = useState<CommunitySession | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    communityRepository
      .getSession()
      .then((s) => alive && setSession(s))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    const off = communityRepository.onSessionChange((s) => alive && setSession(s));
    return () => {
      alive = false;
      off();
    };
  }, [configured]);

  return { session, loading, configured };
}
