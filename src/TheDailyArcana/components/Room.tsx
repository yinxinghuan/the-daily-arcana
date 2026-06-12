// Per-card "Room" — every published draw of one arcanum.
//
// Reached from the Done screen ("47 others held this card tonight →")
// or from any Wall row by tapping the card name. The room reads as
// "every face that touched this card", reinforcing the mystical
// communal-resonance angle: you're not alone holding this card.
//
// Same DrawViewer modal as the Wall — taps a thumbnail to expand.
import { useMemo, useState } from 'react';
import { cardById } from '../data/cards';
import { locale, t } from '../i18n';
import { formatDate, timeSince } from '../utils/day';
import { toRoman } from '../utils/roman';
import DrawViewer from './DrawViewer';
import type { PublishedDraw } from '../types';

interface Props {
  cardId: number;
  /** The entire wall feed — Room filters internally. */
  entries: PublishedDraw[];
  loaded: boolean;
  todayKey: string;
  selfId?: string | null;
  heartedIds: Set<string>;
  onHeart: (draw: PublishedDraw) => void;
  onBack: () => void;
}

export default function Room({
  cardId, entries, loaded, todayKey, selfId, heartedIds, onHeart, onBack,
}: Props) {
  const isZh = locale() === 'zh';
  const card = cardById(cardId);
  const [selected, setSelected] = useState<PublishedDraw | null>(null);

  const filtered = useMemo(
    () => entries.filter(e => e.cardId === cardId),
    [entries, cardId],
  );

  return (
    <div className="da-room">
      <div className="da-topbar">
        <div className="da-topbar__l">
          <span className="pink-dot" /> ALTERU · ARCANA
        </div>
        <div className="da-topbar__r">{formatDate(todayKey, isZh ? 'zh' : 'en')}</div>
      </div>
      <div className="da-toprule" />
      <div className="da-overlay-nav">
        <button className="da-collection__back" onClick={onBack}>
          <span className="arr">←</span>
          {isZh ? '返回' : 'Back'}
        </button>
        <div className="da-collection__hd-r">
          {toRoman(card.id)} · {isZh ? '主牌' : t('major_arcana')}
        </div>
      </div>

      <div className="da-room__hd">
        <div className="da-collection__hd-eyebrow">
          {t('room_eyebrow')}
        </div>
        <h2 className="da-collection__hd-title">
          {isZh ? card.zhName : card.name}
        </h2>
        <div className="da-room__kw">
          {(isZh ? card.zhKeywords : card.keywords).map((k, i, arr) => (
            <span key={k}>
              {k}
              {i < arr.length - 1 && <span className="dot">·</span>}
            </span>
          ))}
        </div>
        <div className="da-collection__hd-count">
          {t('room_count', { N: filtered.length })}
        </div>
        <div className="da-collection__hd-divider" />
      </div>

      {!loaded && (
        <div className="da-wall__loading">
          <em>{isZh ? '正在召集本牌持者…' : 'gathering holders…'}</em>
        </div>
      )}
      {loaded && filtered.length === 0 && (
        <div className="da-wall__empty">
          {isZh
            ? '还没有别人持过这张牌。你是这张牌的第一束光。'
            : 'no one else has held this card yet. you are the first.'}
        </div>
      )}

      <div className="da-wall__grid">
        {filtered.map(draw => {
          const initial = (draw.authorName || '?').slice(0, 1).toUpperCase();
          const isSelf = !!selfId && String(selfId) === String(draw.authorId);
          return (
            <div key={draw.id} className="da-wall__cell">
              <button
                type="button"
                className="da-wall__cell-img"
                onClick={() => setSelected(draw)}
                aria-label={`${isZh ? card.zhName : card.name} — ${draw.authorName || ''}`}
              >
                <img src={draw.imageUrl} alt="" draggable={false} />
              </button>
              <div className="da-wall__cell-meta">
                <div className="da-wall__cell-byline">
                  {draw.authorAvatarUrl ? (
                    <img
                      className="da-wall__cell-avatar"
                      src={draw.authorAvatarUrl}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    <span className="da-wall__cell-avatar">{initial}</span>
                  )}
                  <span className="da-wall__cell-author">
                    {isSelf ? (isZh ? '你' : 'YOU') : (draw.authorName || '—')}
                  </span>
                  <span className="da-wall__cell-sep">·</span>
                  <span className="da-wall__cell-age">
                    {timeSince(draw.ts, isZh ? 'zh' : 'en') ?? formatDate(draw.date, isZh ? 'zh' : 'en')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <DrawViewer
          draw={selected}
          selfId={selfId}
          hearted={heartedIds.has(selected.id)}
          onHeart={() => onHeart(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
