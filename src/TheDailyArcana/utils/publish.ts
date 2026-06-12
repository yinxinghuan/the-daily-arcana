// Publish a draw to the cross-user wall + per-card rooms.
//
// Every reveal pipes through here once the gen-image lands and the local
// daily lock is flipped. The save-list row is keyed by user_id + session_id
// so the platform stores one row per user per session; we overwrite our
// own row on every publish — a player who re-views their card later in
// the day doesn't generate a second row, because the platform dedupes
// per (user, session, resource hash).
//
// Failure is silent on the cross-user side — the player's private history
// is the source of truth for "I drew today". The wall just sees one less
// row for the next refresh.

import { getGameUuid, postAigramAPI, telegramId, isInAigram } from '@shared/runtime';
import type { PublishedDraw } from '../types';

export async function publishDraw(draw: PublishedDraw): Promise<void> {
  if (!isInAigram || !telegramId) return;
  const sessionId = getGameUuid();
  if (!sessionId) return;
  try {
    await postAigramAPI('/note/aigram/ai/game/save/data', {
      session_id: sessionId,
      resource_data: JSON.stringify(draw),
    });
  } catch {
    // Wall miss is acceptable — local history is the source of truth.
  }
}
