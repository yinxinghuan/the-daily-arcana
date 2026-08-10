// Modal that shows one published draw at full size — card image, card
// name, author chip, reading text, and the heart-react button. Used
// from both the Wall (today's published feed) and the per-card Room.
//
// Tap the backdrop or the X to close. The card image is full-bleed
// inside a 1:1 wrapper, same as the live reveal screen — so reading a
// stranger's pull feels like the same artifact the player saw on their
// own reveal.
import { useState } from 'react';
import { cardById } from '../data/cards';
import { locale, t } from '../i18n';
import { formatDate, timeSince } from '../utils/day';
import { toRoman } from '../utils/roman';
import { openAigramProfile, isInAigramNow } from '../../shared/runtime';
import { threadFor, timeAgo, type GuestMessage } from '@shared/social/guestbook';
import type { PublishedDraw } from '../types';

const ALTERU_APP_URL = 'https://apps.apple.com/app/id6769646546';

interface Props {
  draw: PublishedDraw;
  selfId?: string | null;
  hearted: boolean;
  onHeart: () => void;
  onClose: () => void;
  /** When provided (Wall context), shows a link into this card's Room.
   *  Omitted from the Room itself, where the link would be redundant. */
  onOpenRoom?: (cardId: number) => void;
  /** Public guestbook notes, grouped by draw id (best-effort cross-user). */
  messagesByTarget?: Map<string, GuestMessage[]>;
  /** The viewer's OWN outgoing notes (so a just-sent note echoes instantly). */
  myMessages?: GuestMessage[];
  /** Current player id — renders own notes as "you", skips self profile tap. */
  myUserId?: string | null;
  /** Leave a note on this draw. Omit / guard via isInAigram for the compose box. */
  onSendNote?: (text: string) => void;
}

export default function DrawViewer({
  draw, selfId, hearted, onHeart, onClose, onOpenRoom,
  messagesByTarget, myMessages, myUserId, onSendNote,
}: Props) {
  const isZh = locale() === 'zh';
  const card = cardById(draw.cardId);
  const isSelf = !!selfId && String(selfId) === String(draw.authorId);

  const thread = threadFor(
    draw.id,
    messagesByTarget ?? new Map(),
    myMessages,
    myUserId ?? undefined,
  );

  const initial = (draw.authorName || '?').slice(0, 1).toUpperCase();

  const openProfile = () => {
    if (isSelf || !isInAigramNow() || !draw.authorId) return;
    openAigramProfile(draw.authorId);
  };

  const ageLabel = timeSince(draw.ts, isZh ? 'zh' : 'en')
    ?? formatDate(draw.date, isZh ? 'zh' : 'en');

  return (
    <div className="da-detail" onClick={onClose}>
      <div className="da-detail__card" onClick={e => e.stopPropagation()}>
        <div className="da-detail__topmeta">
          <span>{toRoman(card.id)} · {isZh ? '主牌' : t('major_arcana')}</span>
          <span>{ageLabel}</span>
        </div>
        {/* Tap the card image (or the backdrop) to close — same easy-exit
            gesture as Hour Capsule. No floating ✕ button to collide with the
            topmeta row or the platform's own top-right chrome. */}
        <div className="da-detail__img" onClick={onClose} role="button" aria-label={isZh ? '关闭' : 'Close'}>
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
              disabled={!isInAigramNow()}
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
            onClick={onHeart}
            disabled={hearted}
            aria-label={hearted ? t('heart_done') : t('heart_react')}
          >
            <span className="da-detail__heart-glyph">{hearted ? '♥' : '♡'}</span>
            <span className="da-detail__heart-label">
              {hearted ? t('heart_done') : t('heart_react')}
            </span>
          </button>
        )}

        {/* Public guestbook — notes left on this draw + a compose box.
            Best-effort cross-user display + author ping (see @shared/social). */}
        <div className="da-notes">
          <div className="da-notes__eyebrow">
            {t('notes_title')}{thread.length > 0 ? ` · ${thread.length}` : ''}
          </div>
          {thread.length > 0 ? (
            <ul className="da-notes__list">
              {thread.map(m => (
                <NoteRow key={m.id} msg={m} myUserId={myUserId} />
              ))}
            </ul>
          ) : (
            <div className="da-notes__empty">{t('notes_empty')}</div>
          )}
          {isInAigramNow() && onSendNote ? (
            <Compose onSend={onSendNote} placeholder={t('notes_placeholder')} sendLabel={t('notes_send')} />
          ) : (
            <div className="da-notes__empty da-notes__download">
              <span>{t('notes_open_app')}</span>
              <a href={ALTERU_APP_URL} target="_blank" rel="noopener noreferrer">
                {t('download_alteru')}
              </a>
            </div>
          )}
        </div>

        {onOpenRoom && (
          <button
            type="button"
            className="da-detail__room-link"
            onClick={() => onOpenRoom(card.id)}
          >
            {t('view_room')} <span className="da-detail__room-arr">→</span>
          </button>
        )}
      </div>
    </div>
  );
}

// One note: author chip (tappable → profile, self shows "you"), text, time.
function NoteRow({ msg, myUserId }: { msg: GuestMessage; myUserId?: string | null }) {
  const isZh = locale() === 'zh';
  const mine = !!msg.fromUserId && !!myUserId && String(msg.fromUserId) === String(myUserId);
  const name = mine ? (isZh ? '你' : 'you') : (msg.userName || (isZh ? '某人' : 'someone'));
  const initial = (msg.userName || '?').slice(0, 1).toUpperCase();
  const tappable = !mine && !!msg.fromUserId && isInAigramNow();
  const head = (
    <span className="da-note__head">
      {msg.userAvatarUrl
        ? <img className="da-note__avatar" src={msg.userAvatarUrl} alt="" draggable={false} />
        : <span className="da-note__avatar">{initial}</span>}
      <span className={`da-note__name${mine ? ' da-note__name--self' : ''}`}>{name}</span>
      <span className="da-note__time">{timeAgo(msg.ts, isZh ? 'zh' : 'en')}</span>
    </span>
  );
  return (
    <li className="da-note">
      {tappable ? (
        <button
          type="button"
          className="da-note__chip"
          onClick={(e) => { e.stopPropagation(); openAigramProfile(msg.fromUserId!); }}
        >
          {head}
        </button>
      ) : head}
      <p className="da-note__text">{msg.text}</p>
    </li>
  );
}

// Compose box — controlled input + send; clicks don't bubble to the backdrop.
function Compose({ onSend, placeholder, sendLabel }: { onSend: (text: string) => void; placeholder: string; sendLabel: string }) {
  const [text, setText] = useState('');
  const submit = () => {
    const v = text.trim();
    if (!v) return;
    onSend(v);
    setText('');
  };
  return (
    <div className="da-compose" onClick={e => e.stopPropagation()}>
      <input
        className="da-compose__input"
        value={text}
        maxLength={140}
        placeholder={placeholder}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
      />
      <button
        className="da-compose__send"
        disabled={!text.trim()}
        onClick={submit}
      >
        {sendLabel}
      </button>
    </div>
  );
}
