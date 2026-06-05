import { useCallback, useState } from 'react';
import { useGenImage } from '@shared/runtime';
import type { ArcanaCard } from '../types';
import { toRoman } from '../utils/roman';

// Shared painted-tarot style. Locks every card into the same museum-tarot
// look: deep aubergine ground, cream parchment panel inside an ornate
// gold border, hand-painted gouache (NOT photoreal). Limited palette so
// 22 cards feel like one deck.
const STYLE = [
  'museum-quality painted tarot card illustration, Pamela Colman Smith × art-nouveau line work',
  'a cream parchment panel framed by a heavy ornate gold border with curling vine filigree',
  'background OUTSIDE the panel is deep aubergine #1A0B1F midnight blue',
  'limited palette inside the panel: cream, dusty gold, dusty rose, muted teal, dark indigo',
  'flat painted gouache style, soft brush strokes, slightly desaturated, NOT photorealistic, no glossy skin, no digital airbrush',
  'symmetrical balanced composition, single subject, no text or letters anywhere except a small roman numeral plaque at the bottom edge',
  'square format, the artwork fully fills the panel',
  'mysterious reverent mood, slight grain, hand-illustrated feel',
].join(', ');

interface GenerateOpts {
  card: ArcanaCard;
  /** Player avatar URL — used as img2img ref for figure cards. */
  avatarUrl?: string | null;
}

export interface ArcanaGenStage {
  stage: 'idle' | 'painting' | 'done' | 'error';
  imageUrl: string | null;
}

export function useArcanaGen() {
  const gen = useGenImage();
  const [stage, setStage] = useState<ArcanaGenStage['stage']>('idle');

  const generate = useCallback(async (opts: GenerateOpts): Promise<string> => {
    const { card, avatarUrl } = opts;
    setStage('painting');

    // Subject + style. For figure cards, name-drop the avatar reference
    // so the model anchors face/colors but renders in painted style.
    const figureBrief = card.hasFigure
      ? 'the central figure\'s face and complexion gently inspired by the reference image, but rendered in flat painted gouache style — NOT photoreal, not a portrait, not a selfie, not glossy. Face about 40% the height of the panel, framed by the composition described next.'
      : '';

    const prompt = [
      STYLE,
      `Tarot card "${card.name}" (Major Arcana ${card.id})`,
      figureBrief,
      `composition: ${card.subject}`,
      `small roman-numeral plaque at the bottom edge reading ${toRoman(card.id)}`,
    ].filter(Boolean).join('. ');

    try {
      const url = await gen.generate({
        prompt,
        ref_url: card.hasFigure && avatarUrl ? avatarUrl : undefined,
      });
      setStage('done');
      return url;
    } catch (e) {
      setStage('error');
      throw e;
    }
  }, [gen]);

  return {
    generate,
    stage,
    loading: gen.loading,
    error: gen.error,
    reset: () => setStage('idle'),
  };
}

