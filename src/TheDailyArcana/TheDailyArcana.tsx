import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { useGameEvent, useGameStats } from '@shared/runtime';
import DeckBack from './components/DeckBack';
import CardFace from './components/CardFace';
import Collection from './components/Collection';
import Watermark from './components/Watermark';
import { useArcanaGen } from './hooks/useArcanaGen';
import { useSelfProfile } from './hooks/useSelfProfile';
import { CARDS, cardById } from './data/cards';
import { todayKey, formatDate } from './utils/day';
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
import type { ArcanaSave, Phase, Draw } from './types';
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
  const [hasFirstTouched, setHasFirstTouched] = useState(false);
  const [shareLabel, setShareLabel] = useState('');

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

      // Persist + flip daily lock.
      const draw: Draw = { date: today, cardId, imageUrl: url };
      const nextSave: ArcanaSave = {
        lastDrawDay: today,
        history: [draw, ...(mirror?.history ?? [])],
      };
      setMirror(nextSave);
      persist(nextSave);

      setTimeout(() => setPhase('done'), 1800);
    } catch {
      setActiveCard(null);
      setPhase('idle');
    }
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
        <div className="da-topbar__r">{todayDateLine}</div>
      </div>
      <div className="da-toprule" />

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="da-page">
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
            <div className="da-idle__foot-l">{t('hint_tap_deck')}</div>
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

      {/* DRAWING / GENERATING */}
      {(phase === 'drawing' || phase === 'generating') && card && (
        <div className="da-page">
          <div className="da-gen__intro">
            <div className="da-gen__intro-l">{t('you_drew')}</div>
            <div className="da-gen__intro-title">
              {isZh ? card.zhName : card.name}
            </div>
            <div className="da-gen__intro-roman">
              {toRoman(card.id)} · {t('major_arcana')}
            </div>
          </div>
          <div className="da-gen__centre">
            <CardFace
              card={card}
              imageUrl={null}
              loading={phase === 'generating'}
            />
          </div>
          <div className="da-gen__foot">
            <em>{t('painting_your_card')}</em>
            <div className="da-loader"><span /><span /><span /></div>
          </div>
        </div>
      )}

      {/* REVEAL / DONE */}
      {(phase === 'revealing' || phase === 'done') && card && (
        <div className="da-page">
          <div className="da-reveal__topmeta">
            <div>{t('your_reading')}</div>
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
          {/* Communal counter — "X others drew this tonight" */}
          {communeStats.stats.day_user_count > 1 ? (
            <div className="da-reveal__commune">
              {t(
                communeStats.stats.day_user_count - 1 === 1
                  ? 'commune_others_one'
                  : 'commune_others_many',
                { N: communeStats.stats.day_user_count - 1 },
              )}
            </div>
          ) : phase === 'done' && communeStats.stats.day_user_count === 1 ? (
            <div className="da-reveal__commune">{t('commune_alone')}</div>
          ) : null}
          <p className="da-reveal__text">{personalizedReading}</p>
          <div className="da-reveal__nav">
            <button
              className="da-link-nav"
              onPointerDown={() => setPhase('collection')}
            >
              <span className="arr">←</span>{isZh ? '收藏' : 'Deck'}
            </button>
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

      <Watermark />
    </div>
  );
}
