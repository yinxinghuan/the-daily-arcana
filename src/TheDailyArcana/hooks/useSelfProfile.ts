import { useEffect, useState } from 'react';
import { callAigramAPI } from '@shared/runtime/bridge';
import { waitForAigramIdentity } from '@shared/runtime/identity-ready';

interface SelfProfile {
  name?: string;
  avatarUrl?: string;
}

interface AigramUserData {
  name?: string;
  head_url?: string;
}

interface AigramResponse<T> {
  data?: T;
  code?: number;
  message?: string;
}

/**
 * Look up the current Aigram user's display name + avatar via the
 * `/note/telegram/user/get/info/by/telegram_id` endpoint. Avatar is then
 * used as the img2img reference for figure cards. Outside Aigram (local
 * dev / preview), returns `null`. */
export function useSelfProfile(): SelfProfile | null {
  const [profile, setProfile] = useState<SelfProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const telegramId = await waitForAigramIdentity();
      if (cancelled || !telegramId) return;
      try {
        const r = await callAigramAPI<AigramResponse<AigramUserData>>(
          `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(telegramId)}`,
          'GET',
        );
        if (cancelled) return;
        const d = r?.data;
        setProfile({ name: d?.name, avatarUrl: d?.head_url });
      } catch {
        if (!cancelled) setProfile(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return profile;
}
