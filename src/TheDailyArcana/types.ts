export type DayKey = string; // YYYY-MM-DD in local time

export type Phase =
  | 'idle'
  | 'drawing'
  | 'generating'
  | 'revealing'
  | 'done'
  | 'collection'
  | 'wall'       // Cross-user feed of all published pulls (today + older).
  | 'room'       // Per-card constellation — every published pull of one arcanum.
  ;

export interface ArcanaCard {
  id: number;          // 0-21
  key: string;         // lowercase slug
  name: string;        // 'The Fool' (display, English)
  zhName: string;      // '愚者'
  keywords: string[];  // 3 keywords (en)
  zhKeywords: string[];
  /** Whether the player avatar should be the central figure on this card.
   *  Place-cards (Tower / Wheel / World) read better without a forced
   *  face, but Lovers / Magician / Fool need the player. */
  hasFigure: boolean;
  /** Subject line that fills the {SUBJECT} slot in the global prompt.
   *  Describes WHAT the figure is doing / the visual conceit. */
  subject: string;
  /** Short 1-2 sentence reading shown on reveal. {NAME} → player username. */
  reading: string;
  zhReading: string;
}

export interface Draw {
  date: DayKey;
  cardId: number;
  imageUrl: string;
  /** ms epoch. Optional for legacy reads — defaults to 0 when missing.
   *  Used to display "drawn Xh ago" on revisit. */
  ts?: number;
}

export interface ArcanaSave {
  /** Source of truth for the daily lock. Compare ONLY to today's local
   *  day key — NEVER OR with platform aggregate stats (daily-lock-trap). */
  lastDrawDay?: DayKey;
  /** All past draws, newest first. */
  history: Draw[];
  /** PublishedDraw ids the player has heart-reacted to. Persisted so a
   *  refresh / re-mount preserves the hearted state without a per-row
   *  remote read. Newest first, capped to 200 (the heart is also OR-able
   *  against the optimistic state during the same session). */
  hearts?: string[];
}

/**
 * A draw the player has published to the cross-user wall + per-card rooms.
 * Frozen at publish time so the wall renders without re-fetching anything.
 *
 * Auto-published 2026-06-12 — every draw goes here in addition to the
 * player's private history. The platform save list is keyed by
 * (session_id, user_id, draw_id) so each draw becomes one row visible to
 * everyone hitting the same session.
 */
export interface PublishedDraw {
  /** Stable id — `${userId}:${date}` for the day-pull (user can only
   *  publish one draw per UTC day). */
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  date: DayKey;
  /** ms epoch — the moment the player saw the reveal. */
  ts: number;
  cardId: number;
  imageUrl: string;
  /** Personalized reading text rendered on the reveal — frozen with the
   *  publish so the wall doesn't re-substitute {NAME} for every viewer. */
  reading: string;
  /** Locale the reading was written in. Lets a zh viewer see an English
   *  reading next to its native original without retranslating. */
  locale?: 'zh' | 'en';
}
