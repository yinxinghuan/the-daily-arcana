import { useCallback, useState } from 'react';
import { useGenImage } from '@shared/runtime';
import type { ArcanaCard } from '../types';
import { toRoman } from '../utils/roman';

// Shared painted-tarot style. Locks every card into the same museum-tarot
// look: hand-painted gouache (NOT photoreal), limited palette so 22 cards
// feel like one deck.
//
// 1:1 CONTRACT — the illustration MUST be a full-bleed perfect square. The
// ornate gold border IS the outer edge of the square frame (touches all
// four sides); the painted scene fills the interior completely. There is
// NO aubergine margin / matte / letterbox around the card — that is what
// made portrait-panel renders show purple bars on the sides.
const STYLE = [
  'museum-quality painted tarot card illustration, Pamela Colman Smith × art-nouveau line work',
  'PERFECT SQUARE full-bleed composition: the ornate gold art-nouveau border with curling vine filigree runs flush along all four outer edges of the square frame, and the painted scene fills the entire square edge to edge',
  'absolutely NO background margin, NO matte, NO letterbox, NO empty aubergine bars around the artwork — the card art extends to every edge',
  'cream parchment ground inside the gold border, deep aubergine #1A0B1F and dark indigo used only as scene shadows and night sky, never as an outer frame',
  'limited palette: cream, dusty gold, dusty rose, muted teal, dark indigo, aubergine',
  'flat painted gouache style, soft brush strokes, slightly desaturated, NOT photorealistic, no glossy skin, no digital airbrush',
  'symmetrical balanced composition, single subject, no text or letters anywhere except a small roman numeral plaque at the bottom edge',
  'square 1:1 aspect ratio, the artwork fully fills the square frame',
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

