// "Tonight's Pulls" — cross-user feed of every published draw, newest
// first. The visual unit is a card thumbnail with author chip + card
// name + short reading excerpt; tap opens DrawViewer for the full read.
//
// The wall reads as a quiet bulletin board, not a noisy social feed:
// 2-column grid of square card images, italic captions below. Pink dot
// + "ALTERU · ARCANA" top bar mirrors the rest of the game.
import { useState } from 'react';
import { cardById } from '../data/cards';
import { locale, t } from '../i18n';
import { formatDate, timeSince } from '../utils/day';
import DrawViewer from './DrawViewer';
import type { PublishedDraw } from '../types';

interface Props {
  entries: PublishedDraw[];
  loaded: boolean;
  todayKey: string;
  selfId?: string | null;
  heartedIds: Set<string>;
  onHeart: (draw: PublishedDraw) => void;
  onClose: () => void;
  /** Tap a card row to descend into that arcanum's Room (filtered view). */
  onOpenRoom: (cardId: number) => void;
}

export default function Wall({
  entries, loaded, todayKey, selfId, heartedIds, onHeart, onClose, onOpenRoom,
}: Props) {
  const isZh = locale() === 'zh';
  const [selected, setSelected] = useState<PublishedDraw | null>(null);

  return (
    <div className="da-wall">
      <div className="da-topbar">
        <div className="da-topbar__l">
          <span className="pink-dot" /> ALTERU · ARCANA
        </div>
        <div className="da-topbar__r">{formatDate(todayKey, isZh ? 'zh' : 'en')}</div>
      </div>
      <div className="da-toprule" />

      <div className="da-wall__hd">
        <div className="da-wall__hd-row">
          <button className="da-collection__back" onClick={onClose}>
            <span className="arr">←</span>
            {isZh ? '返回' : 'Back'}
          </button>
          <div className="da-collection__hd-r">{t('wall_title')}</div>
        </div>
        <div className="da-collection__hd-eyebrow">
          {isZh ? '深夜塔罗' : 'A LATE-NIGHT TAROT'}
        </div>
        <h2 className="da-collection__hd-title">
          {t('wall_subtitle')}
        </h2>
        <div className="da-collection__hd-count">
          {t('wall_count', { N: entries.length })}
        </div>
        <div className="da-collection__hd-divider" />
      </div>

      {!loaded && (
        <div className="da-wall__loading">
          <em>{isZh ? '正在翻看今夜的牌…' : 'gathering tonight’s pulls…'}</em>
        </div>
      )}
      {loaded && entries.length === 0 && (
        <div className="da-wall__empty">
          {isZh ? '墙上还没有牌 — 你是第一个。' : 'the wall is empty — be the first.'}
        </div>
      )}

      <div className="da-wall__grid">
        {entries.map(draw => {
          const card = cardById(draw.cardId);
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
                <button
                  type="button"
                  className="da-wall__cell-name"
                  onClick={() => onOpenRoom(card.id)}
                  aria-label={`${isZh ? '查看' : 'see'} ${isZh ? card.zhName : card.name}`}
                >
                  {isZh ? card.zhName : card.name}
                </button>
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
