// Painted deck back — Pamela Colman Smith × Art Nouveau symmetric
// mandala, gen-image output sitting in public/. 1:1 to match the
// gen-image card geometry; same dropshadow + breathe animation as the
// face cards. No SVG fallback — the asset ships with the bundle.
import { memo } from 'react';

export default memo(function DeckBack() {
  return (
    <img
      className="da-deck-back-img"
      src="/the-daily-arcana/deck_back.webp"
      alt=""
      draggable={false}
    />
  );
});
