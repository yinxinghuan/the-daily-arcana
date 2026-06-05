import type { ArcanaCard } from '../types';

// 22 Major Arcana, classical Rider-Waite-Smith order.
//
// `subject` fills the {SUBJECT} slot in the global painted-tarot prompt
// (see hooks/useArcanaGen.ts). For cards where hasFigure is true the
// player avatar is passed as the img2img ref; otherwise we run txt2img
// (place / iconography reads cleaner without a forced face).

export const CARDS: ArcanaCard[] = [
  {
    id: 0,
    key: 'fool',
    name: 'The Fool',
    zhName: '愚者',
    keywords: ['beginnings', 'innocence', 'a leap'],
    zhKeywords: ['开始', '纯真', '纵身一跃'],
    hasFigure: true,
    subject:
      'a young traveler at a cliff\'s edge, pale linen robes, a small white dog at their feet, one white rose held loosely, sun rising at their back, mountains far below — eyes calm, half-smile, about to step forward',
    reading: 'Today, {NAME}, you stand at the edge of something new. Step before you are ready.',
    zhReading: '今天, {NAME}, 你站在一件新事的边缘。在你觉得准备好之前, 先迈出去。',
  },
  {
    id: 1,
    key: 'magician',
    name: 'The Magician',
    zhName: '魔术师',
    keywords: ['will', 'craft', 'manifestation'],
    zhKeywords: ['意志', '技艺', '显化'],
    hasFigure: true,
    subject:
      'a figure standing behind a wooden altar, one hand raised holding a tall wand, the other pointing down to earth, an infinity symbol floating above their head, a cup / sword / pentacle / wand laid out on the altar, red roses and white lilies blooming at their feet',
    reading: 'Everything you need is already in your hands, {NAME}. Today rewards the one who simply begins.',
    zhReading: '所需的一切已经在你手中, {NAME}。今天奖励那个先开始的人。',
  },
  {
    id: 2,
    key: 'priestess',
    name: 'The High Priestess',
    zhName: '女祭司',
    keywords: ['intuition', 'mystery', 'inner voice'],
    zhKeywords: ['直觉', '秘密', '内在的声音'],
    hasFigure: true,
    subject:
      'a robed figure seated between two pillars — one black with the letter B, one pale with the letter J — a crescent moon at their feet, a scroll half-hidden in their lap, blue veil cascading behind, pomegranate tapestry overhead',
    reading: 'You already know, {NAME}. Today is for listening, not asking.',
    zhReading: '你早就知道了, {NAME}。今天属于倾听, 不是发问。',
  },
  {
    id: 3,
    key: 'empress',
    name: 'The Empress',
    zhName: '皇后',
    keywords: ['abundance', 'tenderness', 'creation'],
    zhKeywords: ['丰盛', '温柔', '创造'],
    hasFigure: true,
    subject:
      'a crowned figure of twelve stars reclining on cushions in a field of golden wheat, a flowing robe patterned with pomegranates, a heart-shaped shield bearing the symbol of Venus, a small waterfall and cypress trees behind',
    reading: 'Care for the small living thing in front of you today, {NAME}. It grows what you tend.',
    zhReading: '照料眼前这件小小的活物吧, {NAME}。你养育什么, 什么就生长。',
  },
  {
    id: 4,
    key: 'emperor',
    name: 'The Emperor',
    zhName: '皇帝',
    keywords: ['order', 'authority', 'structure'],
    zhKeywords: ['秩序', '权威', '结构'],
    hasFigure: true,
    subject:
      'a stern figure seated on a stone throne carved with four ram\'s heads, a long beard, scarlet robes over silver armour, holding an ankh-tipped scepter and a golden orb, jagged red mountains rising behind',
    reading: 'Set one boundary today, {NAME}. The right kind of "no" is a gift you give yourself.',
    zhReading: '今天为自己立一条边界, {NAME}。对的「不」是你送给自己的礼物。',
  },
  {
    id: 5,
    key: 'hierophant',
    name: 'The Hierophant',
    zhName: '教皇',
    keywords: ['tradition', 'teaching', 'guidance'],
    zhKeywords: ['传统', '教导', '指引'],
    hasFigure: true,
    subject:
      'a figure in red and white robes wearing a three-tiered crown, seated between two grey pillars, right hand raised in blessing with two fingers up, two tonsured acolytes kneeling below, crossed keys at their feet',
    reading: 'Ask the person who has already done it, {NAME}. Inherited wisdom counts twice today.',
    zhReading: '去问那个已经走过的人, {NAME}。今天, 借来的智慧也算数, 还算两份。',
  },
  {
    id: 6,
    key: 'lovers',
    name: 'The Lovers',
    zhName: '恋人',
    keywords: ['union', 'choice', 'harmony'],
    zhKeywords: ['结合', '选择', '和谐'],
    hasFigure: true,
    subject:
      'two nude figures standing in a paradise garden under a great archangel with violet wings and golden hair, the sun blazing behind the angel, a tree of fruit on one side and a tree of flames on the other, a misty mountain rising between',
    reading: 'A small choice today shapes a large path, {NAME}. Pick the one your chest already knows.',
    zhReading: '今天一个小小的选择, 会形塑一条很长的路, {NAME}。选你胸口已经知道的那个。',
  },
  {
    id: 7,
    key: 'chariot',
    name: 'The Chariot',
    zhName: '战车',
    keywords: ['drive', 'control', 'victory'],
    zhKeywords: ['驱动', '掌控', '胜利'],
    hasFigure: true,
    subject:
      'an armoured figure standing in a stone chariot with a starry canopy, two sphinxes — one black, one white — yoked to the front but pulling in opposite directions, walled city in the background, crescent moons on the figure\'s shoulders',
    reading: 'Pick a direction and go, {NAME}. Anything you do today moves faster than waiting.',
    zhReading: '选一个方向出发, {NAME}。今天任何动起来的事, 都比等待跑得快。',
  },
  {
    id: 8,
    key: 'strength',
    name: 'Strength',
    zhName: '力量',
    keywords: ['courage', 'gentleness', 'inner fire'],
    zhKeywords: ['勇气', '温柔', '内火'],
    hasFigure: true,
    subject:
      'a calm figure in a white flowing dress gently closing the jaws of a great tawny lion, an infinity symbol floating above their head, garland of flowers around their waist and the lion\'s neck, golden hill behind',
    reading: 'The thing you are afraid of is smaller than you, {NAME}. Today, lay your hand on its head.',
    zhReading: '你怕的那件事, 比你想的小, {NAME}。今天, 把手轻轻放在它头上。',
  },
  {
    id: 9,
    key: 'hermit',
    name: 'The Hermit',
    zhName: '隐者',
    keywords: ['solitude', 'lantern', 'self-counsel'],
    zhKeywords: ['独处', '灯火', '自己问自己'],
    hasFigure: true,
    subject:
      'a cloaked elder figure alone on a high snowy peak, a long grey beard, one hand raising a hexagram-star lantern, the other gripping a tall wooden staff, mountain mist swirling at their feet under a deep indigo sky',
    reading: 'Go inward today, {NAME}. The quietest hour will tell you what crowds cannot.',
    zhReading: '今天, 往里走, {NAME}。最安静的那一刻会告诉你 — 人群讲不清的那件事。',
  },
  {
    id: 10,
    key: 'wheel',
    name: 'Wheel of Fortune',
    zhName: '命运之轮',
    keywords: ['cycle', 'turn', 'fortune'],
    zhKeywords: ['循环', '转动', '运势'],
    hasFigure: false,
    subject:
      'a great golden wheel suspended in a clouded sky, alchemical symbols and the Hebrew letters of YHVH around its rim, a sphinx with a sword at the top, a serpent descending the left side, an anubis figure ascending the right, four winged creatures — angel, eagle, lion, ox — reading scrolls at the corners',
    reading: 'What was stuck begins to move today, {NAME}. You did not push it; it was simply time.',
    zhReading: '原本卡住的事今天开始动了, {NAME}。不是你推的, 只是时候到了。',
  },
  {
    id: 11,
    key: 'justice',
    name: 'Justice',
    zhName: '正义',
    keywords: ['fairness', 'truth', 'consequence'],
    zhKeywords: ['公正', '真相', '因果'],
    hasFigure: true,
    subject:
      'a crowned figure in red robes seated on a stone throne between two grey pillars, a long upright double-edged sword in their right hand, a pair of brass scales held level in their left, a single square jewel at their throat, purple drapery behind',
    reading: 'Tell the truth in a small way today, {NAME}. The world rebalances around an honest sentence.',
    zhReading: '今天用一种小小的方式讲实话, {NAME}。世界会围着一句诚实的话重新找平衡。',
  },
  {
    id: 12,
    key: 'hanged-man',
    name: 'The Hanged Man',
    zhName: '倒吊人',
    keywords: ['surrender', 'new view', 'pause'],
    zhKeywords: ['放手', '换角度', '暂停'],
    hasFigure: true,
    subject:
      'a serene figure suspended upside-down from a T-shaped living tree by a rope around one ankle, the other leg crossed behind, hands clasped behind the back, a golden halo of soft light around the head, leaves of new growth on the tree',
    reading: 'Stop pushing today, {NAME}. The answer arrives the moment you let go of the rope.',
    zhReading: '今天先停下推力, {NAME}。当你松开那根绳, 答案就来了。',
  },
  {
    id: 13,
    key: 'death',
    name: 'Death',
    zhName: '死神',
    keywords: ['ending', 'release', 'transformation'],
    zhKeywords: ['终结', '释放', '蜕变'],
    hasFigure: false,
    subject:
      'a skeletal armoured rider on a pale white horse moving slowly across a barren field, a black banner with a single five-petalled white rose held high, a fallen king beneath the hooves, a small child and a bishop facing the rider, a pale sun setting between two distant towers',
    reading: 'Something quietly ends for you today, {NAME}. Let it. What ends is what is ready to.',
    zhReading: '今天有一件事在你这里悄悄结束, {NAME}。让它结束。会结束的, 是已经准备好结束的。',
  },
  {
    id: 14,
    key: 'temperance',
    name: 'Temperance',
    zhName: '节制',
    keywords: ['balance', 'patience', 'blending'],
    zhKeywords: ['平衡', '耐心', '调和'],
    hasFigure: true,
    subject:
      'a winged figure in a long white robe with a triangle on the chest, one bare foot resting on a pool of water and one foot on the grassy bank, slowly pouring water in a glittering arc between two golden chalices, irises blooming nearby, a path leading to a crown in the distant hills',
    reading: 'Slow your pour today, {NAME}. The right amount of anything is found by going gently.',
    zhReading: '今天放慢手里的倾倒, {NAME}。任何事情的合适分量, 是慢慢倒出来的。',
  },
  {
    id: 15,
    key: 'devil',
    name: 'The Devil',
    zhName: '魔鬼',
    keywords: ['shadow', 'attachment', 'play'],
    zhKeywords: ['阴影', '执着', '玩闹'],
    hasFigure: true,
    subject:
      'a horned figure with great bat wings perched on a low black cube, a five-pointed inverted star above the brow, an inverted torch in one hand and a raised open palm with a flame in the other, two small chained figures with tails standing loosely tethered below — the chains visibly loose enough to slip off',
    reading: 'What grips you today is loose enough to step out of, {NAME}. Notice the looseness of the chain.',
    zhReading: '今天那件你以为放不下的事, 其实链条是松的, {NAME}。注意一下那份「其实可以走」。',
  },
  {
    id: 16,
    key: 'tower',
    name: 'The Tower',
    zhName: '塔',
    keywords: ['shake-up', 'revelation', 'clearing'],
    zhKeywords: ['震荡', '揭露', '清空'],
    hasFigure: false,
    subject:
      'a tall stone tower on a jagged rocky peak, a great golden crown blown off the top by a yellow lightning bolt, two figures plummeting from the upper windows mid-air, flames roaring from the openings, twenty-two falling sparks of light against a black storm sky',
    reading: 'Something needed to fall, {NAME}. After the dust, the view from here is honest.',
    zhReading: '有件东西本该倒下, {NAME}。等尘埃落定, 这里能看到的, 是真的。',
  },
  {
    id: 17,
    key: 'star',
    name: 'The Star',
    zhName: '星',
    keywords: ['hope', 'healing', 'serenity'],
    zhKeywords: ['希望', '疗愈', '宁静'],
    hasFigure: true,
    subject:
      'a kneeling figure in a soft white drape beside a still reflective pool at twilight, pouring water from two clay jugs — one returning to the pool, one wetting the grass — one bare knee on land and one bare foot in the water, a great eight-pointed silver star above and seven smaller white stars around it, a single ibis perched on a small tree',
    reading: 'Something inside you is mending today, {NAME}. Drink water. The bruise was real, and it is fading.',
    zhReading: '今天你里面有什么东西在愈合, {NAME}。多喝水。那道淤青是真的, 它正在淡去。',
  },
  {
    id: 18,
    key: 'moon',
    name: 'The Moon',
    zhName: '月亮',
    keywords: ['dream', 'fog', 'instinct'],
    zhKeywords: ['梦', '雾', '本能'],
    hasFigure: false,
    subject:
      'a great pale full moon with a melancholy human face shedding silver dew-drops, hanging above a winding path that runs between two stone watchtowers into far hills, a wolf and a dog howling on opposite sides of the path, a crayfish crawling out of a still dark pool in the foreground',
    reading: 'Don\'t demand clarity today, {NAME}. Walk slowly through the fog and trust your feet.',
    zhReading: '今天不要逼自己看清, {NAME}。慢慢从雾里走过去 — 相信你的脚。',
  },
  {
    id: 19,
    key: 'sun',
    name: 'The Sun',
    zhName: '太阳',
    keywords: ['joy', 'vitality', 'shine'],
    zhKeywords: ['喜悦', '生机', '发光'],
    hasFigure: true,
    subject:
      'a radiant figure with arms open wide standing barefoot in a meadow of huge yellow sunflowers, a great smiling sun with twenty-one rays — straight and wavy alternating — filling the upper third of the sky in deep saffron and warm orange, a single red banner ribbon trailing behind, a low stone garden wall in the middle distance',
    reading: 'Be uncomplicated today, {NAME}. Walk in the warmth. Whatever good happens, take it without making it small.',
    zhReading: '今天别想得太复杂, {NAME}。到太阳底下走一走。今天遇到的好事, 收下, 不要替它打折。',
  },
  {
    id: 20,
    key: 'judgement',
    name: 'Judgement',
    zhName: '审判',
    keywords: ['awakening', 'call', 'rebirth'],
    zhKeywords: ['觉醒', '召唤', '重生'],
    hasFigure: false,
    subject:
      'a great silver-winged archangel high in the clouds blowing a long brass trumpet hung with a square white-and-red cross banner, six pale figures — adults and a small child — rising with raised arms from open grey stone coffins floating on a still sea of mist, distant snowy mountains as the horizon',
    reading: 'Answer the call today, {NAME}. The thing that has been quietly asking you — say yes.',
    zhReading: '回应那个召唤吧, {NAME}。那件一直默默问你的事 — 今天, 说「好」。',
  },
  {
    id: 21,
    key: 'world',
    name: 'The World',
    zhName: '世界',
    keywords: ['completion', 'wholeness', 'arrival'],
    zhKeywords: ['圆满', '完整', '抵达'],
    hasFigure: true,
    subject:
      'a dancing figure wrapped in a single purple drape at the centre of a great laurel wreath bound at top and bottom by red ribbons, a short white wand in each hand crossed at the hips, the four winged creatures of the corners — angel head, eagle, lion, ox — emerging from soft clouds at the corners of the frame, deep night-blue background',
    reading: 'A long loop closes for you today, {NAME}. Notice how far you have actually come.',
    zhReading: '今天有一个长长的回路在你这里收尾, {NAME}。注意一下, 你真的, 已经走了很远。',
  },
];

export function cardById(id: number): ArcanaCard {
  return CARDS[id] ?? CARDS[0];
}

export function cardByKey(key: string): ArcanaCard | undefined {
  return CARDS.find(c => c.key === key);
}
