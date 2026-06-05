// The card front. The gen-image painting IS the card — the model already
// paints its own ornate gold border + cream paper + roman numeral as part
// of the artwork, so we render the image full-bleed inside a 1:1 wrapper
// and trust the painting to carry the whole frame.
//
// While generating: a warm cream painted placeholder + a ghost of the
// card name breathing through it.
import type { ArcanaCard } from '../types';
import { locale } from '../i18n';

export interface CardFaceProps {
  card: ArcanaCard;
  imageUrl: string | null;     // null while generating
  loading?: boolean;
}

export default function CardFace({ card, imageUrl, loading }: CardFaceProps) {
  const isZh = locale() === 'zh';
  if (imageUrl) {
    return (
      <div className="da-card">
        <img src={imageUrl} alt={card.name} draggable={false} />
      </div>
    );
  }
  // Placeholder while gen-image runs.
  return (
    <div className={`da-paint${loading ? ' is-loading' : ''}`}>
      <div className="da-paint__ghost">
        {isZh ? card.zhName : card.name.replace(/^The\s+/i, '')}
      </div>
    </div>
  );
}
