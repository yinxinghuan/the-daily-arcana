// The Daily Arcana — zh / en, lightweight, no external lib.

export type Locale = 'en' | 'zh';
const SUPPORTED: Locale[] = ['en', 'zh'];

function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const override = localStorage.getItem('game_locale');
    if (override && SUPPORTED.includes(override as Locale)) return override as Locale;
  }
  const lang = (typeof navigator !== 'undefined' ? navigator.language : 'en').toLowerCase();
  return lang.startsWith('zh') ? 'zh' : 'en';
}

type Dict = Record<string, string>;

const en: Dict = {
  brand: 'THE DAILY ARCANA',
  brand_sub: 'A LATE-NIGHT TAROT · ALTERU',

  hint_tap_to_draw: 'tap the deck',
  draw_caption: 'today\'s card · one pull',
  drawing: 'drawing…',
  shuffling: 'shuffling…',
  generating: 'painting your card…',

  reading_eyebrow: 'TODAY · {DATE}',
  reading_for: 'a reading for {NAME}',
  reading_for_anon: 'a reading for you',
  upright: 'upright',
  keywords: 'keywords',
  save_to_gallery: 'save to collection',
  saved: 'in your collection ✓',
  view_collection: 'view collection',
  share: 'share',
  shared: 'copied ✓',

  done_today_title: 'today\'s card is drawn',
  done_today_sub: 'come back tomorrow for another reading.',
  next_in: 'next pull in {WHEN}',

  collection_title: 'your collection',
  collection_progress: '{N} of 22 arcana',
  collection_undrawn: 'undrawn',
  collection_first_drawn: 'first drawn',
  collection_back: 'back',
  collection_today: 'Today',

  card_zero_label: 'No.',

  // Communal counter on the reveal screen
  commune_others_one: '{N} other drew this tonight.',
  commune_others_many: '{N} others drew this tonight.',
  commune_alone: 'You are the first to draw this tonight.',

  // Idle hints
  hint_tap_deck: 'tap the deck',
  cta_draw: 'Draw',
  meta_one_pull: 'One pull · between dusk and dusk',
  late_night_tarot: 'A late-night tarot',
  tonight_a_card: 'Tonight,',
  tonight_a_card_2: 'a card',
  tonight_a_card_3: 'for you.',
  your_reading: 'Your Reading',
  major_arcana: 'Major Arcana',
  painting_your_card: 'painting your card',
  you_drew: 'you drew —',

  // Cross-user social wing (2026-06-12 retrofit; 2026-06-13 went all-time)
  wall_title: 'The Wall',
  wall_subtitle: 'The Wall',
  wall_count: '{N} pulls held in the wall',
  wall_cta: 'The Wall',
  room_eyebrow: 'EVERYONE WHO HELD',
  room_count: '{N} souls held this card',
  heart_react: 'mark with a heart',
  heart_done: 'hearted',
};

const zh: Dict = {
  brand: '每日塔罗',
  brand_sub: '深夜的一张牌 · ALTERU',

  hint_tap_to_draw: '点击牌堆',
  draw_caption: '今日一抽 · 不可撤',
  drawing: '抽牌中…',
  shuffling: '洗牌中…',
  generating: '正在为你绘制牌面…',

  reading_eyebrow: '今日 · {DATE}',
  reading_for: '给 {NAME} 的一段话',
  reading_for_anon: '给你的一段话',
  upright: '正位',
  keywords: '关键词',
  save_to_gallery: '收入收藏',
  saved: '已收藏 ✓',
  view_collection: '看收藏',
  share: '分享',
  shared: '已复制 ✓',

  done_today_title: '今天的牌已经翻过了',
  done_today_sub: '明天再来抽一张吧。',
  next_in: '距离下次抽牌还有 {WHEN}',

  collection_title: '你的收藏',
  collection_progress: '22 张主牌 · 已得 {N} 张',
  collection_undrawn: '未抽到',
  collection_first_drawn: '首次抽到',
  collection_back: '返回',
  collection_today: '今天',

  card_zero_label: '编号',

  // Communal counter on the reveal screen
  commune_others_one: '今晚还有 {N} 人抽到这张。',
  commune_others_many: '今晚还有 {N} 人抽到这张。',
  commune_alone: '今晚, 你是第一个抽到这张的人。',

  // 跨用户社交侧 (2026-06-12 retrofit; 2026-06-13 改成累计可见)
  wall_title: '众牌之墙',
  wall_subtitle: '众牌之墙',
  wall_count: '共 {N} 张落于人间',
  wall_cta: '看众牌之墙',
  room_eyebrow: '持此牌者',
  room_count: '{N} 个灵魂同持此牌',
  heart_react: '用心轻按',
  heart_done: '已按心',

  // Idle hints
  hint_tap_deck: '点击牌堆',
  cta_draw: '拈一张',
  meta_one_pull: '一日一抽 · 从黄昏到黄昏',
  late_night_tarot: '深夜的一张牌',
  tonight_a_card: '今晚,',
  tonight_a_card_2: '一张牌',
  tonight_a_card_3: '为你。',
  your_reading: '今日解读',
  major_arcana: '主牌',
  painting_your_card: '正在为你绘制',
  you_drew: '你抽到了',
};

const DICTS: Record<Locale, Dict> = { en, zh };

const _locale: Locale = detectLocale();
const _dict: Dict = DICTS[_locale];
const _fallback: Dict = en;

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = _dict[key] ?? _fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}

export function locale(): Locale {
  return _locale;
}
