// Cross-user wall reader.
//
// Pulls every PublishedDraw the platform has for this game session, joins
// each row with its author's profile info (avatar + name), and returns a
// reverse-chronological list. The Wall screen renders this directly; the
// Room (per-card) screen filters by cardId before rendering.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  callAigramAPI,
  isInAigram,
  getGameUuid,
  type AigramResponse,
} from '@shared/runtime';
import type { PublishedDraw } from '../types';

interface SaveRow {
  user_id: string;
  time?: string;
  resource_data?: string;
}

interface UserInfo {
  name?: string;
  head_url?: string;
}

const PROFILE_CACHE = new Map<string, UserInfo>();

async function fetchUserInfo(userId: string): Promise<UserInfo> {
  const cached = PROFILE_CACHE.get(userId);
  if (cached) return cached;
  try {
    const res = await callAigramAPI<AigramResponse<UserInfo & { telegram_id?: string }>>(
      `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(userId)}`,
      'GET',
    );
    const info: UserInfo = {
      name: res?.data?.name,
      head_url: res?.data?.head_url,
    };
    PROFILE_CACHE.set(userId, info);
    return info;
  } catch {
    PROFILE_CACHE.set(userId, {});
    return {};
  }
}

function parseRow(row: SaveRow): PublishedDraw | null {
  if (!row.resource_data) return null;
  try {
    const parsed = JSON.parse(row.resource_data) as PublishedDraw;
    // Validate the minimum shape — discard local-only saves (ArcanaSave)
    // that happen to land in the same list. PublishedDraws carry cardId +
    // imageUrl + ts; ArcanaSaves carry history + lastDrawDay.
    if (typeof parsed?.cardId !== 'number') return null;
    if (typeof parsed?.imageUrl !== 'string') return null;
    if (typeof parsed?.ts !== 'number') return null;
    if (typeof parsed?.id !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useWall() {
  const [entries, setEntries] = useState<PublishedDraw[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    if (!isInAigram) {
      setLoaded(true);
      return;
    }
    const sessionId = getGameUuid();
    if (!sessionId) {
      setLoaded(true);
      return;
    }
    inflight.current = true;
    try {
      const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
        `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
        'GET',
      );
      const rows = Array.isArray(res?.data) ? res.data : [];
      const draws: PublishedDraw[] = [];
      for (const row of rows) {
        const d = parseRow(row);
        if (!d) continue;
        draws.push(d);
      }
      // Hydrate author info — only for rows missing it (older draws may
      // not have carried author name/avatar at publish time).
      const idsMissing = Array.from(new Set(
        draws.filter(d => !d.authorAvatarUrl || !d.authorName).map(d => d.authorId),
      ));
      const infos = await Promise.all(idsMissing.map(fetchUserInfo));
      const infoMap = new Map(idsMissing.map((id, i) => [id, infos[i]]));
      const hydrated = draws.map(d => ({
        ...d,
        authorName: d.authorName ?? infoMap.get(d.authorId)?.name,
        authorAvatarUrl: d.authorAvatarUrl ?? infoMap.get(d.authorId)?.head_url,
      }));
      // Newest first.
      hydrated.sort((a, b) => b.ts - a.ts);
      setEntries(hydrated);
    } catch {
      // Keep stale entries on network error.
    } finally {
      inflight.current = false;
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { entries, loaded, refresh };
}
