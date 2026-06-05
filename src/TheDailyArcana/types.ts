export type DayKey = string; // YYYY-MM-DD in local time

export type Phase = 'idle' | 'drawing' | 'generating' | 'revealing' | 'done' | 'collection';

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
}
