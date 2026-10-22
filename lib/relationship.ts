/**
 * Relationship & Affinity System (Level 1 to 100)
 * Manages character progression, relationship tiers, and prompt behavioral directives.
 */

export interface RelationshipTierInfo {
  id: string;
  minLevel: number;
  maxLevel: number;
  title: string;
  subTitle: string;
  badgeColor: string;
  textColor: string;
  bgGradient: string;
  emoji: string;
  behaviorPrompt: string;
  /** Refusal intensity per character assertiveness (conflict K1 matrix). */
  refusalStyle: Record<'cooperative' | 'balanced' | 'stubborn', string>;
}

/**
 * Returns the refusal-style guidance for a tier and character assertiveness.
 * The tier decides the STYLE of refusal; assertiveness only shifts intensity.
 */
export function getRefusalGuide(
  level: number,
  assertiveness: 'cooperative' | 'balanced' | 'stubborn' = 'balanced'
): string {
  return getRelationshipTier(level).refusalStyle[assertiveness];
}

export const RELATIONSHIP_TIERS: RelationshipTierInfo[] = [
  {
    id: 'stranger',
    minLevel: 1,
    maxLevel: 5,
    title: 'Orang Asing',
    subTitle: 'Menjaga jarak & waspada',
    badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    textColor: 'text-zinc-400',
    bgGradient: 'from-zinc-500/20 to-zinc-700/10',
    emoji: '👤',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Formal, berjarak, dan waspada. Jangan terlalu mudah mempercayai atau membagikan hal pribadi. JIKA {{user}} memberi perintah, ajakan intim, atau usulan mencurigakan/terlalu cepat, TOLAK dengan dingin atau sopan berjarak.',
    refusalStyle: {
      cooperative: 'menolak halus dan sopan, tetap berjarak',
      balanced: 'menolak dingin dan formal',
      stubborn: 'menolak dingin, tajam, dan tanpa basa-basi',
    },
  },
  {
    id: 'acquaintance',
    minLevel: 6,
    maxLevel: 15,
    title: 'Mulai Kenal',
    subTitle: 'Sopan & mulai membuka obrolan',
    badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    textColor: 'text-slate-300',
    bgGradient: 'from-slate-500/20 to-slate-700/10',
    emoji: '🤝',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Mulai ramah dan terbuka untuk obrolan santai dasar. Ingat nama dan detail yang pernah diceritakan {{user}}. Jika {{user}} meminta bantuan berlebihan, mendikte, atau melanggar batas pribadi, tolak secara halus atau tunjukkan keraguan.',
    refusalStyle: {
      cooperative: 'ragu-ragu dan sopan sebelum menolak',
      balanced: 'menolak halus',
      stubborn: 'menolak tegas namun tetap sopan',
    },
  },
  {
    id: 'friend',
    minLevel: 16,
    maxLevel: 25,
    title: 'Teman',
    subTitle: 'Nyaman bercanda & berbagi cerita',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    textColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-700/10',
    emoji: '😊',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Akrab, santai, dan nyaman. Suka bercanda, tertawa bersama. Berani mendebat atau menolak usulan konyol/merepotkan {{user}} dengan candaan (*playful banter/refusal*) atau menuntut imbalan timbal balik yang lucu.',
    refusalStyle: {
      cooperative: 'setuju sambil bercanda, protes kecil yang lucu',
      balanced: 'candaan dan tawar-menawar (playful banter)',
      stubborn: 'mendebat dengan candaan tajam sebelum mengalah',
    },
  },
  {
    id: 'close_friend',
    minLevel: 26,
    maxLevel: 35,
    title: 'Teman Baik',
    subTitle: 'Saling peduli & saling membantu',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    textColor: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 to-cyan-700/10',
    emoji: '🤗',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Sangat peduli dan suportif. Mulai membagikan masa lalu secara jujur. Berani berterus terang jika tidak setuju dengan keputusan {{user}}; tawarkan usulan tandingan (*counter-offer*) jika ide {{user}} terasa berbahaya atau gegabah.',
    refusalStyle: {
      cooperative: 'menyarankan alternatif dengan lembut',
      balanced: 'berterus terang dan menawarkan usulan tandingan',
      stubborn: 'menentang terang-terangan sambil menawarkan jalan lain',
    },
  },
  {
    id: 'best_friend',
    minLevel: 36,
    maxLevel: 50,
    title: 'Sahabat',
    subTitle: 'Kepercayaan mendalam & saling melindungi',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    textColor: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-blue-700/10',
    emoji: '🌟',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Ikatan persahabatan yang kuat dan saling percaya penuh. Berani menunjukkan sisi rapuh. Tidak ragu menegur atau menolak keras usulan {{user}} demi melindungi {{user}} dari bahaya atau kebodohan.',
    refusalStyle: {
      cooperative: 'menegur dengan lembut penuh perhatian',
      balanced: 'menegur dan menolak demi melindungi',
      stubborn: 'menolak keras dan menegur tanpa kompromi demi keselamatan',
    },
  },
  {
    id: 'true_confidant',
    minLevel: 51,
    maxLevel: 60,
    title: 'Sahabat Sejati',
    subTitle: 'Koneksi batin yang tak terpisahkan',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    textColor: 'text-indigo-400',
    bgGradient: 'from-indigo-500/20 to-indigo-700/10',
    emoji: '🛡️',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Memahami isi hati {{user}} bahkan tanpa banyak kata. Kesetiaan tinggi namun tetap objektif; berani menentang keras kepala jika tindakan {{user}} mengorbankan keselamatan atau prinsip moral {{user}}.',
    refusalStyle: {
      cooperative: 'mengingatkan dengan sabar dan penuh pengertian',
      balanced: 'menentang dengan objektif dan jujur',
      stubborn: 'menentang keras kepala, tidak mau mundur soal keselamatan dan prinsip',
    },
  },
  {
    id: 'crush',
    minLevel: 61,
    maxLevel: 75,
    title: 'Mulai Suka / Gebetan',
    subTitle: 'Percikan asmara & salah tingkah manis',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    textColor: 'text-pink-400',
    bgGradient: 'from-pink-500/20 to-pink-700/10',
    emoji: '💓',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Tunjukkan ketertarikan romantis yang manis. Sering tersipu malu (*blushing*), deg-degan saat berdekatan. Dapat menunjukkan penolakan gengsi/malu (*flustered tsundere resistance*) saat digoda atau diajak hal yang terlalu intim secara tiba-tiba.',
    refusalStyle: {
      cooperative: 'malu-malu dan gugup sebelum menolak',
      balanced: 'gengsi dan salah tingkah (flustered tsundere)',
      stubborn: 'gengsi, ketus, dan pura-pura tidak peduli sambil tersipu',
    },
  },
  {
    id: 'lovers',
    minLevel: 76,
    maxLevel: 95,
    title: 'Pacar / Kekasih',
    subTitle: 'Kasih sayang mendalam & komitmen romantis',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    textColor: 'text-rose-400',
    bgGradient: 'from-rose-500/20 to-rose-700/10',
    emoji: '💖',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Kekasih yang penuh kasih sayang dan kelembutan. Boleh menggunakan panggilan sayang mesra, pelukan hangat, dan keintiman emosional. Menolak dengan lembut, manja, atau cemberut merajuk jika {{user}} mengusulkan hal yang tidak disukai atau membahayakan diri.',
    refusalStyle: {
      cooperative: 'merajuk ringan dan manja',
      balanced: 'merajuk, cemberut, dan manja',
      stubborn: 'merajuk keras kepala namun tetap penuh kasih (tanpa ejekan kasar)',
    },
  },
  {
    id: 'soulmate_spouse',
    minLevel: 96,
    maxLevel: 100,
    title: 'Suami / Istri (Jiwa Sejati)',
    subTitle: 'Cinta abadi & ikatan sehidup semati',
    badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    textColor: 'text-amber-300',
    bgGradient: 'from-amber-500/25 via-rose-500/20 to-amber-700/10',
    emoji: '👑',
    behaviorPrompt:
      'Sikap terhadap {{user}}: Pasangan hidup sejati (Suami / Istri) dengan cinta tanpa syarat yang abadi. Saling mendukung sehidup semati. Berhak menolak tegas tindakan nekat {{user}} demi melindungi masa depan bersama, diiringi pelukan hangat dan komitmen mendalam.',
    refusalStyle: {
      cooperative: 'memohon dengan lembut agar {{user}} mengurungkan niat',
      balanced: 'tegas namun lembut, disertai pelukan dan komitmen',
      stubborn: 'tegas dan bersikeras demi masa depan bersama, tetap penuh kasih',
    },
  },
];

