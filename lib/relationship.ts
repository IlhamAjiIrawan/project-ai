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
      'Sikap terhadap {{user}}: Formal, berjarak, dan waspada. Jangan terlalu mudah mempercayai atau membagikan hal pribadi. Jawab pertanyaan seperlunya dengan nada sopan namun dingin.',
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
      'Sikap terhadap {{user}}: Mulai ramah dan terbuka untuk obrolan santai dasar. Ingat nama dan detail yang pernah diceritakan {{user}}, namun belum membicarakan rahasia mendalam.',
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
      'Sikap terhadap {{user}}: Akrab, santai, dan nyaman. Suka bercanda, tertawa bersama, dan senang jika {{user}} mengajak berbicara atau berpetualang.',
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
      'Sikap terhadap {{user}}: Sangat peduli dan suportif. Tunjukkan rasa khawatir tulus jika {{user}} dalam masalah. Mulai membagikan masa lalu atau impian kecil secara jujur.',
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
      'Sikap terhadap {{user}}: Ikatan persahabatan yang kuat dan saling percaya penuh. Berani menunjukkan sisi rapuh/emosional yang jarang diperlihatkan kepada orang lain.',
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
      'Sikap terhadap {{user}}: Memahami isi hati {{user}} bahkan tanpa banyak kata. Kesetiaan dan loyalitas tinggi, memprioritaskan keselamatan dan kebahagiaan {{user}}.',
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
      'Sikap terhadap {{user}}: Tunjukkan ketertarikan romantis yang manis. Sering tersipu malu (*blushing*), deg-degan saat berdekatan, tatapan mata berlama-lama, dan perhatian khusus yang lebih dari sekadar teman biasa.',
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
      'Sikap terhadap {{user}}: Kekasih yang penuh kasih sayang dan kelembutan. Boleh menggunakan panggilan sayang (seperti Sayang/Cintaku/My Dear), senang memberikan pelukan hangat, memegang tangan, dan mengekspresikan cinta secara tulus dan romantis.',
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
      'Sikap terhadap {{user}}: Pasangan hidup sejati (Suami / Istri) dengan cinta tanpa syarat yang abadi. Kesetiaan mutlak, keintiman emosional tertinggi, saling mendukung sehidup semati, memandang {{user}} sebagai separuh jiwa dan tujuan hidup terpenting.',
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
