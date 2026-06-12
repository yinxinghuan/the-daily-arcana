// 22-card collection grid. Editorial v5 spec:
//   · drawn = painted miniature in 1:1 cell, name italic + date small caps below
//   · today = pink outline ring + pink date
//   · undrawn = empty cell, thin cream border, italic roman numeral centered
//
// Scrollable container — rows use plain divs (no row tap target), so
// scroll-vs-click rule doesn't apply yet. If we add row taps later they
// must use onClick.
import { useMemo, useState } from 'react';
import { CARDS } from '../data/cards';
import { locale, t } from '../i18n';
import { formatDate } from '../utils/day';
import { toRoman } from '../utils/roman';
import type { ArcanaCard, Draw } from '../types';

interface Props {
  history: Draw[];
  todayKey: string;
  playerName?: string | null;
  onClose: () => void;
}

export default function Collection({ history, todayKey, playerName, onClose }: Props) {
  const isZh = locale() === 'zh';
  const [selected, setSelected] = useState<{ card: ArcanaCard; draw: Draw } | null>(null);

  // earliest draw per card = the "first drawn" entry shown
  const firstByCard = useMemo(() => {
    const out = new Map<number, Draw>();
    for (const d of history) {
      const prev = out.get(d.cardId);
      if (!prev || prev.date > d.date) out.set(d.cardId, d);
    }
    return out;
  }, [history]);

  const drawnCount = firstByCard.size;

  return (
    <div className="da-collection">
      <div className="da-topbar da-topbar--overlay">
        <button className="da-collection__back" onClick={onClose}>
          <span className="arr">←</span>
          {isZh ? '返回' : 'Back'}
        </button>
        <div className="da-topbar__title">
          {isZh ? '你的收藏' : 'Your Deck'}
        </div>
        <div className="da-topbar__r">{formatDate(todayKey, isZh ? 'zh' : 'en')}</div>
      </div>

      <div className="da-collection__hd">
        <div className="da-collection__hd-eyebrow">
          {isZh ? '深夜塔罗' : 'A LATE-NIGHT TAROT'}
        </div>
        <h2 className="da-collection__hd-title">
          {isZh ? '主牌' : 'Major Arcana'}
        </h2>
        <div className="da-collection__hd-count">
          <strong>{toRoman(drawnCount)}</strong>
          {'  '}{isZh ? '/' : 'of'}{'  '}XXII
        </div>
        <div className="da-collection__hd-divider" />
      </div>

      <div className="da-collection__grid">
        {CARDS.map((card) => {
          const draw = firstByCard.get(card.id);
          const drawn = !!draw;
          const isToday = drawn && draw!.date === todayKey;
          const cls = ['da-collection__cell'];
          cls.push(drawn ? 'is-drawn' : 'is-undrawn');
          if (isToday) cls.push('is-today');
          return (
            <div
              key={card.id}
              className={cls.join(' ')}
              onClick={drawn ? () => setSelected({ card, draw: draw! }) : undefined}
              role={drawn ? 'button' : undefined}
            >
              <div className="da-collection__cell-face">
                {drawn ? (
                  <img
                    src={draw!.imageUrl}
                    alt={isZh ? card.zhName : card.name}
                    draggable={false}
                  />
                ) : (
                  <span className="da-collection__cell__numeral">{toRoman(card.id)}</span>
                )}
              </div>
              <div className="da-collection__cell-name">
                {isZh ? card.zhName : card.name}
              </div>
              <div className="da-collection__cell-date">
                {drawn
                  ? (isToday ? t('collection_today') : formatDate(draw!.date, isZh ? 'zh' : 'en'))
                  : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <CardDetail
          card={selected.card}
          draw={selected.draw}
          todayKey={todayKey}
          playerName={playerName}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CardDetail({
  card, draw, todayKey, playerName, onClose,
}: {
  card: ArcanaCard; draw: Draw; todayKey: string;
  playerName?: string | null; onClose: () => void;
}) {
  const isZh = locale() === 'zh';
  const name = playerName ?? (isZh ? '你' : 'you');
  const reading = (isZh ? card.zhReading : card.reading).replace(/\{NAME\}/g, name);
  const dateLabel = draw.date === todayKey
    ? t('collection_today')
    : formatDate(draw.date, isZh ? 'zh' : 'en');

  return (
    <div className="da-detail" onClick={onClose}>
      <div className="da-detail__card" onClick={e => e.stopPropagation()}>
        <button className="da-detail__close" onClick={onClose} aria-label="Close">✕</button>
        <div className="da-detail__topmeta">
          <span>{toRoman(card.id)} · {isZh ? '主牌' : t('major_arcana')}</span>
          <span>{dateLabel}</span>
        </div>
        <div className="da-detail__img">
          <img src={draw.imageUrl} alt={isZh ? card.zhName : card.name} draggable={false} />
        </div>
        <div className="da-detail__name">{isZh ? card.zhName : card.name}</div>
        <div className="da-detail__kw">
          {(isZh ? card.zhKeywords : card.keywords).map((k, i, arr) => (
            <span key={k}>
              {k}
              {i < arr.length - 1 && <span className="dot">·</span>}
            </span>
          ))}
        </div>
        <p className="da-detail__text">{reading}</p>
      </div>
    </div>
  );
}