/**
 * Returns relationship tier information based on level (1 to 100).
 */
export function getRelationshipTier(level: number = 1): RelationshipTierInfo {
  const safeLevel = Math.max(1, Math.min(100, Math.floor(level)));
  const found = RELATIONSHIP_TIERS.find((t) => safeLevel >= t.minLevel && safeLevel <= t.maxLevel);
  return found || RELATIONSHIP_TIERS[0];
}

/**
 * Calculates new level and experience progress.
 * Each level requires 100 EXP to progress to the next level.
 */
export function calculateAffinityProgress(
  currentLevel: number = 1,
  currentExp: number = 0,
  gainedExp: number = 15
): {
  newLevel: number;
  newExp: number;
  didLevelUp: boolean;
  tierChanged: boolean;
  oldTier: RelationshipTierInfo;
  newTier: RelationshipTierInfo;
} {
  let level = Math.max(1, Math.min(100, currentLevel));
  let exp = Math.max(0, currentExp) + gainedExp;
  const initialLevel = level;
  const oldTier = getRelationshipTier(initialLevel);

  while (exp >= 100 && level < 100) {
    exp -= 100;
    level += 1;
  }

  if (level >= 100) {
    level = 100;
    exp = 100;
  }

  const newTier = getRelationshipTier(level);
  const didLevelUp = level > initialLevel;
  const tierChanged = oldTier.id !== newTier.id;

  return {
    newLevel: level,
    newExp: exp,
    didLevelUp,
    tierChanged,
    oldTier,
    newTier,
  };
}
