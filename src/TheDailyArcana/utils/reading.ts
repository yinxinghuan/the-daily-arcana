// Per-pull LLM reading. One shot, stateless — direct fetch to the platform
// game-chat endpoint (the useChat hook is conversation-shaped and we just
// need a completion). Runs in parallel with gen-image in handleDraw; if it
// fails or times out the caller falls back to the static reading on the
// card.
//
// The point of this exists at all: every player who drew The Empress used
// to see the same sentence (only {NAME} swapped). On the public Wall that
// turned the deck into 22 repeating captions. Now the reading is written
// for the person + the card at the moment of the pull.

const CHAT_URL = 'https://chat.aiwaves.tech/aigram/api/game-chat';
const TIMEOUT_MS = 12_000;
const MAX_CHARS = 280;

interface GenReadingOpts {
  cardName: string;          // English name e.g. 'The Empress'
  cardKeywords: string[];    // 3 keywords for the locale being rendered
  cardSubject: string;       // visual subject line — anchors imagery
  playerName: string | null; // null when off-platform → reading uses "you"/"你"
  locale: 'en' | 'zh';
}

const SYSTEM_EN = `You write nightly tarot readings for a one-pull-a-day game. Each reading is one player, one card, one night.

HARD rules:
- Output exactly 2 short sentences. Total under 240 characters.
- No preamble, no greeting, no "here is your reading", no closing line.
- Address the seeker by name exactly once if a name is given; otherwise use "you".
- Present tense, second person, plain modern English. No archaic tarot voice ("thou", "shall", "behold", "the universe"). No emojis. No markdown. No quotes around the output.

REGISTER (the part that matters):
- Each sentence must contain at least one concrete physical verb or noun the player could actually do or see — touch, pour, step, sit, the small thing on the table, the door, the wheat, the rope.
- BANNED framings (the model loves these and they kill the line): "surrounded by", "embrace", "energy flowing", "the universe is", "abundance is around you", "trust the journey", "open yourself to", "let X wash over you", any abstract noun + "is here for you".
- Don't restate the keywords as a list. Use them as the line's gravity, not its vocabulary.
- End on a small specific beat the player could do in the next minute, not a moral.

Examples of the right register:
- "Care for the small living thing in front of you today, Yin. It grows what you tend."
- "Pick a direction and go, Sam. Anything you do tonight moves faster than waiting."
- "Stop pushing today, Lee. The answer arrives the moment you let go of the rope."`;

const SYSTEM_ZH = `你为一个一日一抽的塔罗游戏写每夜短牌意。一个玩家，一张牌，一个夜晚。

硬性规则：
- 输出正好 2 句短。总字数不超过 120 字。
- 不要开场白，不要打招呼，不要"以下是你的牌意"，不要结尾总结。
- 如给了名字，对求问者称呼名字一次；没有就用"你"。
- 现在时，第二人称，现代口语化。不要"汝/吾/万物之灵/宇宙将/请怀着"这类通灵腔。不要 emoji，不要 markdown，不要给输出加引号。

语气（关键的部分）：
- 每一句至少包含一个具体的、玩家此刻真的能做的动作或能看见的画面——伸手、倒、走一步、坐下、桌上那件小东西、麦田、那根绳、那扇门。
- 禁用的套话（模型最爱写，但写了就废）："被丰盛/温柔/创造力包围"、"能量在流淌"、"宇宙正在/将给你"、"拥抱…"、"打开自己"、"让 X 涌入你"、抽象名词+"已经为你而来"。
- 不要把关键词当列表念出来。让关键词成为这句话的重心，不是它的词汇。
- 结尾停在玩家下一分钟真的能做的一个具体小动作上，不要落到大道理。

正确语气示范：
- "照料眼前这件小小的活物吧，殷。你养育什么，什么就生长。"
- "选一个方向出发，Sam。今夜任何动起来的事，都比等待跑得快。"
- "今天先停下推力，Lee。当你松开那根绳，答案就来了。"`;

function buildUserMsg(opts: GenReadingOpts): string {
  const { cardName, cardKeywords, cardSubject, playerName, locale } = opts;
  const nameLine = playerName
    ? (locale === 'zh' ? `求问者名字：${playerName}` : `Seeker name: ${playerName}`)
    : (locale === 'zh' ? `没有名字 — 用"你"` : 'No name given — use "you"');

  if (locale === 'zh') {
    return [
      `牌：${cardName}`,
      `关键词：${cardKeywords.join('、')}`,
      `画面：${cardSubject}`,
      nameLine,
      '为今夜写一句牌意。',
    ].join('\n');
  }
  return [
    `Card: ${cardName}`,
    `Keywords: ${cardKeywords.join(', ')}`,
    `Visual: ${cardSubject}`,
    nameLine,
    'Write tonight\'s reading.',
  ].join('\n');
}

function postProcess(raw: string, _opts: GenReadingOpts): string {
  let s = (raw || '').trim();
  // Strip wrapping quotes the model sometimes adds despite the rule.
  s = s.replace(/^['"“”‘’「『]+|['"“”‘’」』]+$/g, '').trim();
  // Drop any leading "Here is..." preamble — kept as a defensive net.
  s = s.replace(/^(here(?:'s| is)? (?:your )?(?:reading|tarot|card)[:：—\-,.]?\s*)/i, '').trim();
  // Hard cap.
  if (s.length > MAX_CHARS) s = s.slice(0, MAX_CHARS).trim();
  return s;
}

/**
 * Best-effort LLM reading. Returns a finished string or throws (caller
 * is expected to catch and fall back to the static `card.reading`). Never
 * blocks longer than TIMEOUT_MS.
 */
export async function generateReading(opts: GenReadingOpts): Promise<string> {
  const system = opts.locale === 'zh' ? SYSTEM_ZH : SYSTEM_EN;
  const userText = buildUserMsg(opts);

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`reading-gen HTTP ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? '';
    const cleaned = postProcess(raw, opts);
    if (!cleaned) throw new Error('reading-gen empty');
    return cleaned;
  } finally {
    clearTimeout(timeoutId);
  }
}
