// Modal that shows one published draw at full size — card image, card
// name, author chip, reading text, and the heart-react button. Used
// from both the Wall (today's published feed) and the per-card Room.
//
// Tap the backdrop or the X to close. The card image is full-bleed
// inside a 1:1 wrapper, same as the live reveal screen — so reading a
// stranger's pull feels like the same artifact the player saw on their
// own reveal.
import { cardById } from '../data/cards';
import { locale, t } from '../i18n';
import { formatDate, timeSince } from '../utils/day';
import { toRoman } from '../utils/roman';
import { openAigramProfile, isInAigram } from '../../shared/runtime';
import type { PublishedDraw } from '../types';

interface Props {
  draw: PublishedDraw;
  selfId?: string | null;
  hearted: boolean;
  onHeart: () => void;
  onClose: () => void;
}

export default function DrawViewer({ draw, selfId, hearted, onHeart, onClose }: Props) {
  const isZh = locale() === 'zh';
  const card = cardById(draw.cardId);
  const isSelf = !!selfId && String(selfId) === String(draw.authorId);

  const initial = (draw.authorName || '?').slice(0, 1).toUpperCase();

  const openProfile = () => {
    if (isSelf || !isInAigram || !draw.authorId) return;
    openAigramProfile(draw.authorId);
  };

  const ageLabel = timeSince(draw.ts, isZh ? 'zh' : 'en')
    ?? formatDate(draw.date, isZh ? 'zh' : 'en');

  return (
    <div className="da-detail" onClick={onClose}>
      <div className="da-detail__card" onClick={e => e.stopPropagation()}>
        <button className="da-detail__close" onClick={onClose} aria-label="Close">✕</button>
        <div className="da-detail__topmeta">
          <span>{toRoman(card.id)} · {isZh ? '主牌' : t('major_arcana')}</span>
          <span>{ageLabel}</span>
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

        {/* Author chip — tappable to open the author's Aigram profile,
            following the cross-user-profile-tap house rule. Self entries
            render as a plain "YOU" without the tap affordance. */}
        <div className="da-detail__byline">
          {isSelf ? (
            <span className="da-detail__byline-name da-detail__byline-name--self">
              {isZh ? '你' : 'YOU'}
            </span>
          ) : (
            <button
              type="button"
              className="da-detail__byline-btn"
              onClick={openProfile}
              disabled={!isInAigram}
            >
              {draw.authorAvatarUrl ? (
                <img
                  className="da-detail__byline-avatar"
                  src={draw.authorAvatarUrl}
                  alt=""
                  draggable={false}
                />
              ) : (
                <span className="da-detail__byline-avatar">{initial}</span>
              )}
              <span className="da-detail__byline-name">{draw.authorName || '—'}</span>
            </button>
          )}
        </div>

        <p className="da-detail__text">{draw.reading}</p>

        {/* Heart — own draws don't show a heart (the author isn't
            reacting to themselves). The hearted state is owned by the
            parent; the button only signals intent + visual flip. */}
        {!isSelf && (
          <button
            className={`da-detail__heart${hearted ? ' is-hearted' : ''}`}
            onPointerDown={onHeart}
            disabled={hearted}
            aria-label={hearted ? t('heart_done') : t('heart_react')}
          >
            <span className="da-detail__heart-glyph">{hearted ? '♥' : '♡'}</span>
            <span className="da-detail__heart-label">
              {hearted ? t('heart_done') : t('heart_react')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
