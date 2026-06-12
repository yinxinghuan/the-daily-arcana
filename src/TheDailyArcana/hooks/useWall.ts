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

function isWellFormedDraw(parsed: unknown): parsed is PublishedDraw {
  const d = parsed as PublishedDraw | null | undefined;
  if (!d) return false;
  if (typeof d.cardId !== 'number') return false;
  if (typeof d.imageUrl !== 'string') return false;
  if (typeof d.ts !== 'number') return false;
  if (typeof d.id !== 'string') return false;
  return true;
}

/** Pull every PublishedDraw out of a single user's save row. One user
 *  may have many past draws (newest first, capped at 30 by the writer),
 *  so a row maps to 0..N draws on the wall, not 0..1.
 *
 *  Three accepted shapes in priority order:
 *    1. NEW (post-2026-06-13): row.published is PublishedDraw[]
 *    2. MID (post-2026-06-12 dual-write fix): row.current is one
 *       PublishedDraw — the user only made one published draw under the
 *       single-value architecture
 *    3. OLD (pre-2026-06-12): the row body IS the PublishedDraw —
 *       pre-fix publishDraw() wrote directly to the save slot */
function parseRow(row: SaveRow): PublishedDraw[] {
  if (!row.resource_data) return [];
  try {
    const parsed = JSON.parse(row.resource_data) as
      | PublishedDraw
      | { current?: PublishedDraw; published?: PublishedDraw[] };
    const arr = (parsed as { published?: PublishedDraw[] }).published;
    if (Array.isArray(arr)) {
      return arr.filter(isWellFormedDraw);
    }
    const nested = (parsed as { current?: PublishedDraw }).current;
    if (isWellFormedDraw(nested)) return [nested];
    if (isWellFormedDraw(parsed)) return [parsed];
    return [];
  } catch {
    return [];
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
      // Dedupe by PublishedDraw.id — a user's save row carries an array
      // of all their past draws, and we don't want repeats if the row
      // changes shape across the rollout.
      const seen = new Set<string>();
      for (const row of rows) {
        for (const d of parseRow(row)) {
          if (seen.has(d.id)) continue;
          seen.add(d.id);
          draws.push(d);
        }
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
