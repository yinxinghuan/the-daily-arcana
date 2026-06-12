import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent, useGameStats, telegramId } from '@shared/runtime';
import DeckBack from './components/DeckBack';
import CardFace from './components/CardFace';
import Collection from './components/Collection';
import Wall from './components/Wall';
import Room from './components/Room';
import Watermark from './components/Watermark';
import { useArcanaGen } from './hooks/useArcanaGen';
import { useSelfProfile } from './hooks/useSelfProfile';
import { useWall } from './hooks/useWall';
import { CARDS, cardById } from './data/cards';
import { todayKey, formatDate, formatCountdown, msUntilMidnight, timeSince } from './utils/day';
import { preloadImage } from './utils/preload';
import { toRoman } from './utils/roman';
import {
  installGlobalTapFeedback,
  startAmbient,
  stopAmbient,
  playCardSlide,
  playCardThud,
  playReveal,
} from './utils/audio';
import { t, locale } from './i18n';
import type { ArcanaSave, Phase, Draw, PublishedDraw } from './types';
import './TheDailyArcana.less';

export default function TheDailyArcana() {
  const demo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('demo');
  }, []);

  const { savedData, persist } = useGameSave<ArcanaSave>('the-daily-arcana');
  const arcanaGen = useArcanaGen();
  const profile = useSelfProfile();
  const events = useGameEvent();
  const isZh = locale() === 'zh';

  const today = todayKey();

  // ─── State ───────────────────────────────────────────────────────

  // Local mirror — useGameSave.savedData does NOT update after persist().
  const [mirror, setMirror] = useState<ArcanaSave | undefined>(undefined);
  useEffect(() => {
    if (mirror === undefined && savedData !== undefined) {
      setMirror(savedData ?? { history: [] });
    }
  }, [savedData, mirror]);

  // Daily lock — local-only derivation. NEVER OR with platform stats.
  const lockedToday = mirror?.lastDrawDay === today;
  const lastDraw: Draw | null = mirror?.history?.[0] ?? null;
  const todaysDraw: Draw | null =
    lastDraw && lastDraw.date === today ? lastDraw : null;

  const [phase, setPhase] = useState<Phase>('idle');
  const [activeCard, setActiveCard] = useState<{ cardId: number; imageUrl: string | null } | null>(null);
  // Which arcanum the per-card Room is showing. Set when descending from
  // either Done ("47 others held this") or any Wall row's card name.
  const [roomCardId, setRoomCardId] = useState<number | null>(null);
  // Cross-user feed (cached + refetched on demand). We hand it the
  // local mirror so the player's OWN published[] is always layered over
  // the server result — get/data/list only returns the 6 most-active
  // users' rows, and the platform save is eventually consistent, so
  // without this layer the player could be invisible to themselves.
  const wall = useWall(mirror);
  // Set of PublishedDraw ids the player has hearted — mirrored from save
  // so the visual flip is instant + survives a remount. Persisted via
  // ArcanaSave.hearts. New entries land here optimistically before the
  // trigger event is acked.
  const heartedIds = useMemo(() => new Set(mirror?.hearts ?? []), [mirror?.hearts]);
  const [hasFirstTouched, setHasFirstTouched] = useState(false);
  const [shareLabel, setShareLabel] = useState('');
  const [errorToast, setErrorToast] = useState<string>('');
  // Live ms-until-midnight. Ticks every 1s while on Done — cheap
  // (just sets one state) and lets the final 5 minutes show a visible
  // mm:ss trickle (formatCountdown handles the format switch). The
  // previous 60s polling left the last minute showing "0 分" for over
  // a minute, which read as a stuck timer.
  const [countdownMs, setCountdownMs] = useState<number>(msUntilMidnight());
  useEffect(() => {
    if (phase !== 'done') return;
    const update = () => setCountdownMs(msUntilMidnight());
    update();
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [phase]);

  // ─── First-touch unlock ──────────────────────────────────────────
  const firstTouchRef = useRef(false);
  useEffect(() => {
    installGlobalTapFeedback();
    function onPointer() {
      if (firstTouchRef.current) return;
      firstTouchRef.current = true;
      setHasFirstTouched(true);
      startAmbient();
    }
    window.addEventListener('pointerdown', onPointer, { once: true });
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  // Once mirror loads + today's already drawn, jump to done.
  useEffect(() => {
    if (mirror === undefined) return;
    if (lockedToday && todaysDraw) {
      setActiveCard({ cardId: todaysDraw.cardId, imageUrl: todaysDraw.imageUrl });
      setPhase('done');
    }
  }, [mirror, lockedToday, todaysDraw]);

  // Demo URL hooks
  useEffect(() => {
    if (!demo) return;
    if (demo === 'idle') setPhase('idle');
    else if (demo === 'reveal') {
      setActiveCard({ cardId: 6, imageUrl: null });
      setPhase('revealing');
    } else if (demo === 'collection') setPhase('collection');
    else if (demo === 'wall') setPhase('wall');
    else if (demo === 'room') { setRoomCardId(6); setPhase('room'); }
  }, [demo]);

  // Ambient pause during reveal so the chime carries the moment.
  useEffect(() => {
    if (phase === 'revealing' || phase === 'done') {
      stopAmbient();
    } else if (hasFirstTouched) {
      startAmbient();
    }
  }, [phase, hasFirstTouched]);

  // ─── Communal counter — "X others drew this tonight" ─────────────
  // Per-card event keyed by card slug. day_user_count = unique users
  // who triggered the event today. The platform daily reset can be
  // stale (memory rule), but THIS is display-only — never a lock — so
  // a stale/inflated count is acceptable; a stale LOCK is not.
  const activeCardKey = activeCard ? cardById(activeCard.cardId).key : '';
  const communeEvent = activeCardKey ? `drew:${activeCardKey}` : '';
  const communeStats = useGameStats(communeEvent);

  // ─── Actions ─────────────────────────────────────────────────────

  const handleDraw = async () => {
    if (lockedToday) return;

    playCardSlide();
    const cardId = Math.floor(Math.random() * CARDS.length);
    const card = cardById(cardId);

    setActiveCard({ cardId, imageUrl: null });
    setPhase('drawing');

    await new Promise((r) => setTimeout(r, 700));
    playCardThud();
    setPhase('generating');

    try {
      const url = await arcanaGen.generate({
        card,
        avatarUrl: profile?.avatarUrl ?? null,
      });
      // Preload BEFORE the phase swap that mounts <img>.
      await preloadImage(url);

      setActiveCard({ cardId, imageUrl: url });
      setPhase('revealing');
      playReveal();

      // Fire-and-forget communal event so others see incremented count.
      events.trigger(`drew:${card.key}`);
      // Refresh after a short delay so this player sees the +1.
      setTimeout(() => communeStats.refresh(), 1500);

      // Persist + flip daily lock + freeze the public PublishedDraw view.
      // ONE save write covers all three concerns — see ArcanaSave.current
      // comment. A previous version made two separate writes (persist +
      // publishDraw) that raced for the same (session_id, user_id) slot
      // and silently clobbered each other; Wall came up empty as a
      // result.
      const ts = Date.now();
      const draw: Draw = { date: today, cardId, imageUrl: url, ts };
      const published: PublishedDraw | undefined = telegramId
        ? {
            id: `${telegramId}:${today}`,
            authorId: String(telegramId),
            authorName: profile?.name,
            authorAvatarUrl: profile?.avatarUrl,
            date: today,
            ts,
            cardId,
            imageUrl: url,
            reading: (isZh ? card.zhReading : card.reading).replace(
              /\{NAME\}/g,
              profile?.name ?? (isZh ? '你' : 'you'),
            ),
            locale: isZh ? 'zh' : 'en',
          }
        : undefined;

      // Append the new published draw to the running array (newest first).
      // Cap at 30 so the save row doesn't bloat for daily players over
      // months — at one draw per day that's still a month of visible
      // history, which is plenty for a 22-card deck.
      const nextPublished: PublishedDraw[] | undefined = published
        ? [published, ...(mirror?.published ?? [])].slice(0, 30)
        : mirror?.published;

      const nextSave: ArcanaSave = {
        lastDrawDay: today,
        history: [draw, ...(mirror?.history ?? [])],
        hearts: mirror?.hearts,
        published: nextPublished,
      };
      setMirror(nextSave);
      persist(nextSave);

      // Refresh the wall so the player's own pull appears next time
      // they open Tonight's Pulls or the per-card Room.
      setTimeout(() => void wall.refresh(), 1500);

      setTimeout(() => setPhase('done'), 1800);
    } catch {
      // Daily lock NOT incremented (we never call persist on failure path).
      // Surface the failure so users know to retry.
      setActiveCard(null);
      setPhase('idle');
      setErrorToast(
        isZh
          ? '画窑熄了 — 再点一次。今日抽牌未消耗。'
          : 'The kiln went cold. Try again — your daily pull was not used.',
      );
      setTimeout(() => setErrorToast(''), 4200);
    }
  };

  // Heart-react to another user's published draw. Optimistic local flip
   // plus a `heart` event with a notify action targeting the original
   // author — they get a 1:1 push showing the player's name + the card.
   // No-op for own draws or already-hearted ids.
  const handleHeart = (draw: PublishedDraw) => {
    if (heartedIds.has(draw.id)) return;
    if (telegramId && String(telegramId) === String(draw.authorId)) return;

    // Optimistic update.
    setMirror(prev => {
      if (!prev) return prev;
      const next: ArcanaSave = {
        ...prev,
        hearts: [draw.id, ...(prev.hearts ?? [])].slice(0, 200),
      };
      persist(next);
      return next;
    });

    const card = cardById(draw.cardId);
    const cardName = isZh ? card.zhName : card.name;
    const template = isZh
      ? `{sender_name} 用 ♥ 标记了你的${cardName}`
      : `{sender_name} marked your ${cardName} with a heart`;

    events.trigger('heart', {
      actions: [
        {
          type: 'notify',
          target_user_id: draw.authorId,
          image: {
            ref_url: draw.imageUrl,
            prompt: 'tarot card painting',
          },
          message: {
            template,
            variables: ['sender_name'],
          },
        },
      ],
    });
  };

  const handleShare = () => {
    if (!activeCard) return;
    const card = cardById(activeCard.cardId);
    const name = isZh ? card.zhName : card.name;
    const reading = (isZh ? card.zhReading : card.reading).replace(
      '{NAME}', profile?.name ?? '',
    );
    const text = `${name} — ${reading.trim()}\n— The Daily Arcana · alteru.studio`;
    try { navigator.clipboard?.writeText(text); } catch { /* no-op */ }
    setShareLabel(t('shared'));
    setTimeout(() => setShareLabel(''), 1600);
  };

  // ─── Derived render data ─────────────────────────────────────────

  const card = activeCard ? cardById(activeCard.cardId) : null;
  const personalizedReading = card
    ? (isZh ? card.zhReading : card.reading).replace(
        '{NAME}', profile?.name ?? (isZh ? '你' : 'you'),
      )
    : '';
  const todayDateLine = formatDate(today, isZh ? 'zh' : 'en');

  // ─── Collection screen short-circuit ─────────────────────────────
  if (phase === 'collection') {
    return (
      <Collection
        history={mirror?.history ?? []}
        todayKey={today}
        playerName={profile?.name ?? null}
        onClose={() => setPhase(lockedToday ? 'done' : 'idle')}
      />
    );
  }

  // ─── Main phases ─────────────────────────────────────────────────

  return (
    <div className="da-root">
      {/* Brand strip (every screen) */}
      <div className="da-topbar">
        <div className="da-topbar__l">
          <span className="pink-dot" /> ALTERU · ARCANA
        </div>
        <div className="da-topbar__r">
          <span className="da-topbar__date">{todayDateLine}</span>
          {(phase === 'idle' || phase === 'done') && (
            <button
              className="da-topbar__deck"
              onPointerDown={() => setPhase('collection')}
              aria-label={isZh ? '查看收藏' : 'View deck'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>{isZh ? '收藏' : 'Deck'}</span>
            </button>
          )}
        </div>
      </div>
      <div className="da-toprule" />

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="da-page">
          {errorToast && <div className="da-toast">{errorToast}</div>}
          <div className="da-idle__head">{t('late_night_tarot')}</div>
          <h1 className="da-idle__title">
            <span className="word">{t('tonight_a_card')}</span>
            <span className="word"><span className="acc">{t('tonight_a_card_2')}</span></span>
            <span className="word">{t('tonight_a_card_3')}</span>
          </h1>
          <div className="da-idle__meta">
            <div className="rule" />
            <div className="text">{t('meta_one_pull')}</div>
          </div>
          <div className="da-idle__deckwrap">
            <button
              className="da-deck"
              onPointerDown={handleDraw}
              aria-label={t('hint_tap_deck')}
            >
              <DeckBack />
            </button>
          </div>
          <div className="da-idle__foot">
            <button
              className="da-link-ghost"
              onPointerDown={() => setPhase('collection')}
            >
              {isZh ? '看收藏' : '— View Deck —'}
            </button>
            <button
              className="da-link-cta"
              onPointerDown={handleDraw}
            >
              {t('cta_draw')} <span className="arrow" />
            </button>
          </div>
          {!hasFirstTouched && (
            <div className="da-firsthint">{t('hint_tap_deck')}</div>
          )}
        </div>
      )}

      {/* DRAWING / GENERATING — hide card identity until reveal */}
      {(phase === 'drawing' || phase === 'generating') && card && (
        <div className="da-page">
          <div className="da-gen__centre">
            <div className="da-gen__kiln">
              <div className="da-gen__kiln-mark">
                {/* AlterU mark — real emblem from public/alteru.svg.
                    Breathes 2.4s while gen-image runs (~3 min). */}
                <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                  <path d="M170.98 80.6864C175.826 80.3379 179.093 82.8464 180.922 87.1309C184.554 95.5742 179.373 98.9845 175.515 105.325C163.859 124.48 165.503 149.557 163.744 170.582C161.932 192.259 154.492 222.584 132.269 231.923C124.974 234.989 114.517 234.372 107.397 231.013C70.2537 212.926 93.1286 160.103 105.525 133.265C109.335 126.098 112.98 118.784 117.907 112.277C121.491 107.547 127.748 104.724 132.998 108.827C135.386 110.694 136.494 114.684 135.563 117.517C133.513 123.752 129.105 129.175 126.136 135.017C117.204 151.711 107.57 173.577 108.149 192.736C108.648 197.729 110.443 203.949 114.709 207.163C121.717 212.44 129.246 209.446 133.613 202.772C139.289 194.091 141.378 184.867 142.431 174.855C143.583 164.684 143.524 154.864 144.04 144.611C144.994 125.736 146.094 103.972 158.412 88.4443C161.509 84.5388 165.905 81.2324 170.98 80.6864Z" />
                  <path d="M86.9111 55.8511C87.5972 55.021 88.2531 54.3294 88.9727 53.5417C91.25 52.4699 98.6717 56.4898 104.848 54.7181C114.926 51.8253 124.216 44.6228 133.929 32.5885C137.352 28.3472 139.875 23.9207 143.53 19.8896C144.863 19.2069 144.275 19.3179 145.281 19.7403C145.408 20.3861 145.647 21.0867 144.974 22.1183C129.708 45.5149 124.762 63.0491 135.86 73.3957C137.561 74.9843 140.36 76.5377 141.933 78.4606L140.234 80.9976C139.451 81.6669 139.143 82.0962 138.465 81.9081C133.792 80.6128 129.85 79.3599 124.485 79.4064C114.232 79.4902 104.957 91.2197 95.9169 103.826C93.848 106.711 90.2527 112.469 87.8923 114.692C86.2512 115.246 86.8375 115.356 85.9333 114.646C86.1422 111.648 90.6859 105.295 92.5935 101.966C103.729 82.5318 103.185 67.3286 93.9942 61.1122C92.4408 60.0674 87.4627 58.0224 86.9111 55.8511Z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="da-gen__foot">
            <em>{t('painting_your_card')}</em>
            <div className="da-loader"><span /><span /><span /></div>
            <div className="da-gen__est">{isZh ? '约 3 分钟' : '~ 3 min'}</div>
          </div>
        </div>
      )}

      {/* REVEAL / DONE */}
      {(phase === 'revealing' || phase === 'done') && card && (
        <div className="da-page">
          <div className="da-reveal__topmeta">
            <div>
              {phase === 'done' && todaysDraw?.ts
                ? (timeSince(todaysDraw.ts, isZh ? 'zh' : 'en') ?? t('your_reading'))
                : t('your_reading')}
            </div>
            <div className="right">{toRoman(card.id)} · {t('major_arcana')}</div>
          </div>
          <div className="da-reveal__cardwrap">
            <CardFace
              card={card}
              imageUrl={activeCard?.imageUrl ?? null}
            />
          </div>
          <div className="da-reveal__head">
            <div className="da-reveal__roman">{toRoman(card.id)}</div>
            <div className="da-reveal__head-rule" />
            <div className="da-reveal__name">
              {isZh ? card.zhName : card.name}
            </div>
          </div>
          <div className="da-reveal__kw">
            {(isZh ? card.zhKeywords : card.keywords).map((k, i, arr) => (
              <span key={k}>
                {k}
                {i < arr.length - 1 && <span className="dot">·</span>}
              </span>
            ))}
          </div>
          {/* Communal counter — "X others drew this tonight". Tapping
              descends into the per-card Room when in the done phase so
              the player can see who else held this card. During the
              revealing phase it stays a plain line — the reveal moment
              is for absorbing the card, not for navigating. */}
          {communeStats.stats.day_user_count > 1 ? (
            phase === 'done' ? (
              <button
                type="button"
                className="da-reveal__commune da-reveal__commune--btn"
                onPointerDown={() => {
                  setRoomCardId(card.id);
                  setPhase('room');
                }}
              >
                {t(
                  communeStats.stats.day_user_count - 1 === 1
                    ? 'commune_others_one'
                    : 'commune_others_many',
                  { N: communeStats.stats.day_user_count - 1 },
                )}
                <span className="da-reveal__commune-arrow">→</span>
              </button>
            ) : (
              <div className="da-reveal__commune">
                {t(
                  communeStats.stats.day_user_count - 1 === 1
                    ? 'commune_others_one'
                    : 'commune_others_many',
                  { N: communeStats.stats.day_user_count - 1 },
                )}
              </div>
            )
          ) : phase === 'done' && communeStats.stats.day_user_count === 1 ? (
            <div className="da-reveal__commune">{t('commune_alone')}</div>
          ) : null}
          <p className="da-reveal__text">{personalizedReading}</p>

          {/* Live countdown to next draw (Done only) */}
          {phase === 'done' && (
            <div className="da-reveal__countdown">
              <div className="da-reveal__countdown-label">
                {isZh ? '距下次抽牌' : 'NEXT READING IN'}
              </div>
              <div className="da-reveal__countdown-value">
                {formatCountdown(countdownMs, isZh ? 'zh' : 'en')}
              </div>
            </div>
          )}

          <div className="da-reveal__nav">
            <button
              className="da-link-nav"
              onPointerDown={() => setPhase('collection')}
            >
              <span className="arr">←</span>{isZh ? '收藏' : 'Deck'}
            </button>
            {phase === 'done' && (
              <button
                className="da-link-nav da-link-nav--pulls"
                onPointerDown={() => setPhase('wall')}
              >
                {isZh ? '众牌墙' : 'Wall'}
                <span className="arr">→</span>
              </button>
            )}
            <button
              className="da-link-nav"
              onPointerDown={handleShare}
              disabled={!!shareLabel}
            >
              {shareLabel || (isZh ? '分享' : 'Share')}
              <span className="arr">→</span>
            </button>
          </div>
        </div>
      )}

      {/* WALL — cross-user feed of all published draws */}
      {phase === 'wall' && (
        <Wall
          entries={wall.entries}
          loaded={wall.loaded}
          todayKey={today}
          selfId={telegramId ? String(telegramId) : null}
          heartedIds={heartedIds}
          onHeart={handleHeart}
          onClose={() => setPhase(lockedToday ? 'done' : 'idle')}
          onOpenRoom={(cardId) => { setRoomCardId(cardId); setPhase('room'); }}
        />
      )}

      {/* ROOM — every published draw of one arcanum */}
      {phase === 'room' && roomCardId != null && (
        <Room
          cardId={roomCardId}
          entries={wall.entries}
          loaded={wall.loaded}
          todayKey={today}
          selfId={telegramId ? String(telegramId) : null}
          heartedIds={heartedIds}
          onHeart={handleHeart}
          onBack={() => setPhase(lockedToday ? 'done' : 'idle')}
        />
      )}

      {/* Watermark is decorative — hidden on the reveal/done screens
          because it competes for the same bottom band as the nav row
          and gets clipped on Aigram iOS where the iframe is shorter
          than full screen. */}
      {phase !== 'revealing' && phase !== 'done' && <Watermark />}
    </div>
  );
}
