export interface MoodBadgeInfo {
  label: string;
  emoji: string;
  badgeClass: string;
  textColor: string;
  dotColor: string;
}

/**
 * Maps mood keywords (in Indonesian or English) to a curated aesthetic visual badge.
 */
export function getMoodBadgeInfo(rawMood: string): MoodBadgeInfo {
  const normalized = rawMood.toLowerCase().trim();

  // 1. Romantic / Blushing / Flirty
  if (
    normalized.includes('tersipu') ||
    normalized.includes('malu') ||
    normalized.includes('merona') ||
    normalized.includes('blush') ||
    normalized.includes('cinta') ||
    normalized.includes('romantis') ||
    normalized.includes('menggoda') ||
    normalized.includes('sayang') ||
    normalized.includes('salah tingkah')
  ) {
    return {
      label: rawMood,
      emoji: '🌸',
      badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      textColor: 'text-rose-400',
      dotColor: 'bg-rose-400',
    };
  }

  // 2. Angry / Annoyed / Cold / Menacing
  if (
    normalized.includes('marah') ||
    normalized.includes('kesal') ||
    normalized.includes('geram') ||
    normalized.includes('jengkel') ||
    normalized.includes('dingin') ||
    normalized.includes('sinis') ||
    normalized.includes('ancam') ||
    normalized.includes('benci') ||
    normalized.includes('angry')
  ) {
    return {
      label: rawMood,
      emoji: '⚡',
      badgeClass: 'bg-red-500/15 text-red-300 border border-red-500/30',
      textColor: 'text-red-400',
      dotColor: 'bg-red-400',
    };
  }

  // 3. Anxious / Nervous / Panicked / Shocked
  if (
    normalized.includes('cemas') ||
    normalized.includes('gugup') ||
    normalized.includes('panik') ||
    normalized.includes('kaget') ||
    normalized.includes('terkejut') ||
    normalized.includes('khawatir') ||
    normalized.includes('takut') ||
    normalized.includes('bingung') ||
    normalized.includes('ragu') ||
    normalized.includes('nervous')
  ) {
    return {
      label: rawMood,
      emoji: '💧',
      badgeClass: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
      textColor: 'text-orange-400',
      dotColor: 'bg-orange-400',
    };
  }

  // 4. Happy / Joyful / Amused / Excited
  if (
    normalized.includes('senang') ||
    normalized.includes('gembira') ||
    normalized.includes('bahagia') ||
    normalized.includes('tertawa') ||
    normalized.includes('ceria') ||
    normalized.includes('riang') ||
    normalized.includes('semangat') ||
    normalized.includes('puas') ||
    normalized.includes('happy')
  ) {
    return {
      label: rawMood,
      emoji: '✨',
      badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      textColor: 'text-amber-400',
      dotColor: 'bg-amber-400',
    };
  }

  // 5. Sad / Melancholic / Hurt / Touched
  if (
    normalized.includes('sedih') ||
    normalized.includes('terharu') ||
    normalized.includes('murung') ||
    normalized.includes('kecewa') ||
    normalized.includes('menangis') ||
    normalized.includes('luka') ||
    normalized.includes('sepi') ||
    normalized.includes('sad')
  ) {
    return {
      label: rawMood,
      emoji: '💙',
      badgeClass: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
      textColor: 'text-blue-400',
      dotColor: 'bg-blue-400',
    };
  }

  // 6. Curious / Mysterious / Investigative / Thinking
  if (
    normalized.includes('penasaran') ||
    normalized.includes('pikir') ||
    normalized.includes('renung') ||
    normalized.includes('selidik') ||
    normalized.includes('misterius') ||
    normalized.includes('tertarik') ||
    normalized.includes('kagum') ||
    normalized.includes('curious')
  ) {
    return {
      label: rawMood,
      emoji: '🔮',
      badgeClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      textColor: 'text-purple-400',
      dotColor: 'bg-purple-400',
    };
  }

  // 7. Calm / Serious / Neutral / Wise (Fallback)
  return {
    label: rawMood,
    emoji: '🌿',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    textColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
  };
}

/**
 * Extracts [Mood: <mood>] tag from the raw AI response text and cleans the text.
 */
export function extractMoodFromText(rawText: string): {
  cleanText: string;
  mood: string | null;
  moodInfo: MoodBadgeInfo | null;
} {
  if (!rawText) {
    return { cleanText: '', mood: null, moodInfo: null };
  }

  // Match pattern: [Mood: <text>] or [mood: <text>] or [Suasana Hati: <text>]
  const moodRegex = /\[(?:Mood|mood|Suasana Hati|Status Emosi):\s*([^\]]+)\]/i;
  const match = rawText.match(moodRegex);

  if (match && match[1]) {
    const moodString = match[1].trim();
    // Remove the mood tag and any trailing newlines from clean text
    const clean = rawText.replace(moodRegex, '').trimEnd();
    return {
      cleanText: clean,
      mood: moodString,
      moodInfo: getMoodBadgeInfo(moodString),
    };
  }

  return {
    cleanText: rawText,
    mood: null,
    moodInfo: null,
  };
}
